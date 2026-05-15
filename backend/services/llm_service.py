import base64
import json
from typing import List, Dict, Any

import requests

from config import (
    LLM_PROVIDER,
    LLM_API_BASE_URL,
    LLM_API_KEY,
    LLM_CHAT_MODEL,
    LLM_VISION_MODEL,
    LLM_JSON_MODE,
    REQUEST_TIMEOUT,
    MAX_RETRIES,
)


def _strip_base_url(url):
    return (url or "").rstrip("/")


def _default_headers(api_key):
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
    }


def _looks_like_data_url(value):
    return isinstance(value, str) and value.startswith("data:")


def _to_data_url(image_base64, mime_type="image/png"):
    if not image_base64:
        return None
    if _looks_like_data_url(image_base64):
        return image_base64
    return f"data:{mime_type};base64,{image_base64}"


def _openai_message_from_parts(message):
    content = message.get("content")
    if isinstance(content, list):
        return {"role": message["role"], "content": content}
    return {"role": message["role"], "content": content}


def _gemini_parts_from_message(message):
    content = message.get("content")
    if isinstance(content, list):
        parts = []
        for part in content:
            if part.get("type") == "text":
                parts.append({"text": part["text"]})
            elif part.get("type") == "image_url":
                url = part.get("image_url", {}).get("url", "")
                if _looks_like_data_url(url):
                    _, encoded = url.split(",", 1)
                    parts.append({
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": encoded,
                        }
                    })
                else:
                    parts.append({"text": url})
        return {"role": message["role"], "parts": parts}
    return {"role": message["role"], "parts": [{"text": content}]}


def _request_json(url, headers, payload, timeout):
    last_error = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
            resp.raise_for_status()
            return resp.json()
        except (requests.Timeout, requests.ConnectionError) as e:
            last_error = e
            if attempt >= MAX_RETRIES:
                raise
    raise last_error


def _call_openai_compat(messages, model, temperature=0.8, json_mode=False):
    url = f"{_strip_base_url(LLM_API_BASE_URL)}/chat/completions"
    payload = {
        "model": model,
        "messages": [_openai_message_from_parts(m) for m in messages],
        "temperature": temperature,
        "stream": False,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    data = _request_json(url, _default_headers(LLM_API_KEY), payload, REQUEST_TIMEOUT)
    return data["choices"][0]["message"]["content"]


def _call_gemini_native(messages, model, temperature=0.8):
    url = f"{_strip_base_url(LLM_API_BASE_URL)}/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [_gemini_parts_from_message(m) for m in messages],
        "generationConfig": {
            "temperature": temperature,
        },
    }
    headers = _default_headers(LLM_API_KEY)
    headers.pop("Authorization", None)
    headers["x-goog-api-key"] = LLM_API_KEY
    data = _request_json(url, headers, payload, REQUEST_TIMEOUT)

    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    text_parts = [part.get("text", "") for part in parts if part.get("text")]
    return "".join(text_parts)


def chat(messages, temperature=0.8, json_mode=False, vision=False):
    model = LLM_VISION_MODEL if vision else LLM_CHAT_MODEL
    if LLM_PROVIDER == "gemini_native":
        return _call_gemini_native(messages, model, temperature=temperature)
    return _call_openai_compat(messages, model, temperature=temperature, json_mode=json_mode and LLM_JSON_MODE)


def chat_json(messages, temperature=0.8, vision=False):
    raw = chat(messages, temperature=temperature, json_mode=True, vision=vision)
    return json.loads(raw)


def analyze_image(image_base64=None, image_url=None, prompt="Describe the image", mime_type="image/png", temperature=0.2):
    if image_url:
        image_part = {"type": "image_url", "image_url": {"url": image_url}}
    else:
        image_part = {"type": "image_url", "image_url": {"url": _to_data_url(image_base64, mime_type=mime_type)}}
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                image_part,
            ],
        }
    ]
    return chat(messages, temperature=temperature, vision=True)


def generate_word(prompt_text):
    messages = [
        {"role": "system", "content": "你是猜词游戏的出题官，只返回JSON格式。"},
        {"role": "user", "content": prompt_text},
    ]
    return chat_json(messages, temperature=1.15)


def judge_answer(prompt_text):
    messages = [
        {"role": "system", "content": "你是猜词游戏的裁判，只返回JSON格式。"},
        {"role": "user", "content": prompt_text},
    ]
    return chat_json(messages, temperature=0.1)


def generate_knowledge_card(prompt_text):
    messages = [
        {"role": "user", "content": prompt_text},
    ]
    return chat(messages, temperature=0.7, json_mode=False)
