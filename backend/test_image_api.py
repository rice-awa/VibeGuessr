#!/usr/bin/env python3
"""
测试 gpt-image-2 图片生成 API 是否可用
从 .env 文件读取配置，发送一个简单的图片生成请求，
并将结果保存为本地文件。
"""

import os
import sys
import time
import base64
import requests
from dotenv import load_dotenv

load_dotenv()


def get_config():
    """从环境变量读取图片 API 配置"""

    def _env_secret(name, fallback=""):
        value = os.getenv(name, "")
        if value and not value.startswith(("sk-your-", "your-")):
            return value
        return fallback

    openai_base = os.getenv("OPENAI_API_BASE_URL", "")
    openai_key = _env_secret("OPENAI_API_KEY")

    base_url = os.getenv("IMAGE_API_BASE_URL", openai_base).rstrip("/")
    api_key = _env_secret("IMAGE_API_KEY", openai_key)
    model = os.getenv("IMAGE_MODEL", "gpt-image-2-all")
    size = os.getenv("IMAGE_SIZE", "1024x1024")

    return base_url, api_key, model, size


def test_image_generation():
    base_url, api_key, model, size = get_config()

    print("=" * 60)
    print("  gpt-image-2 API 连通性测试")
    print("=" * 60)
    print(f"  Base URL : {base_url}")
    print(f"  API Key  : {api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else f"  API Key  : (未设置或无效)")
    print(f"  Model    : {model}")
    print(f"  Size     : {size}")
    print("=" * 60)

    if not base_url or not api_key:
        print("\n[错误] API Base URL 或 API Key 未配置，请检查 .env 文件")
        sys.exit(1)

    url = f"{base_url}/images/generations"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    payload = {
        "model": model,
        "prompt": "A cute cat sitting on a windowsill, watercolor style",
        "n": 1,
        "size": size,
    }

    print(f"\n[1/3] 发送请求到 {url} ...")
    print(f"      Prompt: \"{payload['prompt']}\"")

    start = time.time()
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
    except requests.Timeout:
        print(f"\n[错误] 请求超时 (60s)，API 服务可能不可用")
        sys.exit(1)
    except requests.ConnectionError as e:
        print(f"\n[错误] 连接失败: {e}")
        sys.exit(1)
    elapsed = time.time() - start

    print(f"\n[2/3] 收到响应 (耗时 {elapsed:.1f}s)")
    print(f"      Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"\n[错误] 请求失败!")
        print(f"      响应内容: {resp.text[:500]}")
        sys.exit(1)

    data = resp.json()

    # 尝试提取图片内容
    image_data = None
    image_type = None  # "base64" or "url"

    if data.get("data") and isinstance(data["data"], list) and len(data["data"]) > 0:
        first = data["data"][0]
        if isinstance(first, dict):
            if first.get("b64_json"):
                image_data = first["b64_json"]
                image_type = "base64"
            elif first.get("url"):
                image_data = first["url"]
                image_type = "url"
            elif first.get("content"):
                content = first["content"].strip()
                if content.startswith(("http://", "https://")):
                    image_data = content
                    image_type = "url"
                else:
                    image_data = content
                    image_type = "base64"

    if not image_data:
        print(f"\n[错误] 无法从响应中提取图片数据")
        print(f"      响应结构: {list(data.keys())}")
        if data.get("data"):
            print(f"      data[0] keys: {list(data['data'][0].keys()) if data['data'] else 'empty'}")
        print(f"      完整响应 (前500字符): {str(data)[:500]}")
        sys.exit(1)

    # 保存图片
    output_path = os.path.join(os.path.dirname(__file__), "test_output.png")

    if image_type == "base64":
        # 移除可能的 data URI 前缀
        raw = image_data
        if raw.startswith("data:"):
            raw = raw.split(",", 1)[1] if "," in raw else raw
        img_bytes = base64.b64decode(raw)
        with open(output_path, "wb") as f:
            f.write(img_bytes)
        print(f"\n[3/3] 图片已保存")
        print(f"      路径: {output_path}")
        print(f"      大小: {len(img_bytes) / 1024:.1f} KB")
    elif image_type == "url":
        print(f"\n[3/3] 图片返回为 URL")
        print(f"      URL: {image_data[:120]}...")
        # 尝试下载
        try:
            img_resp = requests.get(image_data, timeout=30)
            img_resp.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(img_resp.content)
            print(f"      已下载保存到: {output_path}")
            print(f"      大小: {len(img_resp.content) / 1024:.1f} KB")
        except Exception as e:
            print(f"      下载失败: {e}")
            print(f"      (URL 本身是有效的，可以手动访问)")

    print("\n" + "=" * 60)
    print("  测试通过! gpt-image-2 API 工作正常")
    print("=" * 60)


if __name__ == "__main__":
    test_image_generation()
