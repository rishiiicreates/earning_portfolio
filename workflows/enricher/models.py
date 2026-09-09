"""
Autonomous Lead Enrichment & Deep Research Pipeline - Data Models
Enterprise-grade data definitions with full JSON serialization and type safety.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class CompanyInfo:
    name: str
    domain: str
    url: str
    description: str
    industry: str = "Technology / SaaS"
    founded_year: Optional[int] = None
    headquarters: str = "San Francisco, CA, USA"
    team_size: str = "51-200 employees"
    estimated_headcount: Optional[int] = None
    linkedin_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    github_url: Optional[str] = None
    contact_email: Optional[str] = None


@dataclass
class FinancialsAndFunding:
    total_raised: Optional[str] = None
    latest_round: Optional[str] = None
    latest_round_date: Optional[str] = None
    valuation: Optional[str] = None
    notable_investors: List[str] = field(default_factory=list)
    revenue_stage: Optional[str] = None


@dataclass
class TechStackProfile:
    frontend: List[str] = field(default_factory=list)
    backend: List[str] = field(default_factory=list)
    database_and_cloud: List[str] = field(default_factory=list)
    analytics_and_marketing: List[str] = field(default_factory=list)
    payments_and_security: List[str] = field(default_factory=list)
    detected_signatures: List[str] = field(default_factory=list)


@dataclass
class ExecutiveContact:
    name: str
    title: str
    department: str
    relevance_note: str
    linkedin_url: Optional[str] = None
    email: Optional[str] = None


@dataclass
class ScoringAndTier:
    icp_fit_score: int  # 0-100
    intent_score: int   # 0-100
    overall_score: int  # 0-100
    qualification_tier: str  # "Tier 1: Enterprise Target", "Tier 2: High Intent Mid-Market", etc.
    fit_breakdown: Dict[str, int] = field(default_factory=dict)
    intent_signals: List[str] = field(default_factory=list)
    risk_factors: List[str] = field(default_factory=list)


@dataclass
class OutreachAngle:
    recommended_persona: str
    hook_angle: str
    cold_email_subject: str
    cold_email_body: str
    discovery_questions: List[str] = field(default_factory=list)


@dataclass
class LeadBriefing:
    lead_id: str
    target_query: str
    timestamp: str
    enrichment_source: str
    company: CompanyInfo
    financials: FinancialsAndFunding
    tech_stack: TechStackProfile
    key_contacts: List[ExecutiveContact] = field(default_factory=list)
    scoring: ScoringAndTier = field(default_factory=lambda: ScoringAndTier(0, 0, 0, "Unqualified"))
    outreach: OutreachAngle = field(default_factory=lambda: OutreachAngle("", "", "", ""))
    summary_markdown: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, default=str)
