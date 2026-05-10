import importlib
import os
import sys
from contextlib import contextmanager
from unittest.mock import patch
import unittest


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@contextmanager
def temp_env(values):
    original = {}
    try:
        for key, value in values.items():
            original[key] = os.environ.get(key)
            os.environ[key] = value
        yield
    finally:
        for key, value in original.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload
        self.status_code = 200

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


def load_modules():
    import config
    from services import llm_service
    from services import image_service

    importlib.reload(config)
    importlib.reload(image_service)
    return importlib.reload(llm_service), image_service


class LLMServiceTests(unittest.TestCase):
    def test_analyze_image_builds_openai_multimodal_payload(self):
        with temp_env({
            "LLM_PROVIDER": "openai_compat",
            "LLM_API_BASE_URL": "https://proxy.example.com/v1",
            "LLM_API_KEY": "test-key",
            "LLM_CHAT_MODEL": "gpt-4o-mini",
            "LLM_VISION_MODEL": "gpt-4o-mini",
        }):
            llm_service, _ = load_modules()

            captured = {}

            def fake_post(url, headers=None, json=None, timeout=None):
                captured["url"] = url
                captured["headers"] = headers
                captured["json"] = json
                captured["timeout"] = timeout
                return FakeResponse({
                    "choices": [
                        {
                            "message": {
                                "content": "image ok"
                            }
                        }
                    ]
                })

            with patch.object(llm_service.requests, "post", side_effect=fake_post):
                result = llm_service.analyze_image(
                    image_base64="YWJjMTIz",
                    prompt="Describe this image",
                    mime_type="image/png",
                )

            self.assertEqual(result, "image ok")
            self.assertEqual(captured["url"], "https://proxy.example.com/v1/chat/completions")
            message = captured["json"]["messages"][0]
            self.assertEqual(message["role"], "user")
            self.assertIsInstance(message["content"], list)
            self.assertEqual(message["content"][0]["type"], "text")
            self.assertEqual(message["content"][1]["type"], "image_url")
            self.assertTrue(message["content"][1]["image_url"]["url"].startswith("data:image/png;base64,"))
            self.assertEqual(captured["json"]["model"], "gpt-4o-mini")

    def test_chat_uses_gemini_native_generate_content(self):
        with temp_env({
            "LLM_PROVIDER": "gemini_native",
            "LLM_API_BASE_URL": "https://proxy.example.com",
            "LLM_API_KEY": "test-key",
            "LLM_CHAT_MODEL": "gemini-2.5-flash",
            "LLM_VISION_MODEL": "gemini-2.5-flash",
        }):
            llm_service, _ = load_modules()

            captured = {}

            def fake_post(url, headers=None, json=None, timeout=None):
                captured["url"] = url
                captured["headers"] = headers
                captured["json"] = json
                captured["timeout"] = timeout
                return FakeResponse({
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {"text": "hello"}
                                ]
                            }
                        }
                    ]
                })

            with patch.object(llm_service.requests, "post", side_effect=fake_post):
                result = llm_service.chat([
                    {"role": "user", "content": "你好"}
                ])

            self.assertEqual(result, "hello")
            self.assertIn("/v1beta/models/gemini-2.5-flash:generateContent", captured["url"])
            self.assertEqual(captured["json"]["contents"][0]["parts"][0]["text"], "你好")

    def test_generate_word_parses_json_from_openai_compat(self):
        with temp_env({
            "LLM_PROVIDER": "openai_compat",
            "LLM_API_BASE_URL": "https://proxy.example.com/v1",
            "LLM_API_KEY": "test-key",
            "LLM_CHAT_MODEL": "gpt-4o-mini",
        }):
            llm_service, _ = load_modules()

            def fake_post(url, headers=None, json=None, timeout=None):
                return FakeResponse({
                    "choices": [
                        {
                            "message": {
                                "content": "{\"keyword\":\"猫\",\"visual_desc\":\"a cat\",\"category\":\"animal\",\"hint1\":\"小型宠物\",\"hint2\":\"会喵喵叫\",\"hint3\":\"常见家养动物\"}"
                            }
                        }
                    ]
                })

            with patch.object(llm_service.requests, "post", side_effect=fake_post):
                result = llm_service.generate_word("generate one word")

            self.assertEqual(result["keyword"], "猫")
            self.assertEqual(result["category"], "animal")

    def test_generate_image_accepts_common_openai_image_response(self):
        with temp_env({
            "IMAGE_API_BASE_URL": "https://proxy.example.com/v1",
            "IMAGE_API_KEY": "test-key",
            "IMAGE_MODEL": "gpt-image-2-all",
            "IMAGE_SIZE": "1024x1024",
        }):
            _, image_service = load_modules()

            captured = {}

            def fake_post(url, headers=None, json=None, timeout=None):
                captured["url"] = url
                captured["headers"] = headers
                captured["json"] = json
                captured["timeout"] = timeout
                return FakeResponse({
                    "data": [
                        {
                            "b64_json": "abc123"
                        }
                    ]
                })

            with patch.object(image_service.requests, "post", side_effect=fake_post):
                result = image_service.generate_image(
                    visual_desc="a red apple",
                    blur_prompt="soft focus",
                    image_strategy="generate a complete image",
                )

            self.assertEqual(result, "data:image/png;base64,abc123")
            self.assertEqual(captured["url"], "https://proxy.example.com/v1/images/generations")


if __name__ == "__main__":
    unittest.main()
