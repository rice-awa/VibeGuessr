import os
import sys
import unittest
from unittest.mock import patch


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class NextQuestionFallbackTests(unittest.TestCase):
    def test_next_question_returns_text_mode_when_image_generation_fails(self):
        import app

        word_data = {
            "keyword": "猫",
            "visual_desc": "small household pet with pointed ears",
            "category": "动物",
            "hint1": "它常见于家中，行动很轻。",
            "hint2": "它喜欢追逐小球。",
            "hint3": "它会喵喵叫。",
        }

        with app.app.test_client() as client:
            start_response = client.post("/api/game/start", json={"difficulty": "easy"})
            session_id = start_response.get_json()["session_id"]

            with patch.object(app.llm_service, "generate_word", return_value=word_data), \
                    patch.object(app.image_service, "generate_image", side_effect=TimeoutError("too slow")):
                response = client.post("/api/game/next", json={"session_id": session_id})

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsNone(data["image"])
        self.assertEqual(data["image_mode"], "text")
        self.assertEqual(data["fallback_hint"], "它常见于家中，行动很轻。")
        self.assertIn("图片生成超时", data["image_status"])


if __name__ == "__main__":
    unittest.main()
