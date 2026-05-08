import requests
from config import API_BASE_URL, API_KEY, IMAGE_MODEL, IMAGE_SIZE, REQUEST_TIMEOUT


def generate_image(visual_desc, blur_prompt, image_strategy):
    prompt = (
        f"{image_strategy}. "
        f"Visual description: {visual_desc}. "
        f"Style: {blur_prompt}. "
        f"Do NOT include any text, letters, or words in the image."
    )

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    payload = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "n": 1,
        "size": IMAGE_SIZE,
    }

    resp = requests.post(
        f"{API_BASE_URL}/images/generations",
        headers=headers,
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return content


def generate_clear_image(visual_desc):
    prompt = (
        f"A clear, detailed, high-quality image. "
        f"Visual description: {visual_desc}. "
        f"Sharp focus, vivid colors, professional quality. "
        f"Do NOT include any text, letters, or words in the image."
    )

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    payload = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "n": 1,
        "size": IMAGE_SIZE,
    }

    resp = requests.post(
        f"{API_BASE_URL}/images/generations",
        headers=headers,
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return content
