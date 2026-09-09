"""
Autonomous Lead Enrichment & Deep Research Pipeline - Scorer
Enterprise ICP Fit Scoring, Buying Intent Scoring, and Qualification Tier Classifier.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from enricher.models import CompanyInfo, FinancialsAndFunding, ScoringAndTier, TechStackProfile


def calculate_lead_score(
    company: CompanyInfo,
    financials: FinancialsAndFunding,
    tech_stack: TechStackProfile,
    custom_icp_weights: Optional[Dict[str, float]] = None,
) -> ScoringAndTier:
    """
    Evaluates multi-dimensional scoring for an enterprise lead:
    1. Tech Alignment (0-25)
    2. Company Scale & Headcount (0-25)
    3. Capital & Financial Health (0-25)
    4. Market Velocity & Digital Presence (0-25)
    Computes ICP Fit (0-100), Intent Score (0-100), and assigns Tier.
    """

    # 1. Tech Alignment Score (0-25)
    tech_score = 15  # baseline
    modern_tech_keywords = {
        "react", "next.js", "nextjs", "typescript", "tailwind", "go", "python",
        "fastapi", "postgresql", "cloudflare", "aws", "docker", "kubernetes",
        "segment", "posthog", "stripe", "graphql", "redis", "supabase"
    }

    all_detected = [
        s.lower() for s in (
            tech_stack.frontend +
            tech_stack.backend +
            tech_stack.database_and_cloud +
            tech_stack.analytics_and_marketing +
            tech_stack.payments_and_security +
            tech_stack.detected_signatures
        )
    ]

    matched_count = sum(1 for kw in modern_tech_keywords if any(kw in item for item in all_detected))
    tech_score = min(25, 12 + matched_count * 2)

    # 2. Scale & Headcount Score (0-25)
    scale_score = 15
    headcount = company.estimated_headcount or 0
    team_size_str = (company.team_size or "").lower()

    if headcount >= 1000 or "1,000+" in team_size_str or "5,000+" in team_size_str or "8,000+" in team_size_str:
        scale_score = 25
    elif headcount >= 200 or "200-" in team_size_str or "300-" in team_size_str or "500-" in team_size_str:
        scale_score = 24
    elif headcount >= 50 or "51-200" in team_size_str or "80-120" in team_size_str or "100-200" in team_size_str:
        scale_score = 23
    elif headcount >= 20 or "20-50" in team_size_str:
        scale_score = 18
    elif headcount > 0:
        scale_score = 14
    else:
        scale_score = 18

    # 3. Capital & Financial Health (0-25)
    capital_score = 15
    raised = (financials.total_raised or "").lower()
    round_name = (financials.latest_round or "").lower()
    investors = financials.notable_investors or []

    top_tier_investors = {"sequoia", "accel", "andreessen", "a16z", "y combinator", "founders fund", "benchmark", "coatue", "crv", "gv"}
    has_top_investor = any(any(t in inv.lower() for t in top_tier_investors) for inv in investors)

    if has_top_investor:
        capital_score += 4

    if "b" in raised or "billion" in raised or "100m" in raised or "series c" in round_name or "series d" in round_name or "growth" in round_name or "public" in round_name:
        capital_score = max(capital_score, 24)
    elif "series b" in round_name or "50m" in raised:
        capital_score = max(capital_score, 23)
    elif "series a" in round_name or "10m" in raised:
        capital_score = max(capital_score, 20)
    elif "seed" in round_name:
        capital_score = max(capital_score, 17)

    capital_score = min(25, capital_score)

    # 4. Market Velocity & Digital Presence (0-25)
    velocity_score = 18
    if company.github_url:
        velocity_score += 2
    if company.linkedin_url:
        velocity_score += 2
    if company.twitter_handle:
        velocity_score += 2
    velocity_score = min(25, velocity_score)

    # Total ICP Fit Score
    icp_fit_score = int(tech_score + scale_score + capital_score + velocity_score)
    icp_fit_score = max(0, min(100, icp_fit_score))

    # Intent Signals & Scoring
    intent_signals: List[str] = []
    intent_score = 70

    if "series" in round_name or "raised" in (financials.total_raised or "").lower():
        intent_signals.append(f"Recent capital infusion ({financials.latest_round or 'Venture round'}) funding platform scaling")
        intent_score += 8

    if headcount >= 50:
        intent_signals.append("Active engineering and revenue operations headcount expansion")
        intent_score += 7

    if any("stripe" in s for s in all_detected):
        intent_signals.append("Monetizing via automated billing infrastructure and global checkout")
        intent_score += 5

    if any("next" in s or "react" in s for s in all_detected):
        intent_signals.append("Modern developer-first web stack enabling fast deployment cycles")
        intent_score += 5

    intent_score = max(0, min(100, intent_score))

    # Overall Weighted Score
    overall_score = int(round(0.6 * icp_fit_score + 0.4 * intent_score))

    # Tier Assignment
    if overall_score >= 88:
        tier = "Tier 1: Enterprise Target"
    elif overall_score >= 75:
        tier = "Tier 2: High Intent Mid-Market"
    elif overall_score >= 55:
        tier = "Tier 3: Growth / Nurture"
    else:
        tier = "Tier 4: Disqualified"

    # Risk Factors
    risk_factors: List[str] = []
    if headcount >= 2000:
        risk_factors.append("Extended enterprise security review and RFP cycle (6+ months)")
    if "bootstrapped" in (financials.total_raised or "").lower():
        risk_factors.append("Conservative discretionary budget allocation")
    if not risk_factors:
        risk_factors.append("Vendor competition in primary developer workflow category")

    return ScoringAndTier(
        icp_fit_score=icp_fit_score,
        intent_score=intent_score,
        overall_score=overall_score,
        qualification_tier=tier,
        fit_breakdown={
            "tech_alignment": tech_score,
            "scale_and_headcount": scale_score,
            "capital_health": capital_score,
            "market_velocity": velocity_score,
        },
        intent_signals=intent_signals,
        risk_factors=risk_factors,
    )
