#!/usr/bin/env python3
"""
ledger.py - Autonomous Operating Ledger & Runway Auditor
Maintains /Users/rishii/ledger.json as the single source of truth.
Strictly recomputes all balances from the transaction log.
Rules:
- Active execution cycles: $1.00 / 10 min = $0.10 / min ($0.001667 / sec).
- Dormant periods awaiting external review/replies: paused ($0.00 rent).
"""

import sys
import os
import json
from datetime import datetime, timezone
from pathlib import Path

LEDGER_PATH = Path("/Users/rishii/ledger.json")
STARTING_CAPITAL = 100.00
RENT_PER_MINUTE = 0.10  # $1.00 per 10 minutes

def load_ledger():
    if not LEDGER_PATH.exists():
        return []
    try:
        with open(LEDGER_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and "entries" in data:
                return data["entries"]
            return []
    except Exception as e:
        print(f"Error loading ledger: {e}", file=sys.stderr)
        return []

def save_ledger(entries):
    with open(LEDGER_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)

def compute_state(entries):
    balance = 0.0
    for entry in entries:
        amount = float(entry.get("amount", 0.0))
        entry_type = entry.get("type", "").upper()
        if entry_type in ("INCOME", "STARTING_CAPITAL"):
            balance += abs(amount)
        elif entry_type in ("RENT", "EXPENSE"):
            balance -= abs(amount)
        elif entry_type == "PAUSE":
            pass
        else:
            balance += amount
    
    net_pnl = balance - STARTING_CAPITAL
    runway_minutes = max(0.0, balance / RENT_PER_MINUTE)
    runway_h = int(runway_minutes // 60)
    runway_m = int(runway_minutes % 60)
    return round(balance, 2), round(net_pnl, 2), runway_h, runway_m, runway_minutes

def init_ledger(start_time_iso="2026-09-09T11:07:16+05:30"):
    if LEDGER_PATH.exists():
        entries = load_ledger()
        if entries:
            print("Ledger already initialized.")
            return entries
    
    initial_entry = {
        "timestamp": start_time_iso,
        "type": "INCOME",
        "amount": STARTING_CAPITAL,
        "balance_after": STARTING_CAPITAL,
        "note": "Initial operating capital allocated by Rishi"
    }
    entries = [initial_entry]
    save_ledger(entries)
    print("Initialized ledger with $100.00.")
    return entries

def record_dormant(start_iso, end_iso, reason="Awaiting external review / operator instructions"):
    entries = load_ledger()
    current_balance, _, _, _, _ = compute_state(entries)
    entry = {
        "timestamp": end_iso,
        "type": "PAUSE",
        "amount": 0.00,
        "balance_after": current_balance,
        "note": f"Dormant clock paused from {start_iso} to {end_iso}: {reason}"
    }
    entries.append(entry)
    save_ledger(entries)
    return entries

def record_active_rent(active_minutes, note="Active execution cycle", timestamp_iso=None):
    if timestamp_iso is None:
        timestamp_iso = datetime.now().astimezone().isoformat()
    entries = load_ledger()
    if not entries:
        entries = init_ledger()
    rent_owed = round(active_minutes * RENT_PER_MINUTE, 2)
    current_balance, _, _, _, _ = compute_state(entries)
    new_balance = round(current_balance - rent_owed, 2)
    entry = {
        "timestamp": timestamp_iso,
        "type": "RENT",
        "amount": rent_owed,
        "balance_after": new_balance,
        "note": f"Active rent for {active_minutes:.2f} min: {note}"
    }
    entries.append(entry)
    save_ledger(entries)
    return entries

def add_income(amount, note, now=None):
    if now is None:
        now = datetime.now().astimezone()
    entries = load_ledger()
    if not entries:
        entries = init_ledger()
    current_balance, _, _, _, _ = compute_state(entries)
    new_balance = round(current_balance + float(amount), 2)
    entry = {
        "timestamp": now.isoformat(),
        "type": "INCOME",
        "amount": round(float(amount), 2),
        "balance_after": new_balance,
        "note": note
    }
    entries.append(entry)
    save_ledger(entries)
    return entries

def add_expense(amount, note, now=None):
    if now is None:
        now = datetime.now().astimezone()
    entries = load_ledger()
    if not entries:
        entries = init_ledger()
    current_balance, _, _, _, _ = compute_state(entries)
    new_balance = round(current_balance - float(amount), 2)
    entry = {
        "timestamp": now.isoformat(),
        "type": "EXPENSE",
        "amount": round(float(amount), 2),
        "balance_after": new_balance,
        "note": note
    }
    entries.append(entry)
    save_ledger(entries)
    return entries

def format_status(strategy="Targeting open-source bounties & monitoring wallet",
                  last_action="Generated self-custodied EVM wallet & updated clock policy",
                  next_action="Audit live bounties on GitHub, draft PR patch for review"):
    entries = load_ledger()
    if not entries:
        entries = init_ledger()
    balance, net_pnl, rh, rm, _ = compute_state(entries)
    pnl_sign = "+" if net_pnl >= 0 else "-"
    pnl_str = f"{pnl_sign}${abs(net_pnl):.2f}"
    return f"BALANCE: ${balance:.2f} | NET P&L: {pnl_str} | RUNWAY: {rh}h {rm}m | STRATEGY: {strategy} | LAST ACTION: {last_action} | NEXT ACTION: {next_action}"

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "init":
        init_ledger()
        print(format_status())
    elif cmd == "active_rent":
        mins = float(sys.argv[2])
        note = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else "Active execution"
        record_active_rent(mins, note)
        print(format_status())
    elif cmd == "dormant":
        start_iso = sys.argv[2]
        end_iso = sys.argv[3]
        reason = " ".join(sys.argv[4:]) if len(sys.argv) > 4 else "Awaiting external events"
        record_dormant(start_iso, end_iso, reason)
        print(format_status())
    elif cmd == "income":
        amt = float(sys.argv[2])
        note = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else "Income"
        add_income(amt, note)
        print(format_status())
    elif cmd == "expense":
        amt = float(sys.argv[2])
        note = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else "Expense"
        add_expense(amt, note)
        print(format_status())
    elif cmd == "status":
        print(format_status())
    else:
        print(f"Unknown command {cmd}")
