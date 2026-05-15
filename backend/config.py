import os
from dotenv import load_dotenv

load_dotenv()


def _env_secret(name, fallback=""):
    value = os.getenv(name, "")
    if value and not value.startswith(("sk-your-", "your-")):
        return value
    return fallback


LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai_compat")

GEMINI_API_BASE_URL = os.getenv("GEMINI_API_BASE_URL", "")
GEMINI_API_KEY = _env_secret("GEMINI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")

LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", GEMINI_API_BASE_URL).rstrip("/")
LLM_API_KEY = _env_secret("LLM_API_KEY", GEMINI_API_KEY)
LLM_CHAT_MODEL = os.getenv("LLM_CHAT_MODEL", LLM_MODEL)
LLM_VISION_MODEL = os.getenv("LLM_VISION_MODEL", LLM_CHAT_MODEL)
LLM_JSON_MODE = os.getenv("LLM_JSON_MODE", "true").lower() in {"1", "true", "yes", "on"}

OPENAI_API_BASE_URL = os.getenv("OPENAI_API_BASE_URL", "")
OPENAI_API_KEY = _env_secret("OPENAI_API_KEY")
IMAGE_API_BASE_URL = os.getenv("IMAGE_API_BASE_URL", OPENAI_API_BASE_URL).rstrip("/")
IMAGE_API_KEY = _env_secret("IMAGE_API_KEY", OPENAI_API_KEY)
IMAGE_MODEL = os.getenv("IMAGE_MODEL", "gpt-image-2-all")
IMAGE_SIZE = os.getenv("IMAGE_SIZE", "1024x1024")

REQUEST_TIMEOUT = 15
IMAGE_REQUEST_TIMEOUT = int(os.getenv("IMAGE_REQUEST_TIMEOUT", "60"))
MAX_RETRIES = 1

DB_PATH = os.path.join(os.path.dirname(__file__), "game.db")

DIFFICULTY_CONFIG = {
    "easy": {
        "label": "简单",
        "word_scope": "常见动物、食物、日用品",
        "hints": 3,
        "time_limit": 60,
        "base_score": 10,
        "blur_prompt": "slightly blurry, soft focus, the outline is recognizable",
        "image_strategy": "generate a complete image based on the visual description",
    },
    "medium": {
        "label": "中等",
        "word_scope": "职业、运动、地标建筑",
        "category_pool": ["职业", "运动", "地标建筑", "交通工具", "乐器", "自然景观", "历史文化", "科技产品"],
        "hints": 2,
        "time_limit": 45,
        "base_score": 20,
        "blur_prompt": "blurry, out of focus, abstract, partial close-up or unusual angle",
        "image_strategy": "generate a partial close-up or non-typical angle",
    },
    "hard": {
        "label": "困难",
        "word_scope": "抽象概念、成语、复合词汇",
        "hints": 1,
        "time_limit": 30,
        "base_score": 40,
        "blur_prompt": "very blurry, heavily abstracted, minimal detail, almost unrecognizable",
        "image_strategy": "extract only abstract visual elements",
    },
}

QUESTIONS_PER_GAME = 10
MAX_GUESSES_PER_QUESTION = 3
HINT_SCORE_PENALTY = 0.3
STREAK_BONUSES = {3: 0.10, 5: 0.20, 10: 0.50}
