import json
import requests
from config import API_BASE_URL, API_KEY, LLM_MODEL, REQUEST_TIMEOUT


def _chat(messages, temperature=0.8, json_mode=True):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": temperature,
        "stream": False,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    resp = requests.post(
        f"{API_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return content


def generate_word(prompt_text):
    messages = [
        {"role": "system", "content": "你是猜词游戏的出题官，只返回JSON格式。"},
        {"role": "user", "content": prompt_text},
    ]
    raw = _chat(messages, temperature=0.8, json_mode=True)
    return json.loads(raw)


def judge_answer(prompt_text):
    messages = [
        {"role": "system", "content": "你是猜词游戏的裁判，只返回JSON格式。"},
        {"role": "user", "content": prompt_text},
    ]
    raw = _chat(messages, temperature=0.1, json_mode=True)
    return json.loads(raw)


def generate_knowledge_card(prompt_text):
    messages = [
        {"role": "user", "content": prompt_text},
    ]
    return _chat(messages, temperature=0.7, json_mode=False)
