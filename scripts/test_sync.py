import unittest
from unittest.mock import patch
import sync

class HistoryTests(unittest.TestCase):
    def test_pagination_and_allowlist(self):
        revision = {"fields": {"System.ChangedDate": "2026-09-01", "System.State": "Active", "Microsoft.VSTS.CMMI.Blocked": "Yes", "System.Description": "private"}}
        with patch.object(sync, "fetch", side_effect=[{"value": [revision] * 200}, {"value": [revision]}]) as fetch:
            rows = sync.history_for("https://example.test", {}, 1)
        self.assertEqual(len(rows), 201)
        self.assertTrue(rows[0]["blocked"])
        self.assertNotIn("System.Description", str(rows))
        self.assertIn("$skip=200", fetch.call_args.args[0])

if __name__ == "__main__":
    unittest.main()
