import requests
from config import OPENAI_API_BASE_URL, OPENAI_API_KEY, IMAGE_MODEL, IMAGE_SIZE, IMAGE_REQUEST_TIMEOUT, MAX_RETRIES


def _normalize_image_response(content):
    if not content:
        return None
    content = content.strip()
    if content.startswith(("http://", "https://")):
        return content
    if content.startswith("data:"):
        return content
    return f"data:image/png;base64,{content}"


def _request_image(prompt):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
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
                f"{OPENAI_API_BASE_URL}/images/generations",
                headers=headers,
                json=payload,
                timeout=IMAGE_REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
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
