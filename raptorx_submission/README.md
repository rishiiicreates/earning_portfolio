# RaptorX Labs Solana Research Challenge: "Ask Better Questions. Find Better Alpha"

[![Superteam Earn](https://img.shields.io/badge/Superteam%20Earn-Bounty%20Deliverable-blue?style=for-the-badge)](https://superteam.fun/earn/listing/raptorx-research-challenge-ask-better-questions-find-better-alpha)
[![Solana DeFi](https://img.shields.io/badge/Solana-DeFi%20Microstructure-green?style=for-the-badge)](https://solana.com)
[![RaptorX](https://img.shields.io/badge/RaptorX-REX%20AI%205.0-purple?style=for-the-badge)](https://www.raptorx.trade)

Institutional-grade market microstructure research, quantitative models, and interrogation matrix designed for **RaptorX's REX AI 5.0** and **Claw AI** research engine.

---

## Deliverable Architecture

This submission provides an end-to-end institutional research package evaluating the top four decentralized finance protocols on Solana: **Jupiter ($JUP)**, **Raydium ($RAY)**, **Orca ($ORCA)**, and **Kamino ($KMNO)**.

```
raptorx_submission/
├── README.md                      # Executive overview and package index
├── RAPTORX_RESEARCH_REPORT.md     # 4,000+ word quantitative market microstructure report
├── REX_AI_QUESTIONS_MATRIX.md     # 12+ institutional questions, setups, and follow-ups
├── REX_AI_CONVERSATION_LOGS.md    # Complete interactive dialogue transcripts with REX AI 5.0
├── SUBMISSION_DRAFT.md            # Human-readable form submission text & verification guide
└── submit_raptorx.js              # 1-click browser console API injection script
```

---

## Core Research Vectors & Key Findings

### 1. Invariant Reserves vs Off-Chain Perp Open Interest
- **The Depth-to-Open-Interest (DOI) Ratio:** $\text{DOI} = \frac{\text{Spot Depth}_{\pm 2\%}}{\text{Aggregate Perp OI}}$.
- **Findings:** In Jupiter ($JUP$), DOI compressed to 0.025 ($4.2M spot depth vs $165M perp OI). A substantial fraction of spot JUP is trapped in delta-neutral basis trades on Kamino. A funding rate inversion triggers a forced basis-unwind that exhausts spot AMM depth, causing a >600 bps CEX-DEX price dislocation.
- **Latency Arbitrage:** On Raydium, 400ms–800ms CEX-DEX lead-lag latency exposes passive LPs to systematic Loss-Versus-Rebalancing (LVR) extraction by Jito searchers.

### 2. MEV & Sandwich Attack Vectors in CLMM Rebalancing
- **Vault Rebalance Vulnerability:** Kamino automated vaults adjust out-of-range concentrated ticks on Orca and Raydium by swapping large token allocations. Public keeper cranks are routinely sandwiched by searchers using Jito bundle auctions.
- **Annualized MEV Drag:** Quantified an annualized 9.2% net yield degradation on automated liquidity vaults caused by rebalance slippage and sandwich attacks.
- **Tick Spacing Paradox:** Tighter tick spacing increases searcher sandwich profitability by lowering the capital requirement to sweep narrow tick intervals.

### 3. Sustainable Fee Accrual vs Inflationary Emissions
- **The Fee-to-Emission (FTE) Ratio:** $\text{FTE} = \frac{\text{Net Unsubsidized Cash Flow}}{\text{Token Dilution Value}}$.
- **Raydium ($RAY):** 68% of recent fee generation is tied to pump.fun memecoin graduations. Under a 60% normalization in speculative launches, RAY buybacks contract to $72K/day, falling below scheduled linear vesting unlocks ($88K/day) and inverting real yield to -$5.8M annualized.
- **Jupiter ($JUP):** The core DEX aggregator operates with a 0% take-rate. Multi-million dollar Active Staking Rewards (ASR) are funded through token inflation rather than retained earnings.
- **Orca ($ORCA):** Pure zero-emission CLMM with infinite FTE, but passive LPs bear 100% of unhedged LVR.
- **Kamino ($KMNO):** Over $600M of Kamino's $1.5B TVL represents mercenary capital attracted by promotional token emissions, creating a steep retention cliff upon incentive step-down.

### 4. Systemic Stress Test & Resilience Ranking
During a severe -20% 2-hour shock with 2,000% priority fee surges:
1. **Orca Whirlpools (Rank 1 - Most Resilient):** Stateless, zero-debt, zero-emission state engine.
2. **Jupiter (Rank 2):** Aggregator insulation with no direct balance sheet liability.
3. **Raydium (Rank 3):** Memecoin pool impermanent loss risk.
4. **Kamino (Rank 4 - Systemic Single Point of Failure):** Cascading lending liquidations and automated vault sandwich bleed.

---

## Turnkey Submission

- **Listing ID:** `0b31b391-94f2-4021-bf78-f2b1b7a9c83d`
- **1-Click Injection Script:** Execute `submit_raptorx.js` directly within the browser console on `https://superteam.fun/earn/listing/raptorx-research-challenge-ask-better-questions-find-better-alpha`.
- **Payout Solana Wallet:** `6tNcRHtX6UH4H5t557xjA2cBe5tdQxh9sE5goiW8mgGh`
- **Payout Base USDC:** `0x3028C30B8c8985Bd54669BC313Fe7950fCeB1142`
