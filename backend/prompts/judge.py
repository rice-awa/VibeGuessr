def build_judge_prompt(keyword, answer):
    return f"""角色：你是猜词游戏的裁判。
任务：判断玩家答案与正确关键词的匹配程度。

正确关键词："{keyword}"
玩家答案："{answer}"

判定规则：
1. 完全正确（同义词也算）：答案与关键词含义完全一致 → score_ratio: 1.0
2. 非常接近：答案与关键词高度相关，属于近义词或上下位概念 → score_ratio: 0.6-0.8
3. 有点沾边：答案与关键词有一定关联但差距较大 → score_ratio: 0.2-0.4
4. 完全错误：答案与关键词无关 → score_ratio: 0.0

返回JSON格式：{{"match": "exact|close|related|wrong", "score_ratio": 0.0, "feedback": "给玩家的反馈语"}}

示例：
- 关键词"猫"，答案"小猫" → {{"match": "exact", "score_ratio": 1.0, "feedback": "完全正确！"}}
- 关键词"猫"，答案"布偶" → {{"match": "close", "score_ratio": 0.7, "feedback": "很接近！布偶是猫的一个品种"}}
- 关键词"猫"，答案"宠物" → {{"match": "related", "score_ratio": 0.3, "feedback": "有点沾边，但范围太大了"}}
- 关键词"猫"，答案"汽车" → {{"match": "wrong", "score_ratio": 0.0, "feedback": "完全不对哦，再想想？"}}

只返回JSON，不要包含其他文字"""


def build_knowledge_card_prompt(keyword):
    return f"""请为关键词"{keyword}"生成一条趣味冷知识或科普，1-2句话，中文，有趣易懂。
只返回纯文本内容，不要加任何格式标记。"""
