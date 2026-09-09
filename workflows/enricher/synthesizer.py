"""
Autonomous Lead Enrichment & Deep Research Pipeline - Synthesizer
LLM Reasoning and Deterministic Rule-Based Synthesis Engine.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional
from urllib import request as url_request
from urllib.error import URLError

from enricher.models import (
    CompanyInfo,
    ExecutiveContact,
    FinancialsAndFunding,
    LeadBriefing,
    OutreachAngle,
    ScoringAndTier,
    TechStackProfile,
)
from enricher.scorer import calculate_lead_score
from enricher.fixtures import get_lead_fixture


class IntelligenceSynthesizer:
    """
    Synthesizes raw intelligence from web scraping, search results, and metadata
    into a structured LeadBriefing. Supports LLM API backends and zero-key offline heuristics.
    """

    def __init__(self, provider: str = "auto"):
        self.provider = provider
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")

    def synthesize(
        self,
        domain: str,
        company_name: str,
        raw_metadata: Dict[str, Any],
        raw_html: str,
        tech_signatures: Dict[str, List[str]],
        search_snippets: Optional[List[str]] = None,
        force_offline: bool = False,
    ) -> LeadBriefing:
        """
        Main synthesis entry point. Dispatches to LLM backend if available, or offline engine.
        """
        if force_offline:
            return self._synthesize_offline(domain, company_name, raw_metadata, raw_html, tech_signatures, search_snippets)

        # Detect available provider
        if (self.provider == "openai" or self.provider == "auto") and self.openai_key:
            try:
                return self._synthesize_with_openai(domain, company_name, raw_metadata, tech_signatures, search_snippets)
            except Exception as e:
                # Fallback to offline
                pass

        if (self.provider == "anthropic" or self.provider == "auto") and self.anthropic_key:
            try:
                return self._synthesize_with_anthropic(domain, company_name, raw_metadata, tech_signatures, search_snippets)
            except Exception:
                pass

        if (self.provider == "gemini" or self.provider == "auto") and self.gemini_key:
            try:
                return self._synthesize_with_gemini(domain, company_name, raw_metadata, tech_signatures, search_snippets)
            except Exception:
                pass

        # Default: Deterministic offline synthesis
        return self._synthesize_offline(domain, company_name, raw_metadata, raw_html, tech_signatures, search_snippets)

    def _synthesize_offline(
        self,
        domain: str,
        company_name: str,
        raw_metadata: Dict[str, Any],
        raw_html: str,
        tech_signatures: Dict[str, List[str]],
        search_snippets: Optional[List[str]] = None,
    ) -> LeadBriefing:
        """
        High-fidelity deterministic offline synthesis using pattern matching,
        OpenGraph extraction, and curated database fixtures.
        """
        import datetime

        # Check if known fixture exists
        clean_domain = domain.lower().replace("www.", "").strip()
        fixture_briefing = get_lead_fixture(clean_domain, company_name)

        # If we have real scraped title/desc, enhance fixture with live observed data
        title = raw_metadata.get("og_title") or raw_metadata.get("title") or ""
        desc = raw_metadata.get("og_description") or raw_metadata.get("description") or ""

        if desc and len(desc) > 15:
            fixture_briefing.company.description = desc
        if company_name and company_name != fixture_briefing.company.name:
            fixture_briefing.company.name = company_name

        # Merge live detected tech signatures
        if tech_signatures:
            for cat in ["frontend", "backend", "database_and_cloud", "analytics_and_marketing", "payments_and_security"]:
                detected = tech_signatures.get(cat, [])
                existing = getattr(fixture_briefing.tech_stack, cat, [])
                combined = list(dict.fromkeys(existing + detected))
                setattr(fixture_briefing.tech_stack, cat, combined)

        # Recalculate score
        fixture_briefing.scoring = calculate_lead_score(
            fixture_briefing.company,
            fixture_briefing.financials,
            fixture_briefing.tech_stack,
        )

        fixture_briefing.enrichment_source = "hybrid_offline_heuristics"
        fixture_briefing.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return fixture_briefing

    def _synthesize_with_openai(
        self,
        domain: str,
        company_name: str,
        raw_metadata: Dict[str, Any],
        tech_signatures: Dict[str, List[str]],
        search_snippets: Optional[List[str]] = None,
    ) -> LeadBriefing:
        """
        Calls OpenAI API (gpt-4o-mini or gpt-4o) using native HTTP request.
        """
        import datetime

        prompt = f"""
You are an expert enterprise research analyst. Synthesize the following raw intelligence on {company_name} ({domain}) into a strict JSON object.

RAW METADATA: {json.dumps(raw_metadata)}
DETECTED TECH: {json.dumps(tech_signatures)}
SEARCH SNIPPETS: {json.dumps(search_snippets or [])}

Respond ONLY with valid JSON conforming to:
{{
  "description": "crisp 2 sentence overview",
  "industry": "Industry category",
  "founded_year": 2020,
  "headquarters": "City, State, Country",
  "team_size": "100-250 employees",
  "estimated_headcount": 180,
  "financials": {{
    "total_raised": "$50M",
    "latest_round": "Series B",
    "latest_round_date": "2023-08",
    "valuation": "$350M",
    "notable_investors": ["Investor 1", "Investor 2"],
    "revenue_stage": "$20M+ ARR"
  }},
  "key_contacts": [
    {{
      "name": "Full Name",
      "title": "Title",
      "department": "Executive",
      "relevance_note": "Strategic note",
      "linkedin_url": "https://linkedin.com/in/...",
      "email": "name@domain.com"
    }}
  ],
  "intent_signals": ["Signal 1", "Signal 2"],
  "outreach": {{
    "recommended_persona": "VP of Engineering",
    "hook_angle": "Hook angle",
    "cold_email_subject": "Subject",
    "cold_email_body": "Hi Name,\\n...",
    "discovery_questions": ["Q1?", "Q2?"]
  }}
}}
"""

        req_data = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        req = url_request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(req_data).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_key}",
            },
            method="POST",
        )

        with url_request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            parsed = json.loads(data["choices"][0]["message"]["content"])

        # Construct LeadBriefing
        company = CompanyInfo(
            name=company_name,
            domain=domain,
            url=f"https://{domain}",
            description=parsed.get("description", f"{company_name} enterprise solutions"),
            industry=parsed.get("industry", "Technology / SaaS"),
            founded_year=parsed.get("founded_year"),
            headquarters=parsed.get("headquarters", "San Francisco, CA, USA"),
            team_size=parsed.get("team_size", "100-250 employees"),
            estimated_headcount=parsed.get("estimated_headcount", 150),
        )

        fin_data = parsed.get("financials", {})
        financials = FinancialsAndFunding(**fin_data)

        tech = TechStackProfile(
            frontend=tech_signatures.get("frontend", []),
            backend=tech_signatures.get("backend", []),
            database_and_cloud=tech_signatures.get("database_and_cloud", []),
            analytics_and_marketing=tech_signatures.get("analytics_and_marketing", []),
            payments_and_security=tech_signatures.get("payments_and_security", []),
            detected_signatures=tech_signatures.get("detected_signatures", []),
        )

        contacts = [ExecutiveContact(**c) for c in parsed.get("key_contacts", [])]
        out_data = parsed.get("outreach", {})
        outreach = OutreachAngle(**out_data)

        scoring = calculate_lead_score(company, financials, tech)
        if parsed.get("intent_signals"):
            scoring.intent_signals = parsed.get("intent_signals")

        lead_id = f"lead_{re.sub(r'[^a-zA-Z0-9]', '_', domain)}"
        return LeadBriefing(
            lead_id=lead_id,
            target_query=domain,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            enrichment_source="openai_llm_synthesis",
            company=company,
            financials=financials,
            tech_stack=tech,
            key_contacts=contacts,
            scoring=scoring,
            outreach=outreach,
        )

    def _synthesize_with_anthropic(self, domain: str, company_name: str, raw_metadata: Dict, tech_signatures: Dict, search_snippets: Optional[List[str]]) -> LeadBriefing:
        # Fallback to offline if not implemented directly
        return self._synthesize_offline(domain, company_name, raw_metadata, "", tech_signatures, search_snippets)

    def _synthesize_with_gemini(self, domain: str, company_name: str, raw_metadata: Dict, tech_signatures: Dict, search_snippets: Optional[List[str]]) -> LeadBriefing:
        # Fallback to offline if not implemented directly
        return self._synthesize_offline(domain, company_name, raw_metadata, "", tech_signatures, search_snippets)
