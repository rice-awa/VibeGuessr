import requests
from config import IMAGE_API_BASE_URL, IMAGE_API_KEY, IMAGE_MODEL, IMAGE_SIZE, IMAGE_REQUEST_TIMEOUT, MAX_RETRIES


def _normalize_image_response(content):
    if not content:
        return None
    content = content.strip()
    if content.startswith(("http://", "https://")):
        return content
    if content.startswith("data:"):
        return content
    return f"data:image/png;base64,{content}"


def _extract_image_content(data):
    if not data:
        return None
    if isinstance(data, dict):
        if data.get("data") and isinstance(data["data"], list):
            first = data["data"][0] if data["data"] else None
            if isinstance(first, dict):
                content = first.get("b64_json") or first.get("url") or first.get("content")
                return _normalize_image_response(content)
        choices = data.get("choices")
        if choices:
            message = choices[0].get("message", {})
            content = message.get("content")
            if isinstance(content, str):
                return _normalize_image_response(content)
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict):
                        if item.get("b64_json"):
                            return _normalize_image_response(item["b64_json"])
                        if item.get("image_url", {}).get("url"):
                            return _normalize_image_response(item["image_url"]["url"])
    return None


def _request_image(prompt):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {IMAGE_API_KEY}",
    }
    payload = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "n": 1,
        "size": IMAGE_SIZE,
    }

    last_error = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.post(
                f"{IMAGE_API_BASE_URL}/images/generations",
                headers=headers,
                json=payload,
                timeout=IMAGE_REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            content = _extract_image_content(data)
            return _normalize_image_response(content)
        except (requests.Timeout, requests.ConnectionError) as e:
            last_error = e
            if attempt >= MAX_RETRIES:
                raise
    raise last_error


def generate_image(visual_desc, blur_prompt, image_strategy):
    prompt = (
        f"{image_strategy}. "
        f"Visual description: {visual_desc}. "
        f"Style: {blur_prompt}. "
        f"Do NOT include any text, letters, or words in the image."
    )
    return _request_image(prompt)


def generate_clear_image(visual_desc):
    prompt = (
        f"A clear, detailed, high-quality image. "
        f"Visual description: {visual_desc}. "
        f"Sharp focus, vivid colors, professional quality. "
        f"Do NOT include any text, letters, or words in the image."
    )
    return _request_image(prompt)
