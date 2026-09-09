"""
Unit and Integration Tests for Autonomous Lead Enrichment & Deep Research Pipeline
"""

import json
import subprocess
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from enricher import (
    CompanyInfo,
    FinancialsAndFunding,
    LeadBriefing,
    LeadResearcher,
    ScoringAndTier,
    TechStackProfile,
    calculate_lead_score,
    detect_tech_stack_signatures,
    format_cli_card,
    format_json_briefing,
    format_markdown_briefing,
    get_lead_fixture,
    normalize_target,
    parse_metadata_and_opengraph,
)


class TestTargetNormalization(unittest.TestCase):
    def test_clean_domain(self):
        res = normalize_target("stripe.com")
        self.assertEqual(res["domain"], "stripe.com")
        self.assertEqual(res["company_name"], "Stripe")
        self.assertEqual(res["target_url"], "https://stripe.com")
        self.assertIsNone(res["contact_email"])

    def test_url_with_protocol_and_path(self):
        res = normalize_target("https://linear.app/pricing?ref=banner")
        self.assertEqual(res["domain"], "linear.app")
        self.assertEqual(res["company_name"], "Linear")
        self.assertEqual(res["target_url"], "https://linear.app")

    def test_url_with_subdomain_www(self):
        res = normalize_target("http://www.supabase.com/")
        self.assertEqual(res["domain"], "supabase.com")
        self.assertEqual(res["company_name"], "Supabase")

    def test_email_input(self):
        res = normalize_target("paul@supabase.com")
        self.assertEqual(res["domain"], "supabase.com")
        self.assertEqual(res["contact_email"], "paul@supabase.com")

    def test_company_name_query(self):
        res = normalize_target("Retool")
        self.assertEqual(res["company_name"], "Retool")
        self.assertIn("retool", res["domain"])


class TestExtractorAndSignatures(unittest.TestCase):
    def test_tech_detection_html(self):
        sample_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Next App</title>
            <script src="/_next/static/chunks/main.js"></script>
            <script src="https://js.stripe.com/v3/"></script>
        </head>
        <body class="bg-slate-900 flex items-center">
            <div data-reactroot="">Content</div>
        </body>
        </html>
        """
        headers = {
            "Server": "cloudflare",
            "cf-ray": "12345678-SJC",
        }

        detected = detect_tech_stack_signatures(sample_html, headers)
        self.assertIn("Next.js", detected["frontend"])
        self.assertIn("React", detected["frontend"])
        self.assertIn("Cloudflare (CDN / WAF)", detected["database_and_cloud"])
        self.assertTrue(any("stripe" in s.lower() for s in detected["payments_and_security"]))

    def test_metadata_and_opengraph_parsing(self):
        sample_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Linear - Modern Issue Tracking</title>
            <meta name="description" content="Linear is the issue tracking tool you'll actually enjoy using.">
            <meta property="og:title" content="Linear • Issue Tracking">
            <meta property="og:description" content="Purpose-built for modern product teams.">
            <meta property="og:site_name" content="Linear">
        </head>
        <body></body>
        </html>
        """
        meta = parse_metadata_and_opengraph(sample_html)
        self.assertEqual(meta["title"], "Linear - Modern Issue Tracking")
        self.assertEqual(meta["description"], "Linear is the issue tracking tool you'll actually enjoy using.")
        self.assertEqual(meta["og_title"], "Linear • Issue Tracking")
        self.assertEqual(meta["og_site_name"], "Linear")


class TestScoringEngine(unittest.TestCase):
    def test_enterprise_lead_scoring_tier1(self):
        comp = CompanyInfo(
            name="Stripe",
            domain="stripe.com",
            url="https://stripe.com",
            description="Payments infrastructure",
            team_size="8000+ employees",
            estimated_headcount=8200,
            github_url="https://github.com/stripe",
            linkedin_url="https://linkedin.com/company/stripe",
        )
        fin = FinancialsAndFunding(
            total_raised="$8.7B",
            latest_round="Series I",
            notable_investors=["Sequoia Capital", "Founders Fund"],
        )
        tech = TechStackProfile(
            frontend=["React", "Next.js", "TypeScript"],
            backend=["Go", "Ruby", "Java"],
            database_and_cloud=["PostgreSQL", "AWS", "Cloudflare"],
            payments_and_security=["Stripe", "Vault"],
            detected_signatures=["react", "nextjs", "aws", "stripe", "cloudflare"],
        )

        score = calculate_lead_score(comp, fin, tech)
        self.assertGreaterEqual(score.overall_score, 88)
        self.assertIn("Tier 1", score.qualification_tier)
        self.assertGreaterEqual(score.icp_fit_score, 85)
        self.assertGreaterEqual(score.intent_score, 80)
        self.assertTrue(len(score.intent_signals) > 0)

    def test_growth_stage_scoring_tier2(self):
        comp = CompanyInfo(
            name="EarlyStartup",
            domain="earlystartup.io",
            url="https://earlystartup.io",
            description="B2B AI tool",
            team_size="35 employees",
            estimated_headcount=35,
        )
        fin = FinancialsAndFunding(
            total_raised="$4M",
            latest_round="Seed",
        )
        tech = TechStackProfile(
            frontend=["React"],
            backend=["Node.js"],
            database_and_cloud=["AWS"],
        )

        score = calculate_lead_score(comp, fin, tech)
        self.assertTrue(0 <= score.overall_score <= 100)
        self.assertTrue(score.qualification_tier.startswith("Tier"))


class TestFixturesAndFormatting(unittest.TestCase):
    def test_known_fixture_retrieval(self):
        for domain in ["stripe.com", "linear.app", "supabase.com", "retool.com", "vercel.com"]:
            briefing = get_lead_fixture(domain)
            self.assertEqual(briefing.company.domain, domain)
            self.assertGreater(len(briefing.key_contacts), 0)
            self.assertGreater(briefing.scoring.overall_score, 70)
            self.assertTrue(len(briefing.outreach.cold_email_body) > 50)

    def test_generic_fixture_fallback(self):
        briefing = get_lead_fixture("unknown-venture-tech.co")
        self.assertEqual(briefing.company.domain, "unknown-venture-tech.co")
        self.assertIn("Tier", briefing.scoring.qualification_tier)
        self.assertGreater(len(briefing.key_contacts), 0)

    def test_markdown_and_json_formatting(self):
        briefing = get_lead_fixture("supabase.com")
        md = format_markdown_briefing(briefing)
        self.assertIn("# 🏢 Enterprise Lead Dossier: Supabase", md)
        self.assertIn("Executive Qualification Matrix", md)
        self.assertIn("Deep Technology Stack Profile", md)
        self.assertIn("Key Decision Makers", md)
        self.assertIn("Outreach Blueprint", md)

        data = format_json_briefing(briefing)
        self.assertIsInstance(data, dict)
        self.assertEqual(data["company"]["name"], "Supabase")
        self.assertIn("scoring", data)

        card = format_cli_card(briefing)
        self.assertIn("SUPABASE", card)


class TestLeadResearcherIntegration(unittest.TestCase):
    def test_mock_lead_research(self):
        researcher = LeadResearcher(force_mock=True)
        briefing = researcher.research_lead("linear.app")
        self.assertEqual(briefing.company.name, "Linear")
        self.assertIn("Tier 1", briefing.scoring.qualification_tier)
        self.assertTrue(len(briefing.summary_markdown) > 100)

    def test_pipeline_cli_execution(self):
        output_dir = PROJECT_ROOT / "output" / "test_cli"
        cmd = [
            sys.executable,
            str(PROJECT_ROOT / "pipeline.py"),
            "--target", "stripe.com",
            "--mock",
            "--output-dir", str(output_dir),
            "--format", "all",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        self.assertIn("STRIPE", result.stdout)
        self.assertIn("Tier 1: Enterprise Target", result.stdout)

        json_file = output_dir / "stripe_com_briefing.json"
        md_file = output_dir / "stripe_com_briefing.md"
        self.assertTrue(json_file.exists())
        self.assertTrue(md_file.exists())

        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.assertEqual(data["company"]["name"], "Stripe")


if __name__ == "__main__":
    unittest.main()
