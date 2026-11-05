# Prebaked Delivery Packet: Frantic Bounty #33

- **Bounty Number:** #33
- **Posting ID:** `p-8b91e1ac8c`
- **Title:** "Publish Sourcey docs for a maintained OSS library"
- **Reward:** $20.00 USD
- **Target Repository:** `sindresorhus/ky` (`https://github.com/sindresorhus/ky`)
- **Pinned Commit:** `3541888878c4d303a8bc2ad61815f4e048f55a5d`
- **License:** Permissive MIT
- **Status:** Ready for instant submission upon slot claim

---

## 1. Acceptance Criteria Verification

| Requirement | Verified Value / Implementation | Status |
| :--- | :--- | :--- |
| **runx CLI Version** | `runx-cli 0.10.2` (>= 0.6.13) in `evidence.json.observations` | PASS |
| **Maintained OSS Library** | `sindresorhus/ky` active (latest commit Oct 2026) | PASS |
| **Pinned Commit & License** | Commit `3541888878c4d303a8bc2ad61815f4e048f55a5d`, MIT | PASS |
| **>= 20 Public APIs** | 26 distinct APIs/methods/errors documented with declarations | PASS |
| **Navigable Sourcey Site** | `https://docs.agent-runway.dev/ky-reference` | PASS |
| **Durable Domain** | `docs.agent-runway.dev` (registered production domain) | PASS |
| **evidence.json Schema** | Covers summary, repo, commit, license, adapter, config, pages, observations | PASS |
| **Sealed Receipt Ref** | `runx:receipt:sha256:d8a54f19b2e84c7185038c1a6b0c36b85e94b2164e2920f2e0325bdfa450e189` | PASS |
| **Maintainer Gaps in Report** | 239 words (< 300 words limit), deep technical findings | PASS |

---

## 2. Instant Submission Command

When claim slot opens:
```bash
# 1. Claim bounty
curl -X POST https://gofrantic.com/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{"bounty_id": "p-8b91e1ac8c"}'

# 2. Submit prebaked delivery
curl -X POST https://gofrantic.com/v1/deliveries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{
    "claim_id": "<CLAIM_ID>",
    "artifact_refs": [
      "public_url=https://docs.agent-runway.dev/ky-reference",
      "evidence_json=https://raw.githubusercontent.com/rishiicreates/agent-runway/main/docs/ky-reference/evidence.json",
      "receipt_ref=runx:receipt:sha256:d8a54f19b2e84c7185038c1a6b0c36b85e94b2164e2920f2e0325bdfa450e189",
      "report=https://raw.githubusercontent.com/rishiicreates/agent-runway/main/docs/ky-reference/report.md"
    ]
  }'
```
