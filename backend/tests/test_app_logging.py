import importlib
import io
import os
import sys
import unittest
from unittest.mock import patch


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class AppLoggingTests(unittest.TestCase):
    def test_log_writes_to_stdout_immediately(self):
        app_module = importlib.import_module("app")
        stream = io.StringIO()

        with patch("sys.stdout", stream):
            app_module._log("diagnostic message")

        self.assertIn("[VibeGuessr] diagnostic message", stream.getvalue())


if __name__ == "__main__":
    unittest.main()
