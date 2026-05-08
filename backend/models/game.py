import sqlite3
import json
import uuid
import time

from config import DIFFICULTY_CONFIG, QUESTIONS_PER_GAME, DB_PATH


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS game_sessions (
            session_id TEXT PRIMARY KEY,
            difficulty TEXT NOT NULL,
            used_words TEXT NOT NULL DEFAULT '[]',
            current_question TEXT,
            question_index INTEGER NOT NULL DEFAULT 0,
            total_score REAL NOT NULL DEFAULT 0,
            results TEXT NOT NULL DEFAULT '[]',
            streak INTEGER NOT NULL DEFAULT 0,
            hints_used_current INTEGER NOT NULL DEFAULT 0,
            guesses_current INTEGER NOT NULL DEFAULT 0,
            question_start_time REAL,
            created_at REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()


class GameSession:
    def __init__(self, difficulty, session_id=None):
        self.session_id = session_id or str(uuid.uuid4())
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


def save_session(session):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """INSERT OR REPLACE INTO game_sessions
           (session_id, difficulty, used_words, current_question, question_index,
            total_score, results, streak, hints_used_current, guesses_current,
            question_start_time, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            session.session_id,
            session.difficulty,
            json.dumps(session.used_words, ensure_ascii=False),
            json.dumps(session.current_question, ensure_ascii=False) if session.current_question else None,
            session.question_index,
            session.total_score,
            json.dumps(session.results, ensure_ascii=False),
            session.streak,
            session.hints_used_current,
            session.guesses_current,
            session.question_start_time,
            session.created_at,
        ),
    )
    conn.commit()
    conn.close()


def load_session(session_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT * FROM game_sessions WHERE session_id = ?", (session_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    session = GameSession(row["difficulty"], session_id=row["session_id"])
    session.used_words = json.loads(row["used_words"])
    session.current_question = json.loads(row["current_question"]) if row["current_question"] else None
    session.question_index = row["question_index"]
    session.total_score = row["total_score"]
    session.results = json.loads(row["results"])
    session.streak = row["streak"]
    session.hints_used_current = row["hints_used_current"]
    session.guesses_current = row["guesses_current"]
    session.question_start_time = row["question_start_time"]
    session.created_at = row["created_at"]
    return session


def delete_session(session_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM game_sessions WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()
