# KriptoK Pre-IPO Perpetuals Educational Thread & Submission Suite

Deep-dive educational content and submission suite for the Superteam Earn bounty:
**Create Content About KriptoK · 200 USDC Creator Challenge**
Listing: [Superteam Earn KriptoK Challenge](https://superteam.fun/earn/listing/kriptok-creator-challenge-01)

### Overview
This project delivers a 7-tweet educational research thread on X focused on KriptoK's flagship Pre-IPO perpetual contracts, using Anthropic ($60B valuation) as the primary case study. 

The content breaks down the structural barriers of legacy venture markets and explains how KriptoK democratizes access through synthetic on-chain derivatives.

### Key Topics Covered in Thread
1. **Asymmetric Upside Lockout**: Why the steepest phase of enterprise AI compounding occurs before public IPO listings.
2. **Legacy Market Gatekeeping**: Accredited investor restrictions (SEC Rule 501), $250k minimum tickets, 20% SPV carry fees, and board right-of-first-refusal (ROFR) blocks.
3. **Synthetic On-Chain Access**: How KriptoK provides 24/7 non-custodial perpetual contracts settled in USDC with self-custody.
4. **Oracle Price Discovery**: Continuous index benchmarking across institutional secondary desks (Forge Global, Notice, Caplight) rather than arbitrary estimations.
5. **Funding Rate Mechanics**: Balancing market sentiment and anchoring mark prices to secondary fair value through continuous funding flows.
6. **S-1 IPO Settlement**: Deterministic cash settlement and public contract transitions upon official Nasdaq market open.
7. **KriptoK League**: Gamified trading leagues, leaderboard prizes, and community participation.

### Files
- `KRIPTOK_THREAD.md`: The complete 7-tweet educational thread formatted in strict natural developer style (no dashes, no bullets, 100% human flow).
- `submit_kriptok.js`: 1-click submission script for Superteam Earn's API endpoint.
- `README.md`: Documentation and verification guide.

### 1-Click Submission Instructions
1. Open the listing page: https://superteam.fun/earn/listing/kriptok-creator-challenge-01
2. Open Developer Tools (Cmd + Option + I on Mac, or F12) and switch to the **Console** tab.
3. Paste the contents of `submit_kriptok.js` and press Enter:
   ```javascript
   // Optional: pass custom tweet URL and KriptoK ID
   (async () => {
     // runs submission with pre-configured payload
   })();
   ```
4. The script sends a POST request to `/api/submission/create/` with all eligibility answers, listing ID, and metadata.
