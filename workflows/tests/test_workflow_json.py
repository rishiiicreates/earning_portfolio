"""
Tests to validate workflow_lead_research.json n8n specifications.
"""

import json
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORKFLOW_FILE = PROJECT_ROOT / "workflow_lead_research.json"


class TestN8nWorkflowSpecification(unittest.TestCase):
    def setUp(self):
        self.assertTrue(WORKFLOW_FILE.exists(), "workflow_lead_research.json must exist")
        with open(WORKFLOW_FILE, "r", encoding="utf-8") as f:
            self.wf = json.load(f)

    def test_workflow_structure(self):
        self.assertIn("name", self.wf)
        self.assertIn("nodes", self.wf)
        self.assertIn("connections", self.wf)
        self.assertIsInstance(self.wf["nodes"], list)
        self.assertIsInstance(self.wf["connections"], dict)

    def test_trigger_nodes_present(self):
        node_types = [n["type"] for n in self.wf["nodes"]]
        self.assertIn("n8n-nodes-base.webhook", node_types)
        self.assertIn("n8n-nodes-base.manualTrigger", node_types)

    def test_all_nodes_have_required_fields(self):
        for node in self.wf["nodes"]:
            self.assertIn("id", node, f"Node {node.get('name')} missing 'id'")
            self.assertIn("name", node, f"Node {node.get('id')} missing 'name'")
            self.assertIn("type", node, f"Node {node.get('name')} missing 'type'")
            self.assertIn("typeVersion", node, f"Node {node.get('name')} missing 'typeVersion'")
            self.assertIn("position", node, f"Node {node.get('name')} missing 'position'")
            self.assertEqual(len(node["position"]), 2, f"Node {node.get('name')} position must be [x, y]")

    def test_connections_validity(self):
        node_names = {n["name"] for n in self.wf["nodes"]}
        for src_name, conn_data in self.wf["connections"].items():
            self.assertIn(src_name, node_names, f"Connection source '{src_name}' not found in nodes")
            for cat, routes in conn_data.items():
                for route_group in routes:
                    for dest in route_group:
                        dest_name = dest.get("node")
                        self.assertIn(dest_name, node_names, f"Connection destination '{dest_name}' not found in nodes")

    def test_webhook_response_mode(self):
        webhook_node = next(n for n in self.wf["nodes"] if n["type"] == "n8n-nodes-base.webhook")
        self.assertEqual(webhook_node["parameters"]["responseMode"], "responseNode")
        self.assertEqual(webhook_node["parameters"]["httpMethod"], "POST")

        response_node = next(n for n in self.wf["nodes"] if n["type"] == "n8n-nodes-base.respondToWebhook")
        self.assertIsNotNone(response_node)


if __name__ == "__main__":
    unittest.main()
