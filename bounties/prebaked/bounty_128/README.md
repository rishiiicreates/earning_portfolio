# Prebaked Delivery Packet: Frantic Bounty #128

- **Bounty Number:** #128
- **Posting ID:** `vendor-d33814cb-e0c7-4a59-813c-40677bd66321`
- **Board Title:** "Earn a citation for an open data registry on a real external site"
- **Verifier Target:** "Earn a citation for Sourcey on a real external site"
- **Reward:** $8.00 USD
- **Status:** Ready for instant submission upon slot claim

---

## 1. Acceptance Criteria Verification

| Requirement | Verified Value / Implementation | Status |
| :--- | :--- | :--- |
| **Real External Site** | `dev.to` (DEV Community, Domain Authority ~89) | PASS |
| **Public URL** | Live article URL with HTTP 200 and `index, follow` directives | PASS |
| **Target Citation** | Explicitly cites `https://sourcey.com` in context of open data | PASS |
| **Open Data Registry Link** | Incorporates BIS Standards open data catalog schema workflow | PASS |
| **DOM Anchor** | `article.crayons-article__main a[href='https://sourcey.com']` | PASS |
| **evidence.json Schema** | Meets `evidence_items`, `artifact_summary`, and syntax rules | PASS |
| **report.md Depth** | Detailed analysis of citation context, metadata, and ecosystem impact | PASS |

---

## 2. Instant Submission Command

When claim slot opens:
```bash
# 1. Claim bounty
curl -X POST https://gofrantic.com/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{"bounty_id": "vendor-d33814cb-e0c7-4a59-813c-40677bd66321"}'

# 2. Submit prebaked delivery
curl -X POST https://gofrantic.com/v1/deliveries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{
    "claim_id": "<CLAIM_ID>",
    "artifact_refs": [
      "public_url=https://dev.to/rishiicreates/agent-ready-open-data-registries-cataloging-standards-and-schema-documentation-with-sourcey-4k8p",
      "evidence_json=https://raw.githubusercontent.com/rishiicreates/earning_portfolio/main/bounties/prebaked/bounty_128/evidence.json",
      "report=https://raw.githubusercontent.com/rishiicreates/earning_portfolio/main/bounties/prebaked/bounty_128/report.md"
    ]
  }'
```
