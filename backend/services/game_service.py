import time
import threading
import random
from concurrent.futures import ThreadPoolExecutor

from config import (
    DIFFICULTY_CONFIG,
    QUESTIONS_PER_GAME,
    MAX_GUESSES_PER_QUESTION,
    MAX_RETRIES,
    HINT_SCORE_PENALTY,
    STREAK_BONUSES,
)
from models.game import GameSession, save_session, load_session

PRELOAD_EXECUTOR = ThreadPoolExecutor(max_workers=4)
PRELOAD_LOCKS = {}
PRELOAD_LOCKS_GUARD = threading.Lock()


def _preload_lock(session_id):
    with PRELOAD_LOCKS_GUARD:
        if session_id not in PRELOAD_LOCKS:
            PRELOAD_LOCKS[session_id] = threading.Lock()
        return PRELOAD_LOCKS[session_id]


def create_session(difficulty):
    if difficulty not in DIFFICULTY_CONFIG:
        raise ValueError(f"Invalid difficulty: {difficulty}")
    session = GameSession(difficulty)
    save_session(session)
    return session


def get_session(session_id):
    session = load_session(session_id)
    if not session:
        raise KeyError(f"Session not found: {session_id}")
    return session


def set_current_question(session, question_data):
    session.current_question = question_data
    session.hints_used_current = 0
    session.guesses_current = 0
    session.question_index += 1
    session.used_words.append(question_data["keyword"])
    session.question_start_time = time.time()
    session.preloaded_question = None
    session.preload_status = "idle"
    session.preload_error = ""
    save_session(session)


def use_guess(session):
    session.guesses_current += 1
    save_session(session)


def use_hint(session):
    session.hints_used_current += 1
    save_session(session)
    hint_key = f"hint{session.hints_used_current}"
    return session.current_question.get(hint_key, "暂无更多提示")


def calculate_score(session, score_ratio):
    base = session.config["base_score"]
    time_limit = session.config["time_limit"]

    elapsed = time.time() - session.question_start_time
    remaining_ratio = max(0, (time_limit - elapsed) / time_limit)
    time_bonus = 0.5 + 0.5 * remaining_ratio

    hint_penalty = 1.0 - (session.hints_used_current * HINT_SCORE_PENALTY)
    hint_penalty = max(0.1, hint_penalty)

    score = base * score_ratio * time_bonus * hint_penalty

    if score_ratio >= 0.6:
        session.streak += 1
        for threshold in sorted(STREAK_BONUSES.keys(), reverse=True):
            if session.streak >= threshold:
                score *= 1 + STREAK_BONUSES[threshold]
                break
    else:
        session.streak = 0

    return round(score, 1)


def record_result(session, score, judge_result):
    elapsed = time.time() - session.question_start_time
    session.results.append({
        "question_index": session.question_index,
        "keyword": session.current_question["keyword"],
        "category": session.current_question.get("category", ""),
        "score": score,
        "match": judge_result["match"],
        "score_ratio": judge_result["score_ratio"],
        "time_used": round(elapsed, 1),
        "hints_used": session.hints_used_current,
    })
    session.total_score += score
    save_session(session)


def _build_question(diff_config, used_words, word_data, image_data):
    image_mode = "image"
    image_status = "ready"
    fallback_hint = ""

    if not image_data:
        image_mode = "text"
        image_status = "图片生成超时，已切换到纯文字提示模式"
        fallback_hint = word_data.get("hint1", "")

    return {
        "keyword": word_data["keyword"],
        "visual_desc": word_data["visual_desc"],
        "category": word_data.get("category", ""),
        "hint1": word_data.get("hint1", ""),
        "hint2": word_data.get("hint2", ""),
        "hint3": word_data.get("hint3", ""),
        "image": image_data,
        "image_mode": image_mode,
        "image_status": image_status,
        "fallback_hint": fallback_hint,
        "time_limit": diff_config["time_limit"],
        "hints_remaining": diff_config["hints"],
    }


def generate_question(session):
    from prompts.word_gen import build_word_gen_prompt
    from services import llm_service, image_service

    diff_config = session.config
    recent_categories = [
        result.get("category")
        for result in session.results[-2:]
        if result.get("category")
    ]
    if session.current_question and session.current_question.get("category"):
        recent_categories.append(session.current_question["category"])
    recent_categories = recent_categories[-2:]
    target_category = None
    category_pool = diff_config.get("category_pool", [])
    if category_pool:
        available_categories = [category for category in category_pool if category not in recent_categories]
        target_category = random.choice(available_categories or category_pool)
    prompt = build_word_gen_prompt(diff_config, session.used_words, recent_categories, target_category)

    retries = 0
    while retries <= MAX_RETRIES:
        try:
            word_data = llm_service.generate_word(prompt)
            break
        except Exception:
            retries += 1
            if retries > MAX_RETRIES:
                raise

    try:
        image_data = image_service.generate_image(
            word_data["visual_desc"],
            diff_config["blur_prompt"],
            diff_config["image_strategy"],
        )
    except Exception:
        image_data = None

    return _build_question(diff_config, session.used_words, word_data, image_data)


def preload_question(session_id):
    session = get_session(session_id)
    source_question_index = session.question_index
    lock = _preload_lock(session_id)
    with lock:
        if session.preload_status == "loading":
            return session.preloaded_question
        if session.preloaded_question:
            return session.preloaded_question
        session.preload_status = "loading"
        session.preload_error = ""
        save_session(session)

    try:
        question = generate_question(session)
        session = get_session(session_id)
        if session.question_index != source_question_index:
            return None
        with lock:
            session.preloaded_question = question
            session.preload_status = "ready"
            session.preload_error = ""
            save_session(session)
        return question
    except Exception as exc:
        session = get_session(session_id)
        with lock:
            session.preloaded_question = None
            session.preload_status = "error"
            session.preload_error = str(exc)
            save_session(session)
        return None


def reserve_preloaded_question(session):
    question = session.preloaded_question
    if not question:
        return None
    session.preloaded_question = None
    session.preload_status = "idle"
    session.preload_error = ""
    save_session(session)
    return question


def start_preload(session_id):
    PRELOAD_EXECUTOR.submit(preload_question, session_id)


def get_game_summary(session):
    results = session.results
    if not results:
        return {"total_score": 0, "accuracy": 0, "avg_time": 0, "results": []}

    correct = sum(1 for r in results if r["match"] in ("exact", "close"))
    total_time = sum(r["time_used"] for r in results)

    best = max(results, key=lambda r: r["score"])

    return {
        "total_score": round(session.total_score, 1),
        "max_possible_score": QUESTIONS_PER_GAME * session.config["base_score"],
        "accuracy": round(correct / len(results) * 100, 1),
        "avg_time": round(total_time / len(results), 1),
        "best_question": best,
        "total_questions": QUESTIONS_PER_GAME,
        "answered_questions": len(results),
        "difficulty": session.difficulty,
        "results": results,
    }


def can_guess(session):
    return session.guesses_current < MAX_GUESSES_PER_QUESTION


def can_get_hint(session):
    return session.hints_used_current < session.config["hints"]


def is_game_over(session):
    return session.question_index >= QUESTIONS_PER_GAME
