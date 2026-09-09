#!/usr/bin/env python3
"""
Autonomous Lead Enrichment & Deep Research Pipeline - Enterprise CLI Runner
Run standalone offline, with mock fixtures, or connected to live production APIs.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from pathlib import Path
from typing import List, Optional

# Ensure package root is importable
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from enricher import (
    LeadResearcher,
    format_cli_card,
    format_json_briefing,
    format_markdown_briefing,
    LeadBriefing,
)


def load_batch_leads(filepath: str) -> List[str]:
    """
    Reads a list of target queries from a CSV or JSON file.
    """
    p = Path(filepath)
    if not p.exists():
        print(f"Error: Batch file '{filepath}' not found.", file=sys.stderr)
        sys.exit(1)

    targets: List[str] = []
    if p.suffix.lower() == ".json":
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, str):
                        targets.append(item.strip())
                    elif isinstance(item, dict):
                        target = item.get("domain") or item.get("url") or item.get("email") or item.get("target")
                        if target:
                            targets.append(str(target).strip())
    elif p.suffix.lower() == ".csv":
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            target_col = 0
            if headers:
                # Find target column
                for idx, h in enumerate(headers):
                    if h.lower() in ("domain", "url", "company", "website", "email", "target"):
                        target_col = idx
                        break
            for row in reader:
                if row and len(row) > target_col and row[target_col].strip():
                    targets.append(row[target_col].strip())
    else:
        with open(p, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    targets.append(line)

    return targets


def save_briefing_artifacts(briefing: LeadBriefing, output_dir: Path, output_format: str) -> None:
    """
    Writes JSON and Markdown briefing cards to disk.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    domain_slug = briefing.company.domain.replace(".", "_")

    if output_format in ("all", "json"):
        json_path = output_dir / f"{domain_slug}_briefing.json"
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(briefing.to_json(indent=2))

    if output_format in ("all", "markdown"):
        md_path = output_dir / f"{domain_slug}_briefing.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(briefing.summary_markdown)


def export_batch_summary_csv(briefings: List[LeadBriefing], output_dir: Path) -> Path:
    """
    Exports a clean consolidated CSV summary of all enriched leads in a batch.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "batch_enrichment_summary.csv"

    fieldnames = [
        "Company",
        "Domain",
        "Tier",
        "Overall Score",
        "ICP Fit Score",
        "Intent Score",
        "Industry",
        "Headcount",
        "Total Raised",
        "Latest Round",
        "Key Decision Maker",
        "Decision Maker Title",
        "Email Pattern",
        "Hook Angle",
    ]

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for b in briefings:
            contact_name = b.key_contacts[0].name if b.key_contacts else "N/A"
            contact_title = b.key_contacts[0].title if b.key_contacts else "N/A"
            contact_email = b.key_contacts[0].email if b.key_contacts else (b.company.contact_email or "N/A")
            writer.writerow({
                "Company": b.company.name,
                "Domain": b.company.domain,
                "Tier": b.scoring.qualification_tier,
                "Overall Score": b.scoring.overall_score,
                "ICP Fit Score": b.scoring.icp_fit_score,
                "Intent Score": b.scoring.intent_score,
                "Industry": b.company.industry,
                "Headcount": b.company.team_size,
                "Total Raised": b.financials.total_raised or "N/A",
                "Latest Round": b.financials.latest_round or "N/A",
                "Key Decision Maker": contact_name,
                "Decision Maker Title": contact_title,
                "Email Pattern": contact_email,
                "Hook Angle": b.outreach.hook_angle,
            })

    return csv_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Autonomous Lead Enrichment & Deep Research Pipeline - Enterprise Automation Suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single lead research in mock / offline mode
  python pipeline.py --target "stripe.com" --mock

  # Live web inspection with rich markdown and JSON outputs
  python pipeline.py --target "https://linear.app" --output-dir ./output

  # Batch processing of enterprise targets from CSV
  python pipeline.py --batch ./examples/sample_leads.csv --output-dir ./results --export-csv
        """,
    )

    parser.add_argument(
        "-t", "--target",
        type=str,
        help="Single company domain, URL, or lead email (e.g. 'stripe.com', 'https://linear.app', 'paul@supabase.com')",
    )
    parser.add_argument(
        "-b", "--batch",
        type=str,
        help="Path to CSV, JSON, or text file with a list of lead targets",
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=str,
        default="./output",
        help="Directory to save generated JSON and Markdown briefings (default: ./output)",
    )
    parser.add_argument(
        "-f", "--format",
        type=str,
        choices=["all", "json", "markdown", "cli"],
        default="all",
        help="Artifact export format (default: all)",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Force offline deterministic mode using built-in enterprise fixtures",
    )
    parser.add_argument(
        "--provider",
        type=str,
        choices=["auto", "openai", "anthropic", "gemini", "offline"],
        default="auto",
        help="LLM reasoning backend (default: auto)",
    )
    parser.add_argument(
        "--export-csv",
        action="store_true",
        help="Generate consolidated CSV table when running batch enrichment",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable detailed diagnostic logging",
    )

    args = parser.parse_args()

    if not args.target and not args.batch:
        parser.print_help()
        print("\nError: Please specify either --target (-t) or --batch (-b).", file=sys.stderr)
        sys.exit(1)

    researcher = LeadResearcher(
        provider=args.provider,
        force_mock=args.mock,
    )

    output_dir = Path(args.output_dir).resolve()

    # Case 1: Single Target
    if args.target:
        if args.verbose:
            print(f"[*] Commencing deep research on: {args.target}")

        briefing = researcher.research_lead(args.target)

        # Print visual CLI card
        print(format_cli_card(briefing))

        if args.format in ("all", "json", "markdown"):
            save_briefing_artifacts(briefing, output_dir, args.format)
            domain_slug = briefing.company.domain.replace(".", "_")
            print(f"\n[+] Saved briefing artifacts to: {output_dir}/")
            if args.format in ("all", "json"):
                print(f"    - {domain_slug}_briefing.json")
            if args.format in ("all", "markdown"):
                print(f"    - {domain_slug}_briefing.md")

    # Case 2: Batch Mode
    elif args.batch:
        targets = load_batch_leads(args.batch)
        print(f"[*] Commencing batch research on {len(targets)} leads from: {args.batch}")

        briefings: List[LeadBriefing] = []
        for idx, target in enumerate(targets, start=1):
            print(f"[{idx}/{len(targets)}] Processing: {target}...", end="", flush=True)
            try:
                b = researcher.research_lead(target)
                briefings.append(b)
                save_briefing_artifacts(b, output_dir, args.format)
                print(f" Done ({b.scoring.qualification_tier}, Score: {b.scoring.overall_score}/100)")
            except Exception as e:
                print(f" Failed ({e})")

        if args.export_csv or len(briefings) > 1:
            csv_path = export_batch_summary_csv(briefings, output_dir)
            print(f"\n[+] Exported consolidated CSV summary to: {csv_path}")

        print(f"[+] All batch briefings saved to: {output_dir}/")


if __name__ == "__main__":
    main()
