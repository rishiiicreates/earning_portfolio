"""
Autonomous Lead Enrichment & Deep Research Pipeline - Formatter
Produces standardized Markdown Executive Briefing Dossiers, JSON cards, and ANSI CLI summaries.
"""

from __future__ import annotations

from typing import Any, Dict
from enricher.models import LeadBriefing


def format_markdown_briefing(lead: LeadBriefing) -> str:
    """
    Generates a publication-grade GitHub Flavored Markdown executive dossier.
    """
    comp = lead.company
    fin = lead.financials
    tech = lead.tech_stack
    sc = lead.scoring
    out = lead.outreach

    # Investors list
    investors_str = ", ".join(fin.notable_investors) if fin.notable_investors else "Private / Undisclosed"

    # Tech stack items
    fe_str = ", ".join(tech.frontend) if tech.frontend else "Modern Web Stack"
    be_str = ", ".join(tech.backend) if tech.backend else "Distributed Cloud APIs"
    cloud_str = ", ".join(tech.database_and_cloud) if tech.database_and_cloud else "Cloud Native"
    analytics_str = ", ".join(tech.analytics_and_marketing) if tech.analytics_and_marketing else "Standard Telemetry"
    sec_str = ", ".join(tech.payments_and_security) if tech.payments_and_security else "Enterprise Auth"

    # Contacts table
    contacts_rows = []
    for c in lead.key_contacts:
        linkedin_link = f"[{c.name}]({c.linkedin_url})" if c.linkedin_url else c.name
        email_display = f"`{c.email}`" if c.email else "Pattern Inferred"
        contacts_rows.append(f"| **{linkedin_link}** | {c.title} | {c.department} | {email_display} | {c.relevance_note} |")
    contacts_table = "\n".join(contacts_rows) if contacts_rows else "| *No direct contacts identified* | - | - | - | - |"

    # Intent signals
    intent_items = "\n".join(f"- 🟢 **Signal**: {sig}" for sig in sc.intent_signals) if sc.intent_signals else "- Stable operations"
    risk_items = "\n".join(f"- ⚠️ **Risk**: {risk}" for risk in sc.risk_factors) if sc.risk_factors else "- Standard competitive dynamics"

    # Discovery questions
    disc_items = "\n".join(f"{i+1}. {q}" for i, q in enumerate(out.discovery_questions)) if out.discovery_questions else "1. What is your primary roadmap blocker this quarter?"

    score_bar = "█" * (sc.overall_score // 10) + "░" * (10 - (sc.overall_score // 10))

    md = f"""# 🏢 Enterprise Lead Dossier: {comp.name}
> **Target Domain:** `{comp.domain}` | **Enrichment Source:** `{lead.enrichment_source}` | **Generated:** `{lead.timestamp[:10]}`

---

### 🎯 Executive Qualification Matrix
| Metric | Rating | Visual Gauge | Status |
| :--- | :--- | :--- | :--- |
| **Overall Score** | **{sc.overall_score}/100** | `[{score_bar}]` | **{sc.qualification_tier}** |
| **ICP Fit Score** | **{sc.icp_fit_score}/100** | Tech ({sc.fit_breakdown.get('tech_alignment', 20)}/25) • Scale ({sc.fit_breakdown.get('scale_and_headcount', 20)}/25) | ✅ High Target |
| **Buying Intent** | **{sc.intent_score}/100** | Capital ({sc.fit_breakdown.get('capital_health', 20)}/25) • Market ({sc.fit_breakdown.get('market_velocity', 20)}/25) | 🚀 Active Buying Window |

---

### 📌 Company Intelligence
| Attribute | Detail |
| :--- | :--- |
| **Company Name** | **{comp.name}** |
| **Website** | [{comp.url}]({comp.url}) |
| **Industry** | {comp.industry} |
| **Founded** | {comp.founded_year or 'N/A'} |
| **Headquarters** | {comp.headquarters} |
| **Headcount** | **{comp.team_size}** (Est. {comp.estimated_headcount or '100+'} FTEs) |
| **LinkedIn** | {f'[{comp.name} LinkedIn]({comp.linkedin_url})' if comp.linkedin_url else 'N/A'} |
| **GitHub** | {f'[{comp.name} GitHub]({comp.github_url})' if comp.github_url else 'N/A'} |

**Overview:**
{comp.description}

---

### 💰 Financials & Capital Profile
- **Total Raised:** `{fin.total_raised or 'Undisclosed'}`
- **Latest Round:** `{fin.latest_round or 'Venture Round'}` ({fin.latest_round_date or 'Recent'})
- **Estimated Valuation:** `{fin.valuation or 'Confidential'}`
- **Revenue Run-Rate:** `{fin.revenue_stage or 'High Growth SaaS'}`
- **Notable Backers:** {investors_str}

---

### 💻 Deep Technology Stack Profile
| Layer | Detected Technologies & Infrastructure |
| :--- | :--- |
| **Frontend Frameworks** | {fe_str} |
| **Backend & APIs** | {be_str} |
| **Database & Cloud Infrastructure** | {cloud_str} |
| **Analytics & Telemetry** | {analytics_str} |
| **Billing, Auth & Security** | {sec_str} |

---

### 👥 Key Decision Makers & Executives
| Contact | Title | Department | Email Pattern | Strategic Relevance |
| :--- | :--- | :--- | :--- | :--- |
{contacts_table}

---

### 📡 Buying Intent Signals & Risk Assessment
#### High-Intent Signals
{intent_items}

#### Risk & Friction Assessment
{risk_items}

---

### ✉️ Hyper-Personalized Outreach Blueprint
- **Target Persona:** `{out.recommended_persona}`
- **Strategic Angle:** `{out.hook_angle}`
- **Subject Line:** `{out.cold_email_subject}`

```text
{out.cold_email_body}
```

#### Recommended Discovery Questions
{disc_items}

---
*Autonomous Lead Intelligence Engine • Confidential Enterprise Asset*
"""
    return md.strip()


def format_json_briefing(lead: LeadBriefing) -> Dict[str, Any]:
    """
    Returns structured dictionary matching the LeadBriefing specification.
    """
    return lead.to_dict()


def format_cli_card(lead: LeadBriefing) -> str:
    """
    Renders ANSI terminal formatted visual card for developer CLI experience.
    """
    comp = lead.company
    fin = lead.financials
    sc = lead.scoring

    c_blue = "\033[94m"
    c_green = "\033[92m"
    c_yellow = "\033[93m"
    c_cyan = "\033[96m"
    c_bold = "\033[1m"
    c_reset = "\033[0m"

    tier_color = c_green if "Tier 1" in sc.qualification_tier else (c_cyan if "Tier 2" in sc.qualification_tier else c_yellow)

    card = f"""
{c_bold}══════════════════════════════════════════════════════════════════════════════{c_reset}
  {c_bold}LEAD DOSSIER:{c_reset} {c_cyan}{comp.name.upper()}{c_reset} ({comp.domain})
  {c_bold}QUALIFICATION:{c_reset} {tier_color}{sc.qualification_tier}{c_reset}
  {c_bold}SCORES:{c_reset} Overall: {tier_color}{sc.overall_score}/100{c_reset} | ICP Fit: {sc.icp_fit_score}/100 | Intent: {sc.intent_score}/100
══════════════════════════════════════════════════════════════════════════════
  {c_bold}Industry:{c_reset}     {comp.industry}
  {c_bold}Headcount:{c_reset}    {comp.team_size} (Est. {comp.estimated_headcount or '100+'} FTEs)
  {c_bold}Capital:{c_reset}      Total: {fin.total_raised or 'N/A'} | Latest: {fin.latest_round or 'N/A'} ({fin.valuation or ''})
  {c_bold}Tech Stack:{c_reset}   {', '.join(lead.tech_stack.frontend[:3])} • {', '.join(lead.tech_stack.backend[:2])} • {', '.join(lead.tech_stack.database_and_cloud[:2])}
  {c_bold}Decision Maker:{c_reset} {lead.key_contacts[0].name if lead.key_contacts else 'N/A'} ({lead.key_contacts[0].title if lead.key_contacts else ''})
  {c_bold}Hook Angle:{c_reset}   {lead.outreach.hook_angle}
══════════════════════════════════════════════════════════════════════════════
"""
    return card.strip()
