import json
from datetime import datetime

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS

from config import DIFFICULTY_CONFIG, MAX_RETRIES
from models.game import init_db
from services import game_service, llm_service, image_service
from prompts.word_gen import build_word_gen_prompt
from prompts.judge import build_judge_prompt, build_knowledge_card_prompt

app = Flask(__name__)
CORS(app)

init_db()


def _error(msg, status=400):
    return jsonify({"error": msg}), status


def _log(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [VibeGuessr] {message}", flush=True)


def _start_preload(session_id):
    session = game_service.get_session(session_id)
    if session.question_index <= 0 or game_service.is_game_over(session):
        return
    game_service.start_preload(session_id)


@app.before_request
def log_request_start():
    if request.path.startswith("/api/"):
        _log(f"request {request.method} {request.path}")


@app.route("/api/game/start", methods=["POST"])
def start_game():
    data = request.get_json(silent=True) or {}
    difficulty = data.get("difficulty", "easy")
    _log(f"start_game difficulty={difficulty}")
    try:
        session = game_service.create_session(difficulty)
    except ValueError as e:
        _log(f"start_game failed difficulty={difficulty} error={e}")
        return _error(str(e))
    _log(f"start_game ok session_id={session.session_id}")
    _start_preload(session.session_id)
    return jsonify({
        "session_id": session.session_id,
        "difficulty": difficulty,
        "config": {
            "hints": session.config["hints"],
            "time_limit": session.config["time_limit"],
            "base_score": session.config["base_score"],
            "total_questions": game_service.QUESTIONS_PER_GAME,
        },
    })


@app.route("/api/game/next", methods=["POST"])
def next_question():
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    prefer_preloaded = bool(data.get("prefer_preloaded"))
    if not session_id:
        return _error("session_id is required")

    try:
        session = game_service.get_session(session_id)
    except KeyError as e:
        return _error(str(e), 404)

    if game_service.is_game_over(session):
        _log(f"next_question game_over session_id={session_id}")
        return jsonify({"game_over": True, **session.to_dict()})

    preloaded = game_service.reserve_preloaded_question(session)
    if preloaded:
        _log(f"next_question preload_hit session_id={session_id} keyword={preloaded.get('keyword')}")
        game_service.set_current_question(session, preloaded)
        _start_preload(session_id)
        return jsonify({
            "question_index": session.question_index,
            "total_questions": game_service.QUESTIONS_PER_GAME,
            "image": preloaded["image"],
            "image_mode": preloaded["image_mode"],
            "image_status": preloaded["image_status"],
            "fallback_hint": preloaded["fallback_hint"],
            "category": preloaded.get("category", ""),
            "time_limit": preloaded["time_limit"],
            "hints_remaining": preloaded["hints_remaining"],
            "session": session.to_dict(),
        })

    if prefer_preloaded:
        return jsonify({
            "preloaded": False,
            "preload_status": session.preload_status,
            "question_index": session.question_index,
            "total_questions": game_service.QUESTIONS_PER_GAME,
        })

    try:
        _log(f"next_question generating_live session_id={session_id}")
        question = game_service.generate_question(session)
        _log(f"next_question generated_live session_id={session_id} keyword={question.get('keyword')}")
    except Exception as e:
        _log(f"next_question failed session_id={session_id} error={e}")
        return _error("Failed to generate question", 502)

    game_service.set_current_question(session, question)
    _start_preload(session_id)
    _log(f"next_question ok session_id={session_id} question_index={session.question_index}")

    return jsonify({
        "question_index": session.question_index,
        "total_questions": game_service.QUESTIONS_PER_GAME,
        "image": question["image"],
        "image_mode": question["image_mode"],
        "image_status": question["image_status"],
        "fallback_hint": question["fallback_hint"],
        "category": question.get("category", ""),
        "time_limit": question["time_limit"],
        "hints_remaining": question["hints_remaining"],
        "session": session.to_dict(),
    })


@app.route("/api/game/next/stream", methods=["GET"])
def next_question_stream():
    session_id = request.args.get("session_id")
    if not session_id:
        return _error("session_id is required")

    try:
        session = game_service.get_session(session_id)
    except KeyError as e:
        return _error(str(e), 404)

    if game_service.is_game_over(session):
        return jsonify({"game_over": True, **session.to_dict()})

    def emit(event, payload):
        return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"

    @stream_with_context
    def generate():
        preloaded = game_service.reserve_preloaded_question(session)
        if preloaded:
            game_service.set_current_question(session, preloaded)
            _start_preload(session_id)
            yield emit("word_ready", {
                "category": preloaded.get("category", ""),
                "hints": [preloaded.get("hint1", ""), preloaded.get("hint2", ""), preloaded.get("hint3", "")],
                "question_index": session.question_index,
                "total_questions": game_service.QUESTIONS_PER_GAME,
                "time_limit": preloaded["time_limit"],
                "hints_remaining": preloaded["hints_remaining"],
            })
            yield emit("image_ready", {
                "image": preloaded["image"],
                "category": preloaded.get("category", ""),
                "question_index": session.question_index,
                "total_questions": game_service.QUESTIONS_PER_GAME,
                "fallback": preloaded["image_mode"] != "image",
                "image_mode": preloaded["image_mode"],
                "image_status": preloaded["image_status"],
            })
            yield emit("done", {"ok": True})
            return

        diff_config = session.config
        prompt = build_word_gen_prompt(diff_config, session.used_words)
        retries = 0
        word_data = None
        while retries <= MAX_RETRIES:
            try:
                _log(f"next_stream generating_word session_id={session_id} attempt={retries + 1}")
                word_data = llm_service.generate_word(prompt)
                break
            except Exception as e:
                retries += 1
                if retries > MAX_RETRIES:
                    yield emit("error", {"message": "关键词生成失败"})
                    return
        yield emit("word_ready", {
            "category": word_data.get("category", ""),
            "hints": [word_data.get("hint1", ""), word_data.get("hint2", ""), word_data.get("hint3", "")],
            "question_index": session.question_index,
            "total_questions": game_service.QUESTIONS_PER_GAME,
            "time_limit": diff_config["time_limit"],
            "hints_remaining": diff_config["hints"],
        })

        try:
            image_data = image_service.generate_image(
                word_data["visual_desc"],
                diff_config["blur_prompt"],
                diff_config["image_strategy"],
            )
        except Exception:
            image_data = None

        question = game_service._build_question(diff_config, session.used_words, word_data, image_data)
        game_service.set_current_question(session, question)
        _start_preload(session_id)
        yield emit("image_ready", {
            "image": question["image"],
            "category": question.get("category", ""),
            "question_index": session.question_index,
            "total_questions": game_service.QUESTIONS_PER_GAME,
            "fallback": question["image_mode"] != "image",
            "image_mode": question["image_mode"],
            "image_status": question["image_status"],
        })
        yield emit("done", {"ok": True})

    response = Response(generate(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response


@app.route("/api/game/guess", methods=["POST"])
def guess():
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    answer = data.get("answer", "").strip()

    if not session_id:
        return _error("session_id is required")
    if not answer:
        return _error("answer is required")

    try:
        session = game_service.get_session(session_id)
    except KeyError as e:
        return _error(str(e), 404)

    if not session.current_question:
        return _error("No active question")

    if not game_service.can_guess(session):
        return _error("Max guesses reached for this question")

    game_service.use_guess(session)
    keyword = session.current_question["keyword"]

    prompt = build_judge_prompt(keyword, answer)
    try:
        judge_result = llm_service.judge_answer(prompt)
    except Exception:
        judge_result = {
            "match": "wrong",
            "score_ratio": 0,
            "feedback": "AI 裁判暂时不在线，本次判定为未命中",
        }

    score_ratio = float(judge_result.get("score_ratio", 0))
    score = game_service.calculate_score(session, score_ratio)
    game_service.record_result(session, score, judge_result)
    if score_ratio >= 0.6 or not game_service.can_guess(session):
        _start_preload(session_id)

    return jsonify({
        "match": judge_result["match"],
        "score_ratio": score_ratio,
        "score": score,
        "feedback": judge_result.get("feedback", ""),
        "keyword": keyword if score_ratio < 0.6 and not game_service.can_guess(session) else None,
        "guesses_remaining": game_service.MAX_GUESSES_PER_QUESTION - session.guesses_current,
        "session": session.to_dict(),
    })


@app.route("/api/game/hint", methods=["POST"])
def get_hint():
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")

    if not session_id:
        return _error("session_id is required")

    try:
        session = game_service.get_session(session_id)
    except KeyError as e:
        return _error(str(e), 404)

    if not session.current_question:
        return _error("No active question")

    if not game_service.can_get_hint(session):
        return _error("No hints remaining")

    hint_text = game_service.use_hint(session)

    return jsonify({
        "hint": hint_text,
        "hint_level": session.hints_used_current,
        "hints_remaining": session.config["hints"] - session.hints_used_current,
    })


@app.route("/api/game/reveal", methods=["POST"])
def reveal():
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")

    if not session_id:
        return _error("session_id is required")

    try:
        session = game_service.get_session(session_id)
    except KeyError as e:
        return _error(str(e), 404)

    if not session.current_question:
        return _error("No active question")

    keyword = session.current_question["keyword"]
    visual_desc = session.current_question["visual_desc"]

    clear_image = None
    try:
        clear_image = image_service.generate_clear_image(visual_desc)
    except Exception:
        pass

    knowledge = ""
    try:
        prompt = build_knowledge_card_prompt(keyword)
        knowledge = llm_service.generate_knowledge_card(prompt)
    except Exception:
        pass

    return jsonify({
        "keyword": keyword,
        "clear_image": clear_image,
        "knowledge": knowledge,
        "game_over": game_service.is_game_over(session),
    })


@app.route("/api/game/result", methods=["GET"])
def get_result():
    session_id = request.args.get("session_id")
    if not session_id:
        return _error("session_id is required")

    try:
        session = game_service.get_session(session_id)
    except KeyError as e:
        return _error(str(e), 404)

    return jsonify(game_service.get_game_summary(session))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
