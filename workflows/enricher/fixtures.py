"""
Autonomous Lead Enrichment & Deep Research Pipeline - Intelligent Fixtures
Deterministic, production-accurate intelligence fixtures for mock mode, offline testing,
and resilient zero-API fallback.
"""

from __future__ import annotations

import re
from typing import Dict, Optional
from enricher.models import (
    CompanyInfo,
    FinancialsAndFunding,
    TechStackProfile,
    ExecutiveContact,
    ScoringAndTier,
    OutreachAngle,
    LeadBriefing,
)


FIXTURES: Dict[str, Dict] = {
    "stripe.com": {
        "company": {
            "name": "Stripe",
            "domain": "stripe.com",
            "url": "https://stripe.com",
            "description": "Financial infrastructure platform for the internet, powering payments, billing, and global commerce for millions of companies.",
            "industry": "FinTech / Payments Infrastructure",
            "founded_year": 2010,
            "headquarters": "South San Francisco, CA & Dublin, Ireland",
            "team_size": "8,000+ employees",
            "estimated_headcount": 8200,
            "linkedin_url": "https://www.linkedin.com/company/stripe",
            "twitter_handle": "@stripe",
            "github_url": "https://github.com/stripe",
            "contact_email": "press@stripe.com",
        },
        "financials": {
            "total_raised": "$8.7B+",
            "latest_round": "Series I / Secondary",
            "latest_round_date": "2024-02",
            "valuation": "$65B",
            "notable_investors": ["Sequoia Capital", "Founders Fund", "Andreessen Horowitz", "General Catalyst", "Khosla Ventures"],
            "revenue_stage": "$14B+ Gross Revenue ($3B+ Net ARR)",
        },
        "tech_stack": {
            "frontend": ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
            "backend": ["Ruby (Sorbet)", "Go", "Java", "Scala", "Python"],
            "database_and_cloud": ["PostgreSQL", "MongoDB", "Redis", "AWS (EC2, S3, RDS)", "Envoy"],
            "analytics_and_marketing": ["Segment", "Google Analytics 4", "Marketo", "Amplitude"],
            "payments_and_security": ["Stripe Terminal", "Stripe Radar", "Vault Infrastructure", "Okta"],
            "detected_signatures": ["react", "nextjs", "aws", "stripe", "cloudflare"],
        },
        "key_contacts": [
            {
                "name": "Patrick Collison",
                "title": "Chief Executive Officer & Co-Founder",
                "department": "Executive",
                "relevance_note": "Ultimate decision maker for strategic infrastructure and global partnerships.",
                "linkedin_url": "https://www.linkedin.com/in/patrickcollison",
                "email": "patrick@stripe.com",
            },
            {
                "name": "David Singleton",
                "title": "Chief Technology Officer",
                "department": "Engineering",
                "relevance_note": "Leads all core engineering, infrastructure resilience, and distributed platforms.",
                "linkedin_url": "https://www.linkedin.com/in/davidsingleton",
                "email": "dave@stripe.com",
            },
            {
                "name": "Claire Hughes Johnson",
                "title": "Corporate Officer & Strategic Advisor",
                "department": "Operations",
                "relevance_note": "Authority on operational scaling and enterprise organizational effectiveness.",
                "linkedin_url": "https://www.linkedin.com/in/claire-hughes-johnson",
                "email": "claire@stripe.com",
            },
        ],
        "scoring": {
            "icp_fit_score": 96,
            "intent_score": 92,
            "overall_score": 94,
            "qualification_tier": "Tier 1: Enterprise Target",
            "fit_breakdown": {
                "tech_alignment": 25,
                "scale_and_headcount": 25,
                "capital_health": 25,
                "market_velocity": 21,
            },
            "intent_signals": [
                "Expanding autonomous AI agent billing protocols & machine-to-machine checkout",
                "Aggressive hiring across enterprise payments integrations and global compliance",
                "High-volume developer API updates across 40+ countries",
            ],
            "risk_factors": [
                "Extremely strict internal procurement and security vetting cycles (6-9 months)",
                "Proprietary in-house tooling bias for developer-facing workflows",
            ],
        },
        "outreach": {
            "recommended_persona": "Head of Enterprise Engineering / VP Payments",
            "hook_angle": "Autonomous settlement rails and machine-to-machine checkout orchestration",
            "cold_email_subject": "Stripe + autonomous M2M transaction automation",
            "cold_email_body": (
                "Hi Patrick,\n\n"
                "Saw Stripe's recent strides expanding programmatic checkout for agentic workflows. "
                "As autonomous agents begin transacting directly on behalf of engineering teams, "
                "traditional session-based payment flows bottleneck at invoice reconciliation.\n\n"
                "We engineered an autonomous enrichment & execution pipeline that pairs machine-authenticated "
                "contracts with instant webhook settlement, cutting API integration friction by 68%.\n\n"
                "Open to a brief 7-minute architecture walk next Tuesday?\n\n"
                "Best,\n"
                "Rishii Yadav"
            ),
            "discovery_questions": [
                "How is your enterprise team standardizing programmatic API agent payouts across cross-border subsidiaries?",
                "What is your current latency tolerance for real-time risk score enrichment prior to webhook dispatch?",
            ],
        },
    },
    "linear.app": {
        "company": {
            "name": "Linear",
            "domain": "linear.app",
            "url": "https://linear.app",
            "description": "The purpose-built tool for modern product development, issue tracking, and automated sprint management.",
            "industry": "Developer Tools / B2B SaaS",
            "founded_year": 2019,
            "headquarters": "San Francisco, CA, USA",
            "team_size": "80-120 employees",
            "estimated_headcount": 105,
            "linkedin_url": "https://www.linkedin.com/company/linear-app",
            "twitter_handle": "@linear",
            "github_url": "https://github.com/linear",
            "contact_email": "hello@linear.app",
        },
        "financials": {
            "total_raised": "$52M",
            "latest_round": "Series B",
            "latest_round_date": "2023-09",
            "valuation": "$400M+",
            "notable_investors": ["Accel", "Sequoia Capital", "Slack Fund"],
            "revenue_stage": "$30M+ ARR (High Efficiency)",
        },
        "tech_stack": {
            "frontend": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Custom WebGL / Canvas"],
            "backend": ["Node.js", "TypeScript", "GraphQL", "Sync Engine (Client-side SQLite)"],
            "database_and_cloud": ["PostgreSQL", "Redis", "Cloudflare Workers", "AWS"],
            "analytics_and_marketing": ["Segment", "PostHog", "Customer.io"],
            "payments_and_security": ["Stripe", "WorkOS (SSO)", "Cloudflare Access"],
            "detected_signatures": ["react", "nextjs", "cloudflare", "typescript"],
        },
        "key_contacts": [
            {
                "name": "Karri Saarinen",
                "title": "Chief Executive Officer & Co-Founder",
                "department": "Executive",
                "relevance_note": "Design visionary and product architect with final authority on core integrations.",
                "linkedin_url": "https://www.linkedin.com/in/karrisaarinen",
                "email": "karri@linear.app",
            },
            {
                "name": "Tuomas Artman",
                "title": "Co-Founder & Head of Engineering",
                "department": "Engineering",
                "relevance_note": "Architect of Linear's real-time sync architecture and offline-first data synchronization engine.",
                "linkedin_url": "https://www.linkedin.com/in/tuomasartman",
                "email": "tuomas@linear.app",
            },
        ],
        "scoring": {
            "icp_fit_score": 93,
            "intent_score": 89,
            "overall_score": 91,
            "qualification_tier": "Tier 1: Enterprise Target",
            "fit_breakdown": {
                "tech_alignment": 25,
                "scale_and_headcount": 23,
                "capital_health": 23,
                "market_velocity": 20,
            },
            "intent_signals": [
                "Released Linear Asks and customer request automations for enterprise CS teams",
                "Scaling enterprise tier features (Custom Workflows, Audit Logs, SOC2)",
                "Expanding real-time webhook APIs for third-party orchestration engines",
            ],
            "risk_factors": [
                "Intensely high aesthetic and craftsmanship bar; rejects generic software solutions",
                "Lean team size requires high self-serve low-friction onboarding",
            ],
        },
        "outreach": {
            "recommended_persona": "Head of Product / Ecosystem Partnerships",
            "hook_angle": "Bi-directional autonomous issue triage and AI-assisted triage routing",
            "cold_email_subject": "Bi-directional triage automation for Linear Asks",
            "cold_email_body": (
                "Hi Karri,\n\n"
                "Linear's speed and keyboard-first ethos set the gold standard for software tools. "
                "As enterprise teams adopt Linear Asks, the manual effort of de-duplicating cross-channel "
                "Slack requests into clean, formatted cycles is becoming a primary friction point.\n\n"
                "We developed an autonomous enrichment pipeline that consumes incoming customer tickets, "
                "identifies related codebases and historical issues, and pre-populates actionable Linear issues "
                "with reproducible stack traces.\n\n"
                "Would love to show you a 3-minute clip of how it runs on Linear's public GraphQL API.\n\n"
                "Best,\n"
                "Rishii Yadav"
            ),
            "discovery_questions": [
                "How are your largest enterprise accounts handling deduplication across Slack Connect and Linear Asks today?",
                "What is your roadmap for programmatic agent actions triggered by issue state transitions?",
            ],
        },
    },
    "supabase.com": {
        "company": {
            "name": "Supabase",
            "domain": "supabase.com",
            "url": "https://supabase.com",
            "description": "Open source Firebase alternative providing Postgres database, Authentication, Instant APIs, Edge Functions, Realtime subscriptions, and Vector storage.",
            "industry": "Developer Infrastructure / Cloud Database",
            "founded_year": 2020,
            "headquarters": "San Francisco, CA & Remote Global",
            "team_size": "100-200 employees",
            "estimated_headcount": 140,
            "linkedin_url": "https://www.linkedin.com/company/supabase",
            "twitter_handle": "@supabase",
            "github_url": "https://github.com/supabase",
            "contact_email": "support@supabase.com",
        },
        "financials": {
            "total_raised": "$116M",
            "latest_round": "Series B",
            "latest_round_date": "2022-05",
            "valuation": "$1B+",
            "notable_investors": ["Coatue", "Felicis", "Y Combinator", "Mozilla Corporation"],
            "revenue_stage": "$40M+ ARR (Developer Cloud)",
        },
        "tech_stack": {
            "frontend": ["Next.js", "React", "TypeScript", "Tailwind CSS", "Radix UI"],
            "backend": ["Elixir", "Go", "TypeScript / Deno (Edge Functions)", "PostgreSQL", "pgvector"],
            "database_and_cloud": ["PostgreSQL", "AWS (EC2, RDS, Fly.io)", "Cloudflare"],
            "analytics_and_marketing": ["PostHog", "Segment", "Google Analytics 4"],
            "payments_and_security": ["Stripe", "Supabase Auth (Gotrue)", "pg_cron", "PostgREST"],
            "detected_signatures": ["nextjs", "react", "postgresql", "cloudflare", "stripe"],
        },
        "key_contacts": [
            {
                "name": "Paul Copplestone",
                "title": "Chief Executive Officer & Co-Founder",
                "department": "Executive",
                "relevance_note": "Leads corporate strategy, developer evangelism, and database cloud expansion.",
                "linkedin_url": "https://www.linkedin.com/in/paulcopplestone",
                "email": "paul@supabase.com",
            },
            {
                "name": "Ant Wilson",
                "title": "Chief Technology Officer & Co-Founder",
                "department": "Engineering",
                "relevance_note": "Architect of Supabase core backend systems and distributed realtime infrastructure.",
                "linkedin_url": "https://www.linkedin.com/in/antwilson",
                "email": "ant@supabase.com",
            },
        ],
        "scoring": {
            "icp_fit_score": 97,
            "intent_score": 94,
            "overall_score": 95,
            "qualification_tier": "Tier 1: Enterprise Target",
            "fit_breakdown": {
                "tech_alignment": 25,
                "scale_and_headcount": 24,
                "capital_health": 24,
                "market_velocity": 22,
            },
            "intent_signals": [
                "Massive expansion in pgvector and AI agent database tooling",
                "Rapid enterprise security push (SOC2 Type II, HIPAA, dedicated instances)",
                "High developer mindshare with 75,000+ GitHub stars",
            ],
            "risk_factors": [
                "Open source culture prioritizes community PRs over closed enterprise contracts",
            ],
        },
        "outreach": {
            "recommended_persona": "Head of Enterprise Growth / VP Engineering",
            "hook_angle": "Automated pgvector indexing pipelines & enterprise migration telemetry",
            "cold_email_subject": "Autonomous vector pipeline for enterprise Supabase migrations",
            "cold_email_body": (
                "Hi Paul,\n\n"
                "Huge fan of Supabase's trajectory, especially the developer love around pgvector and Edge Functions. "
                "When enterprise teams migrate from legacy Firebase or self-hosted Mongo, orchestrating batch schema "
                "migrations and RLS policy verification often stalls adoption cycles.\n\n"
                "We built an autonomous ingestion and schema validation pipeline that auto-generates TypeScript types, "
                "verifies RLS policies under load, and optimizes vector indexing in under 5 minutes.\n\n"
                "Worth a quick chat to see if this could accelerate Supabase Enterprise deal velocity?\n\n"
                "Best,\n"
                "Rishii Yadav"
            ),
            "discovery_questions": [
                "What is the number one bottleneck enterprise prospects report when validating Row Level Security at scale?",
                "How are you automating high-volume vector ingestion benchmarks for enterprise POCs?",
            ],
        },
    },
    "retool.com": {
        "company": {
            "name": "Retool",
            "domain": "retool.com",
            "url": "https://retool.com",
            "description": "The fast way to build internal tools. Visually design user interfaces, connect to any database or API, and write custom queries with JavaScript.",
            "industry": "Enterprise Low-Code / Internal Tools",
            "founded_year": 2017,
            "headquarters": "San Francisco, CA, USA",
            "team_size": "300-500 employees",
            "estimated_headcount": 420,
            "linkedin_url": "https://www.linkedin.com/company/retool",
            "twitter_handle": "@retool",
            "github_url": "https://github.com/tryretool",
            "contact_email": "sales@retool.com",
        },
        "financials": {
            "total_raised": "$127M+",
            "latest_round": "Series C",
            "latest_round_date": "2022-07",
            "valuation": "$3.2B",
            "notable_investors": ["Sequoia Capital", "John Collison", "Patrick Collison", "Nat Friedman"],
            "revenue_stage": "$100M+ ARR",
        },
        "tech_stack": {
            "frontend": ["React", "TypeScript", "Redux", "Custom Component Framework"],
            "backend": ["Node.js", "Python", "Go"],
            "database_and_cloud": ["PostgreSQL", "Redis", "AWS", "Kubernetes", "Docker"],
            "analytics_and_marketing": ["Segment", "PostHog", "Clearbit", "HubSpot"],
            "payments_and_security": ["Stripe", "Okta", "SAML SSO", "Audit Logs"],
            "detected_signatures": ["react", "typescript", "aws", "segment"],
        },
        "key_contacts": [
            {
                "name": "David Hsu",
                "title": "Chief Executive Officer & Founder",
                "department": "Executive",
                "relevance_note": "Drives company strategy, enterprise positioning, and core product architecture.",
                "linkedin_url": "https://www.linkedin.com/in/david-hsu-retool",
                "email": "david@retool.com",
            },
            {
                "name": "Mark Coleman",
                "title": "VP of Engineering",
                "department": "Engineering",
                "relevance_note": "Oversees enterprise self-hosted deployment, governance, and cloud infrastructure.",
                "linkedin_url": "https://www.linkedin.com/in/markcoleman",
                "email": "mark@retool.com",
            },
        ],
        "scoring": {
            "icp_fit_score": 91,
            "intent_score": 88,
            "overall_score": 90,
            "qualification_tier": "Tier 1: Enterprise Target",
            "fit_breakdown": {
                "tech_alignment": 23,
                "scale_and_headcount": 25,
                "capital_health": 24,
                "market_velocity": 18,
            },
            "intent_signals": [
                "Launched Retool AI, Retool Workflows, and Retool Mobile",
                "Expanding self-hosted enterprise deployments with strict air-gapped security",
                "Targeting Fortune 500 operations and fintech internal portal consolidation",
            ],
            "risk_factors": [
                "Enterprise sales cycles can involve multiple internal IT and compliance stakeholders",
            ],
        },
        "outreach": {
            "recommended_persona": "VP of Solutions Engineering / Head of Enterprise Partnerships",
            "hook_angle": "Automated workflow backends for mission-critical Retool frontends",
            "cold_email_subject": "Pre-built n8n & Python workflow orchestration for Retool apps",
            "cold_email_body": (
                "Hi David,\n\n"
                "Retool has transformed how engineering teams deliver operational internal software. "
                "However, as apps scale beyond simple CRUD into asynchronous multi-step lead enrichment "
                "and scheduled compliance batch jobs, building stateful queues inside Retool Workflows requires "
                "custom glue code.\n\n"
                "We designed an autonomous enterprise pipeline connecting n8n and hardened Python runners that "
                "seamlessly feeds clean JSON briefing cards directly into Retool table components with sub-second latency.\n\n"
                "Do you have 10 minutes for a brief architecture demo?\n\n"
                "Best,\n"
                "Rishii Yadav"
            ),
            "discovery_questions": [
                "How are your enterprise architects tackling long-running background tasks (>5 min) in Retool Workflows?",
                "What is your target integration pattern for automated third-party data enrichment?",
            ],
        },
    },
    "vercel.com": {
        "company": {
            "name": "Vercel",
            "domain": "vercel.com",
            "url": "https://vercel.com",
            "description": "The Frontend Cloud platform providing developer experience and edge infrastructure to build, deploy, and scale web applications.",
            "industry": "Cloud Computing / Developer Tools",
            "founded_year": 2015,
            "headquarters": "San Francisco, CA, USA",
            "team_size": "500-750 employees",
            "estimated_headcount": 620,
            "linkedin_url": "https://www.linkedin.com/company/vercel",
            "twitter_handle": "@vercel",
            "github_url": "https://github.com/vercel",
            "contact_email": "press@vercel.com",
        },
        "financials": {
            "total_raised": "$313M+",
            "latest_round": "Series D / Growth",
            "latest_round_date": "2024-05",
            "valuation": "$3.25B",
            "notable_investors": ["Accel", "CRV", "GV", "Tiger Global Management", "Bedrock Capital"],
            "revenue_stage": "$120M+ ARR",
        },
        "tech_stack": {
            "frontend": ["Next.js", "React", "TypeScript", "Tailwind CSS", "Geist UI"],
            "backend": ["Rust (Turbopack)", "Go", "Node.js", "Edge Middleware"],
            "database_and_cloud": ["AWS", "Cloudflare", "Edge Network", "Vercel Postgres", "Vercel KV"],
            "analytics_and_marketing": ["Vercel Web Analytics", "Segment", "HubSpot", "PostHog"],
            "payments_and_security": ["Stripe", "WorkOS", "DDoS Mitigation", "Enterprise SSO"],
            "detected_signatures": ["nextjs", "react", "vercel", "cloudflare", "tailwind"],
        },
        "key_contacts": [
            {
                "name": "Guillermo Rauch",
                "title": "Chief Executive Officer & Founder",
                "department": "Executive",
                "relevance_note": "Frontend pioneer, creator of Socket.io and Next.js, controls product roadmap.",
                "linkedin_url": "https://www.linkedin.com/in/guillermo-rauch",
                "email": "rauchg@vercel.com",
            },
            {
                "name": "Malte Ubl",
                "title": "Chief Technology Officer",
                "department": "Engineering",
                "relevance_note": "Directs engineering infrastructure, web standards, and distributed rendering.",
                "linkedin_url": "https://www.linkedin.com/in/malteubl",
                "email": "malte@vercel.com",
            },
        ],
        "scoring": {
            "icp_fit_score": 98,
            "intent_score": 95,
            "overall_score": 96,
            "qualification_tier": "Tier 1: Enterprise Target",
            "fit_breakdown": {
                "tech_alignment": 25,
                "scale_and_headcount": 25,
                "capital_health": 25,
                "market_velocity": 21,
            },
            "intent_signals": [
                "Leading the AI SDK and v0.dev generative UI ecosystem",
                "Aggressive expansion into Enterprise AI frontends and secure edge computing",
                "Over 1 billion monthly page requests served across global edge CDN",
            ],
            "risk_factors": [
                "High brand awareness makes inbound noise substantial; cold outreach must be hyper-technical",
            ],
        },
        "outreach": {
            "recommended_persona": "VP of AI Ecosystem / Head of Product",
            "hook_angle": "Autonomous code generation pipeline with AST validation for v0 & Next.js",
            "cold_email_subject": "Autonomous AST-validated UI pipeline for Next.js",
            "cold_email_body": (
                "Hi Guillermo,\n\n"
                "The velocity Vercel has unlocked with Next.js App Router and the AI SDK is unmatched. "
                "As teams generate more dynamic interfaces with v0, verifying that generated React components "
                "meet production accessibility and zero-CLS performance standards before deployment remains a challenge.\n\n"
                "We engineered an autonomous enrichment and headless verification pipeline that compiles, lints, "
                "and captures visual Playwright diffs on Next.js branches in under 8 seconds.\n\n"
                "Would you be open to an 8-minute sync to see how it integrates with Vercel Preview deployments?\n\n"
                "Best,\n"
                "Rishii Yadav"
            ),
            "discovery_questions": [
                "How are your enterprise clients automating accessibility and performance testing in their CI/CD preview pipelines?",
                "What is the biggest friction point teams experience when connecting LLM outputs to live React components?",
            ],
        },
    },
}


def generate_generic_fixture(domain: str, company_name: Optional[str] = None, scraped_text: str = "") -> Dict:
    """
    Intelligently generates a realistic, high-fidelity fixture for any domain when offline.
    """
    clean_domain = domain.lower().strip()
    if clean_domain.startswith("www."):
        clean_domain = clean_domain[4:]

    # Infer company name from domain if not provided
    if not company_name:
        parts = clean_domain.split(".")[0].split("-")
        company_name = " ".join(p.capitalize() for p in parts)

    # Heuristic tech signatures
    signatures = ["react", "nextjs", "cloudflare", "aws", "typescript", "tailwind"]
    if "ai" in clean_domain or "model" in clean_domain:
        signatures.extend(["pytorch", "python", "fastapi", "gpu-cluster"])
        industry = "Artificial Intelligence / Machine Learning"
    elif "pay" in clean_domain or "bank" in clean_domain or "fin" in clean_domain:
        signatures.extend(["postgresql", "stripe", "security-headers"])
        industry = "FinTech / Financial Services"
    elif "health" in clean_domain or "med" in clean_domain:
        signatures.extend(["hipaa-compliant", "aws", "react"])
        industry = "HealthTech / Digital Health"
    else:
        industry = "Enterprise Cloud & Software / B2B SaaS"

    return {
        "company": {
            "name": company_name,
            "domain": clean_domain,
            "url": f"https://{clean_domain}",
            "description": f"{company_name} is an innovative {industry} enterprise providing high-performance scalable solutions.",
            "industry": industry,
            "founded_year": 2021,
            "headquarters": "San Francisco, CA, USA",
            "team_size": "50-150 employees",
            "estimated_headcount": 85,
            "linkedin_url": f"https://www.linkedin.com/company/{clean_domain.split('.')[0]}",
            "twitter_handle": f"@{clean_domain.split('.')[0]}",
            "github_url": f"https://github.com/{clean_domain.split('.')[0]}",
            "contact_email": f"contact@{clean_domain}",
        },
        "financials": {
            "total_raised": "$18M - $35M (Estimated)",
            "latest_round": "Series A / Growth",
            "latest_round_date": "2023-11",
            "valuation": "$90M - $160M",
            "notable_investors": ["Top-tier Venture Capital", "Industry Angel Syndicates"],
            "revenue_stage": "$5M - $15M ARR",
        },
        "tech_stack": {
            "frontend": ["React", "TypeScript", "Next.js", "Tailwind CSS"],
            "backend": ["Python / FastAPI", "Node.js", "Go", "REST & GraphQL APIs"],
            "database_and_cloud": ["PostgreSQL", "AWS / Cloudflare", "Redis", "Docker"],
            "analytics_and_marketing": ["Segment", "PostHog", "Google Analytics 4"],
            "payments_and_security": ["Stripe", "WorkOS / Auth0", "Cloudflare WAF"],
            "detected_signatures": signatures,
        },
        "key_contacts": [
            {
                "name": f"Alex Morgan",
                "title": "Chief Executive Officer & Founder",
                "department": "Executive",
                "relevance_note": f"Key executive driving strategic growth and technology adoption at {company_name}.",
                "linkedin_url": f"https://www.linkedin.com/in/{clean_domain.split('.')[0]}-ceo",
                "email": f"alex@{clean_domain}",
            },
            {
                "name": f"Jordan Reed",
                "title": "VP of Engineering",
                "department": "Engineering",
                "relevance_note": f"Directs technology stack choices and developer tooling infrastructure.",
                "linkedin_url": f"https://www.linkedin.com/in/{clean_domain.split('.')[0]}-vpeng",
                "email": f"jordan@{clean_domain}",
            },
        ],
        "scoring": {
            "icp_fit_score": 87,
            "intent_score": 84,
            "overall_score": 86,
            "qualification_tier": "Tier 1: Enterprise Target",
            "fit_breakdown": {
                "tech_alignment": 22,
                "scale_and_headcount": 22,
                "capital_health": 21,
                "market_velocity": 21,
            },
            "intent_signals": [
                f"Active hiring in software engineering and RevOps for {company_name}",
                "Modern cloud-native tech stack verified via public DNS and headers",
                "Strong digital footprint indicating rapid customer growth",
            ],
            "risk_factors": [
                "Requires validation of specific procurement budget cycle",
            ],
        },
        "outreach": {
            "recommended_persona": "VP of Engineering / Head of Product",
            "hook_angle": f"Workflow automation and intelligence enrichment for {company_name}",
            "cold_email_subject": f"Autonomous pipeline integration for {company_name}",
            "cold_email_body": (
                f"Hi Alex,\n\n"
                f"Loved tracking {company_name}'s momentum in the {industry} space. "
                f"As engineering teams accelerate product velocity, manual lead qualification and pipeline "
                f"research often pull senior engineers into repetitive ops work.\n\n"
                f"We developed an autonomous enrichment engine that automatically synthesizes public tech stacks, "
                f"funding signals, and key decision makers into high-fidelity JSON briefing cards.\n\n"
                f"Would you be open to a brief 7-minute architecture walk next week?\n\n"
                f"Best,\n"
                f"Rishii Yadav"
            ),
            "discovery_questions": [
                f"How is {company_name} currently qualifying high-intent enterprise inbound leads?",
                "What is your target integration latency for automated CRM enrichment?",
            ],
        },
    }


def get_lead_fixture(domain: str, company_name: Optional[str] = None) -> LeadBriefing:
    """
    Returns a complete typed LeadBriefing object from fixtures or generic generator.
    """
    import datetime
    clean_domain = domain.lower().strip()
    if clean_domain.startswith("https://"):
        clean_domain = clean_domain[8:]
    elif clean_domain.startswith("http://"):
        clean_domain = clean_domain[7:]
    clean_domain = clean_domain.split("/")[0].split(":")[0]
    if clean_domain.startswith("www."):
        clean_domain = clean_domain[4:]

    data = FIXTURES.get(clean_domain)
    if not data:
        data = generate_generic_fixture(clean_domain, company_name)

    company_data = data["company"]
    financials_data = data["financials"]
    tech_data = data["tech_stack"]
    contacts_data = data["key_contacts"]
    scoring_data = data["scoring"]
    outreach_data = data["outreach"]

    company = CompanyInfo(**company_data)
    financials = FinancialsAndFunding(**financials_data)
    tech_stack = TechStackProfile(**tech_data)
    key_contacts = [ExecutiveContact(**c) for c in contacts_data]
    scoring = ScoringAndTier(**scoring_data)
    outreach = OutreachAngle(**outreach_data)

    lead_id = f"lead_{re.sub(r'[^a-zA-Z0-9]', '_', clean_domain)}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return LeadBriefing(
        lead_id=lead_id,
        target_query=domain,
        timestamp=timestamp,
        enrichment_source="offline_intelligence_fixtures",
        company=company,
        financials=financials,
        tech_stack=tech_stack,
        key_contacts=key_contacts,
        scoring=scoring,
        outreach=outreach,
    )
