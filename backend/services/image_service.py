import base64
import binascii
from io import BytesIO
import re

from PIL import Image, ImageFilter
import requests
from config import IMAGE_API_BASE_URL, IMAGE_API_KEY, IMAGE_MODEL, IMAGE_SIZE, IMAGE_REQUEST_TIMEOUT, MAX_RETRIES


DATA_IMAGE_RE = re.compile(r"data:image/[^;\s]+;base64,[A-Za-z0-9+/=\s]+")
DATA_IMAGE_FULL_RE = re.compile(r"^data:image/[^;\s]+;base64,(?P<data>[A-Za-z0-9+/=\s]+)$")


def _image_mime_from_bytes(raw):
    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if raw.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if raw.startswith(b"GIF87a") or raw.startswith(b"GIF89a"):
        return "image/gif"
    if len(raw) >= 12 and raw.startswith(b"RIFF") and raw[8:12] == b"WEBP":
        return "image/webp"
    return None


def _decode_image_base64(content):
    encoded = re.sub(r"\s+", "", content)
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        return None, None
    return encoded, _image_mime_from_bytes(raw)


def _normalize_image_response(content):
    if not content or not isinstance(content, str):
        return None
    content = content.strip()
    if content.startswith(("http://", "https://")):
        return content
    if content.startswith("data:image/"):
        return content
    if content.startswith("data:"):
        return None

    data_image_match = DATA_IMAGE_RE.search(content)
    if data_image_match:
        return data_image_match.group(0)

    encoded, mime_type = _decode_image_base64(content)
    if not mime_type:
        return None
    return f"data:{mime_type};base64,{encoded}"


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


def _blur_data_image(image_data_url, radius):
    match = DATA_IMAGE_FULL_RE.match(image_data_url or "")
    if not match:
        return None

    try:
        raw = base64.b64decode(re.sub(r"\s+", "", match.group("data")), validate=True)
        with Image.open(BytesIO(raw)) as image:
            output = BytesIO()
            image.convert("RGBA").filter(ImageFilter.GaussianBlur(radius)).save(output, format="PNG")
    except (binascii.Error, OSError, ValueError):
        return None

    encoded = base64.b64encode(output.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


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


def generate_image(visual_desc, blur_prompt, image_strategy, blur_radius):
    prompt = (
        f"{image_strategy}. "
        f"Visual description: {visual_desc}. "
        f"Style: {blur_prompt}. "
        f"Do NOT include any text, letters, or words in the image."
    )
    image_data = _request_image(prompt)
    return _blur_data_image(image_data, blur_radius)


def generate_clear_image(visual_desc):
    prompt = (
        f"A clear, detailed, high-quality image. "
        f"Visual description: {visual_desc}. "
        f"Sharp focus, vivid colors, professional quality. "
        f"Do NOT include any text, letters, or words in the image."
    )
    return _request_image(prompt)
