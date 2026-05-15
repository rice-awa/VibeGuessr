def build_word_gen_prompt(difficulty_config, used_words, recent_categories=None, target_category=None):
    used_str = "、".join(used_words) if used_words else "无"
    recent_categories = recent_categories or []
    recent_categories_str = "、".join(recent_categories) if recent_categories else "无"
    diversity_rule = ""

    if difficulty_config.get("label") == "中等":
        category_pool = "、".join(difficulty_config.get("category_pool", []))
        diversity_rule = f"""
7. 本题必须和最近题目的主题拉开差异，优先从这些类别中轮换：{category_pool}
8. 本题优先类别：{target_category or "从候选类别中任选一个未重复的大类"}
9. 不要与最近 2 题重复类别：{recent_categories_str}
10. 必须先在心里选定一个与最近类别不同的大类，再生成关键词；如果做不到，就从上面的轮换类别里换一个"""

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
6. category 必须是中文短词，明确描述该题所属的大类，例如“职业”“运动”“地标建筑”“交通工具”
{diversity_rule}
11. 只返回JSON，不要包含其他文字"""
