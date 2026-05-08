import time

from config import (
    DIFFICULTY_CONFIG,
    QUESTIONS_PER_GAME,
    MAX_GUESSES_PER_QUESTION,
    HINT_SCORE_PENALTY,
    STREAK_BONUSES,
)
from models.game import GameSession, save_session, load_session


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
        "score": score,
        "match": judge_result["match"],
        "score_ratio": judge_result["score_ratio"],
        "time_used": round(elapsed, 1),
        "hints_used": session.hints_used_current,
    })
    session.total_score += score
    save_session(session)


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
