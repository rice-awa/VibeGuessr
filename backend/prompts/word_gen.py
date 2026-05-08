def build_word_gen_prompt(difficulty_config, used_words):
    used_str = "、".join(used_words) if used_words else "无"
    return f"""角色：你是一个猜词游戏的出题官。
任务：根据难度要求，生成1个关键词和对应的视觉描述。

难度说明：
- 难度等级：{difficulty_config["label"]}
- 词库范围：{difficulty_config["word_scope"]}

要求：
1. 关键词应有明确的视觉表现，适合用图片表达
2. 返回JSON格式：{{"keyword": "xxx", "visual_desc": "xxx", "category": "xxx", "hint1": "xxx", "hint2": "xxx", "hint3": "xxx"}}
3. visual_desc 用于生成图片，应描述关键词的核心视觉特征，但不包含关键词本身，使用英文描述
4. hint1/2/3 为由浅入深的中文文字提示，不能直接包含答案
5. 避免与以下已出词重复：{used_str}
6. 只返回JSON，不要包含其他文字"""
