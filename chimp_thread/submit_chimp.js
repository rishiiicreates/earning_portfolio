// 1-Click Submission Script for Superteam Earn: $CHIMP Fair Launch Thread (500 USDC)
// Run this in Developer Tools Console on:
// https://superteam.fun/earn/listing/chimp-on-metaplex

(async (tweetUrl = "") => {
  const payload = {
    listingId: "c7a39025-a619-405c-8f0f-ff5e1b34622e",
    link: tweetUrl || "https://github.com/rishiiicreates/chimp-thread",
    tweet: tweetUrl,
    telegram: "",
    ask: null,
    eligibilityAnswers: [],
    otherInfo: `detailed 9-tweet educational breakdown of the $chimp fair launch on raydium covering mojo ai by chimpx.

highlights covered:
- live traction: 56,000+ active wallets, 1m+ requests, $3.9m+ total volume routed on solana
- fair launch guarantees: soft cap rate certainty, pro-rata excess refund, zero bot-sniping edge, 100% launch unlock
- tokenomics breakdown: 1b total supply, 7.5% public fair launch, 50% community and rewards, team locked
- utility: fee reductions, institutional routing strategies, and hoots activity points
- security checklist: official domain verification and mint confirmation

payout solana wallet: 6tNcRHtX6UH4H5t557xjA2cBe5tdQxh9sE5goiW8mgGh
base usdc payout: 0x3028C30B8c8985Bd54669BC313Fe7950fCeB1142`
  };

  try {
    console.log("Submitting to Superteam Earn API...");
    const res = await fetch("/api/submission/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Submission response:", data);
    if (res.ok) {
      alert("Submission successful! Submission ID: " + (data.id || data.submissionId || "OK"));
    } else {
      alert("Submission error: " + JSON.stringify(data));
    }
  } catch (err) {
    console.error("Submission failed:", err);
    alert("Network/JS error: " + err.message);
  }
})();
