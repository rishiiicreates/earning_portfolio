// 1-Click Submission Script for Superteam Earn
// Challenge: Create Content About KriptoK · 200 USDC Creator Challenge
// Listing URL: https://superteam.fun/earn/listing/kriptok-creator-challenge-01
// Run this directly in the Developer Tools Console on the listing page.

(async (tweetUrl = "", kriptokId = "") => {
  const finalTweetUrl = tweetUrl || window.TWEET_URL || window.SUBMISSION_LINK || "";
  const finalKriptokId = kriptokId || window.KRIPTOK_ID || "rishiicreates";
  const primaryLink = finalTweetUrl || "https://github.com/rishiiicreates/earning_portfolio/tree/main/kriptok_thread";

  const payload = {
    listingId: "11de63d7-6dfb-444c-8587-3d73037a4ede",
    link: primaryLink,
    tweet: finalTweetUrl,
    telegram: "https://t.me/KriptoKOfficial",
    ask: null,
    eligibilityAnswers: [
      {
        question: "What is your X profile URL?",
        answer: "https://x.com/rishiicreates"
      },
      {
        question: "Share the link to your post, thread or video about KriptoK. If you created more than one piece, feel free to include all the links.",
        answer: primaryLink
      },
      {
        question: "Which country are you based in, and which country or countries is your content intended for?",
        answer: "India / Global Web3 developers and Solana DeFi traders"
      },
      {
        question: "What is your KriptoK ID?",
        answer: finalKriptokId
      }
    ],
    otherInfo: `comprehensive 7-tweet educational research thread breaking down kriptok pre-ipo perpetuals and private ai synthetic exposure (specifically anthropic).

key topics analyzed:
why retail is locked out of private ai equity (tender offers, $250k minimum checks, accredited investor rules under sec rule 501, 20% spv carry fees, and board rofr blocks).
how kriptok delivers 24/7 on-chain synthetic perpetual exposure settled in usdc with non-custodial self-custody.
price discovery mechanics: oracle indices benchmarked against institutional secondary transactions (forge global, notice, caplight) combined with funding rate equilibrium to tether mark price to secondary fair value.
risk and delta management: basis trading, funding slippage protection, and automated settlement upon s-1 public ipo listing on nasdaq.
community and competitive trading: integration with kriptok league leaderboards and weekly prizes.

repository deliverable: https://github.com/rishiiicreates/earning_portfolio/tree/main/kriptok_thread

solana payout wallet: 6tNcRHtX6UH4H5t557xjA2cBe5tdQxh9sE5goiW8mgGh
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
