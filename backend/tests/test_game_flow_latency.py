import os
import sys
import unittest
from unittest.mock import patch


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class GameFlowLatencyTests(unittest.TestCase):
    def test_preloaded_question_is_consumed_by_next_endpoint(self):
        import app

        word_data = {
            "keyword": "猫",
            "visual_desc": "small household pet with pointed ears",
            "category": "动物",
            "hint1": "它常见于家中，行动很轻。",
            "hint2": "它喜欢追逐小球。",
            "hint3": "它会喵喵叫。",
        }

        with app.app.test_client() as client, \
                patch.object(app, "_start_preload"):
            start_response = client.post("/api/game/start", json={"difficulty": "easy"})
            session_id = start_response.get_json()["session_id"]

            with patch.object(app.llm_service, "generate_word", return_value=word_data), \
                    patch.object(app.image_service, "generate_image", return_value="data:image/png;base64,abc123"):
                app.game_service.preload_question(session_id)

            response = client.post("/api/game/next", json={"session_id": session_id})

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["question_index"], 1)
        self.assertEqual(data["image"], "data:image/png;base64,abc123")
        self.assertEqual(data["category"], "动物")
        self.assertEqual(data["fallback_hint"], "")

    def test_next_stream_emits_progressive_events(self):
        import app

        word_data = {
            "keyword": "猫",
            "visual_desc": "small household pet with pointed ears",
            "category": "动物",
            "hint1": "它常见于家中，行动很轻。",
            "hint2": "它喜欢追逐小球。",
            "hint3": "它会喵喵叫。",
        }

        with app.app.test_client() as client, \
                patch.object(app, "_start_preload"):
            start_response = client.post("/api/game/start", json={"difficulty": "easy"})
            session_id = start_response.get_json()["session_id"]

            with patch.object(app.llm_service, "generate_word", return_value=word_data), \
                    patch.object(app.image_service, "generate_image", return_value="data:image/png;base64,abc123"):
                response = client.get(f"/api/game/next/stream?session_id={session_id}")
                body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("event: word_ready", body)
        self.assertIn("event: image_ready", body)
        self.assertIn("event: done", body)
        self.assertIn('"category": "动物"', body)
        self.assertIn('"image": "data:image/png;base64,abc123"', body)


if __name__ == "__main__":
    unittest.main()
