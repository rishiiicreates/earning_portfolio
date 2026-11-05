// 1-Click Submission Script for Superteam Earn: Premier League Predictions with worm (500 USDC)
// Run this directly in the Developer Tools Console on:
// https://superteam.fun/earn/listing/create-content-on-premier-league-predictions-with-worm

(async (tweetUrl = "") => {
  const finalTweetUrl = tweetUrl || window.TWEET_URL || window.SUBMISSION_LINK || "";
  const primaryLink = finalTweetUrl || "https://github.com/rishiiicreates/worm-thread";

  const payload = {
    listingId: "b2931cef-eea4-42cf-8911-3046653d6da8",
    link: primaryLink,
    tweet: finalTweetUrl,
    telegram: "",
    ask: null,
    eligibilityAnswers: [],
    otherInfo: `comprehensive 8-tweet educational thread analyzing premier league leveraged prediction markets on worm.wtf and solana.

key points covered:
- live match breakdowns with real volume: leeds vs tottenham (38% vs 35%, $255k vol), fulham vs newcastle (44% vs 27%, $320k vol), and nottingham forest vs manchester city (20% vs 57%, $279k vol)
- dynamic probability percentage discovery vs rigid traditional house spreads
- 3x leverage mechanics for tactical conviction
- instant solana settlement, low gas, and non-custodial execution
- season-long markets and weekly usdc leaderboard prizes
- strict compliance: zero gambling/betting terminology, focused entirely on peer-to-peer prediction markets
- includes verified referral link call to action and platform screenshots

solana wallet: 6tNcRHtX6UH4H5t557xjA2cBe5tdQxh9sE5goiW8mgGh
base usdc payout: 0x3028C30B8c8985Bd54669BC313Fe7950fCeB1142`
  };

  try {
    console.log("Submitting to Superteam Earn API with payload:", payload);
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
      alert("Submission error: " + (data.message || JSON.stringify(data)));
    }
  } catch (err) {
    console.error("Submission failed:", err);
    alert("Network/JS error: " + err.message);
  }
})();
