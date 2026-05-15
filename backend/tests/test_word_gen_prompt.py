import os
import sys
import unittest


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class WordGenerationPromptTests(unittest.TestCase):
    def test_medium_prompt_requires_category_rotation(self):
        from config import DIFFICULTY_CONFIG
        from prompts.word_gen import build_word_gen_prompt

        prompt = build_word_gen_prompt(
            DIFFICULTY_CONFIG["medium"],
            ["篮球", "足球"],
            ["运动", "职业"],
            "乐器",
        )

        self.assertIn("优先从这些类别中轮换", prompt)
        self.assertIn("本题优先类别：乐器", prompt)
        self.assertIn("不要与最近 2 题重复类别：运动、职业", prompt)
        self.assertIn("必须先在心里选定一个与最近类别不同的大类", prompt)


if __name__ == "__main__":
    unittest.main()
