from flask import Flask, request, jsonify
from flask_cors import CORS

from config import DIFFICULTY_CONFIG, MAX_RETRIES
from services import game_service, llm_service, image_service
from prompts.word_gen import build_word_gen_prompt
from prompts.judge import build_judge_prompt, build_knowledge_card_prompt

app = Flask(__name__)
CORS(app)


def _error(msg, status=400):
    return jsonify({"error": msg}), status


@app.route("/api/game/start", methods=["POST"])
def start_game():
    data = request.get_json(silent=True) or {}
    difficulty = data.get("difficulty", "easy")
    try:
        session = game_service.create_session(difficulty)
    except ValueError as e:
        return _error(str(e))
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
    if not session_id:
        return _error("session_id is required")

    try:
        session = game_service.get_session(session_id)
    except KeyError as e:
        return _error(str(e), 404)

    if game_service.is_game_over(session):
        return jsonify({"game_over": True, **session.to_dict()})

    diff_config = session.config
    prompt = build_word_gen_prompt(diff_config, session.used_words)

    retries = 0
    word_data = None
    while retries <= MAX_RETRIES:
        try:
            word_data = llm_service.generate_word(prompt)
            break
        except Exception:
            retries += 1
            if retries > MAX_RETRIES:
                return _error("Failed to generate word after retries", 502)

    try:
        image_data = image_service.generate_image(
            word_data["visual_desc"],
            diff_config["blur_prompt"],
            diff_config["image_strategy"],
        )
    except Exception:
        image_data = None

    game_service.set_current_question(session, word_data)

    return jsonify({
        "question_index": session.question_index,
        "total_questions": game_service.QUESTIONS_PER_GAME,
        "image": image_data,
        "category": word_data.get("category", ""),
        "time_limit": diff_config["time_limit"],
        "hints_remaining": diff_config["hints"],
        "session": session.to_dict(),
    })


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

    session.guesses_current += 1
    keyword = session.current_question["keyword"]

    prompt = build_judge_prompt(keyword, answer)
    try:
        judge_result = llm_service.judge_answer(prompt)
    except Exception:
        return _error("Failed to judge answer", 502)

    score_ratio = float(judge_result.get("score_ratio", 0))
    score = game_service.calculate_score(session, score_ratio)
    game_service.record_result(session, score, judge_result)

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

    session.hints_used_current += 1
    hint_key = f"hint{session.hints_used_current}"
    hint_text = session.current_question.get(hint_key, "暂无更多提示")

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
    app.run(host="0.0.0.0", port=5000, debug=True)
