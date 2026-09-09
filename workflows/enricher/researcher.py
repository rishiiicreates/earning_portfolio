"""
Autonomous Lead Enrichment & Deep Research Pipeline - Researcher
Multi-tier intelligence gatherer: Firecrawl, Serper/Google Search, Native Web Inspection,
and resilient offline fixture fallback.
"""

from __future__ import annotations

import json
import os
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple
from urllib import request as url_request
from urllib.error import URLError

from enricher.extractor import (
    detect_tech_stack_signatures,
    normalize_target,
    parse_metadata_and_opengraph,
)
from enricher.fixtures import get_lead_fixture
from enricher.formatter import format_markdown_briefing
from enricher.models import LeadBriefing
from enricher.synthesizer import IntelligenceSynthesizer


DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def fetch_website_content(url: str, timeout: int = 10) -> Tuple[str, Dict[str, str]]:
    """
    Safely fetches target URL HTML and headers using native HTTP client.
    Handles redirects, SSL, and custom User-Agent. Returns ('', {}) on failure.
    """
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    req = url_request.Request(url, headers=headers, method="GET")
    try:
        with url_request.urlopen(req, timeout=timeout) as resp:
            content_type = resp.headers.get("Content-Type", "")
            # Only read if text/html
            if "html" in content_type.lower() or "text" in content_type.lower():
                raw_bytes = resp.read(250000)  # Read first 250KB
                encoding = resp.headers.get_content_charset() or "utf-8"
                html_text = raw_bytes.decode(encoding, errors="replace")
            else:
                html_text = ""
            resp_headers = dict(resp.headers.items())
            return html_text, resp_headers
    except Exception:
        # Graceful fallback on network unreachable, DNS failure, or blocked
        return "", {}


def query_firecrawl_scrape(url: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Scrapes website using Firecrawl v1 API if key is provided.
    """
    key = api_key or os.getenv("FIRECRAWL_API_KEY")
    if not key:
        return None

    api_url = "https://api.firecrawl.dev/v1/scrape"
    payload = {
        "url": url,
        "formats": ["markdown", "html"],
        "onlyMainContent": True,
    }

    req = url_request.Request(
        api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )

    try:
        with url_request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def query_serper_search(query: str, api_key: Optional[str] = None) -> List[str]:
    """
    Queries Serper.dev Google Search API for company intelligence snippets.
    """
    key = api_key or os.getenv("SERPER_API_KEY")
    if not key:
        return []

    req = url_request.Request(
        "https://google.serper.dev/search",
        data=json.dumps({"q": query, "num": 5}).encode("utf-8"),
        headers={
            "X-API-KEY": key,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    snippets = []
    try:
        with url_request.urlopen(req, timeout=10) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            for item in res.get("organic", []):
                snippet = item.get("snippet")
                if snippet:
                    snippets.append(snippet)
    except Exception:
        pass
    return snippets


class LeadResearcher:
    """
    Orchestrates the entire lead research pipeline:
    input normalization -> web inspection -> search enrichment -> synthesis -> dossier generation.
    """

    def __init__(self, provider: str = "auto", force_mock: bool = False):
        self.provider = provider
        self.force_mock = force_mock
        self.synthesizer = IntelligenceSynthesizer(provider=provider)

    def research_lead(self, target_query: str) -> LeadBriefing:
        """
        Executes end-to-end enrichment for a target query.
        Guaranteed to return a valid LeadBriefing even if offline.
        """
        normalized = normalize_target(target_query)
        domain = normalized["domain"]
        company_name = normalized["company_name"]
        target_url = normalized["target_url"]

        if self.force_mock or not domain:
            briefing = get_lead_fixture(domain or target_query, company_name)
            briefing.summary_markdown = format_markdown_briefing(briefing)
            return briefing

        # Step 1: Live Web Inspection
        html, headers = fetch_website_content(target_url, timeout=8)
        metadata = parse_metadata_and_opengraph(html)
        tech_signatures = detect_tech_stack_signatures(html, headers)

        # Step 2: Search Intelligence (if keys present)
        search_snippets: List[str] = []
        if os.getenv("SERPER_API_KEY"):
            search_snippets = query_serper_search(f"{company_name} company funding team size executives")

        # Step 3: Synthesis
        force_offline = not bool(os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY") or os.getenv("GEMINI_API_KEY"))
        briefing = self.synthesizer.synthesize(
            domain=domain,
            company_name=company_name,
            raw_metadata=metadata,
            raw_html=html,
            tech_signatures=tech_signatures,
            search_snippets=search_snippets,
            force_offline=force_offline,
        )

        # Attach original query & contact email if present
        briefing.target_query = target_query
        if normalized.get("contact_email"):
            briefing.company.contact_email = normalized["contact_email"]

        # Step 4: Markdown Briefing Dossier
        briefing.summary_markdown = format_markdown_briefing(briefing)

        return briefing
