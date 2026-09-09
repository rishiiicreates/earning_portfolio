"""
Autonomous Lead Enrichment & Deep Research Pipeline
Enterprise Automation Suite for n8n & Python
"""

from enricher.models import (
    CompanyInfo,
    FinancialsAndFunding,
    TechStackProfile,
    ExecutiveContact,
    ScoringAndTier,
    OutreachAngle,
    LeadBriefing,
)
from enricher.extractor import (
    normalize_target,
    detect_tech_stack_signatures,
    parse_metadata_and_opengraph,
)
from enricher.scorer import calculate_lead_score
from enricher.fixtures import get_lead_fixture, FIXTURES
from enricher.synthesizer import IntelligenceSynthesizer
from enricher.researcher import LeadResearcher, fetch_website_content
from enricher.formatter import format_markdown_briefing, format_json_briefing, format_cli_card

__all__ = [
    "LeadBriefing",
    "CompanyInfo",
    "FinancialsAndFunding",
    "TechStackProfile",
    "ExecutiveContact",
    "ScoringAndTier",
    "OutreachAngle",
    "normalize_target",
    "detect_tech_stack_signatures",
    "parse_metadata_and_opengraph",
    "calculate_lead_score",
    "get_lead_fixture",
    "FIXTURES",
    "IntelligenceSynthesizer",
    "LeadResearcher",
    "fetch_website_content",
    "format_markdown_briefing",
    "format_json_briefing",
    "format_cli_card",
]

__version__ = "1.0.0"
