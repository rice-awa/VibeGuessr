import uuid
import time
from config import (
    DIFFICULTY_CONFIG,
    QUESTIONS_PER_GAME,
    MAX_GUESSES_PER_QUESTION,
    HINT_SCORE_PENALTY,
    STREAK_BONUSES,
)

_sessions = {}


class GameSession:
    def __init__(self, difficulty):
        self.session_id = str(uuid.uuid4())
        self.difficulty = difficulty
        self.config = DIFFICULTY_CONFIG[difficulty]
        self.used_words = []
        self.current_question = None
        self.question_index = 0
        self.total_score = 0
        self.results = []
        self.streak = 0
        self.hints_used_current = 0
        self.guesses_current = 0
        self.question_start_time = None
        self.created_at = time.time()

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "difficulty": self.difficulty,
            "question_index": self.question_index,
            "total_questions": QUESTIONS_PER_GAME,
            "total_score": round(self.total_score, 1),
            "streak": self.streak,
        }


def create_session(difficulty):
    if difficulty not in DIFFICULTY_CONFIG:
        raise ValueError(f"Invalid difficulty: {difficulty}")
    session = GameSession(difficulty)
    _sessions[session.session_id] = session
    return session


def get_session(session_id):
    session = _sessions.get(session_id)
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
