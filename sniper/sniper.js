/**
 * Autonomous High-Frequency Bounty Sniper Daemon for GoFrantic
 * 
 * Agent KID: agent-13c459
 * Wallet: 0x3028C30B8c8985Bd54669BC313Fe7950fCeB1142
 * Target Priorities:
 *   1. Bounty #33 ($20 USD) - "Publish Sourcey docs for a maintained OSS library"
 *   2. Bounty #128 ($8 USD) - "Earn a citation for an open data registry on a real external site"
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  AGENT_KID: "agent-13c459",
  AGENT_TOKEN: "fr_agent_c571068fd4f348ef296e13e02b3c7f74f71a728b5f58682b",
  BASE_URL: "https://gofrantic.com",
  POLL_INTERVAL_MS: 10000, // 10 seconds
  MAX_PENDING_REVIEW_LIMIT: 2,
  BOUNTY_33_PACKET: "/Users/rishii/Projects/earning_portfolio/bounties/prebaked/bounty_33/delivery_packet.json",
  BOUNTY_128_PACKET: "/Users/rishii/Projects/earning_portfolio/bounties/prebaked/bounty_128/delivery_packet.json",
  LOG_FILE: "/Users/rishii/Projects/earning_portfolio/sniper/sniper.log",
  STATE_FILE: "/Users/rishii/Projects/earning_portfolio/sniper/sniper_state.json",
};

// Logger utility
function log(level, message, data) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level}] ${message}${data !== undefined ? " " + JSON.stringify(data) : ""}`;
  console.log(formatted);
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, formatted + "\n");
  } catch (err) {
    console.error("Failed writing to log file:", err);
  }
}

// Headers builder
function getHeaders() {
  return {
    "Authorization": `Bearer ${CONFIG.AGENT_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "Antigravity-Sniper/1.0.0 (agent-13c459)",
  };
}

// Fetch current agent status
async function checkStatus() {
  const url = `${CONFIG.BASE_URL}/v1/agents/${CONFIG.AGENT_KID}/status`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) {
      log("WARN", `Status API returned HTTP ${res.status}: ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    log("ERROR", `Status fetch error: ${err.message}`);
    return null;
  }
}

// Attempt to claim a bounty
async function claimBounty(bountyIdentifier) {
  const url = `${CONFIG.BASE_URL}/v1/claims`;
  const body = {
    bounty: bountyIdentifier,
    agent_kid: CONFIG.AGENT_KID,
  };

  log("SNIPE", `Executing claim for bounty ${bountyIdentifier}...`, body);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    log("INFO", `Claim response status HTTP ${res.status}:`, data);

    if (res.ok && data.ok) {
      const claimId = data.claim_id || data.claimId || data.claim?.id || data.claim?.claim_id || data.claim?.claimId || data.id;
      return { success: true, claimId, raw: data };
    } else {
      return {
        success: false,
        error: data.error || `HTTP_${res.status}`,
        raw: data,
      };
    }
  } catch (err) {
    log("ERROR", `Claim request exception: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Deliver pre-baked artifacts for a claim
async function deliverBounty(claimId, packet) {
  const url = `${CONFIG.BASE_URL}/v1/deliveries`;
  const body = {
    claim_id: claimId,
    claimId: claimId,
    agent_kid: CONFIG.AGENT_KID,
    artifact_refs: packet.artifact_refs,
  };

  log("SNIPE", `Submitting delivery for claim ${claimId} (Bounty #${packet.bounty_number} - "${packet.title}")...`, {
    artifact_count: packet.artifact_refs.length,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    log("INFO", `Delivery response status HTTP ${res.status}:`, data);

    if (res.ok && data.ok) {
      const receipt = data.delivery_receipt_ref || data.receipt_ref || data.receiptCode || data.delivery?.receipt_ref;
      return { success: true, deliveryReceipt: receipt, raw: data };
    } else {
      return { success: false, raw: data };
    }
  } catch (err) {
    log("ERROR", `Delivery request exception: ${err.message}`);
    return { success: false, raw: { error: err.message } };
  }
}

// Strike sequence: Attempts Bounty #33 first, falls back to Bounty #128
async function executeSnipeSequence() {
  log("SNIPE", "Review slot freed up! Commencing strike sequence...");

  // Load pre-baked packets
  let packet33 = null;
  let packet128 = null;

  try {
    packet33 = JSON.parse(fs.readFileSync(CONFIG.BOUNTY_33_PACKET, "utf-8"));
  } catch (e) {
    log("ERROR", `Failed reading Bounty #33 packet: ${e.message}`);
  }

  try {
    packet128 = JSON.parse(fs.readFileSync(CONFIG.BOUNTY_128_PACKET, "utf-8"));
  } catch (e) {
    log("ERROR", `Failed reading Bounty #128 packet: ${e.message}`);
  }

  // 1. Primary Strike: Bounty #33 ($20 USD)
  log("INFO", "Attempting primary target: Bounty #33 ($20 USD, posting: p-8b91e1ac8c)...");
  let claimResult = await claimBounty("p-8b91e1ac8c");

  if (!claimResult.success && claimResult.error !== "pending_review_limit") {
    // Retry with bounty number 33 in case API preferred integer
    log("INFO", "Retrying Bounty #33 with integer identifier 33...");
    claimResult = await claimBounty(33);
  }

  if (claimResult.success && claimResult.claimId && packet33) {
    log("SUCCESS", `Successfully claimed Bounty #33! Claim ID: ${claimResult.claimId}`);
    const deliveryResult = await deliverBounty(claimResult.claimId, packet33);
    if (deliveryResult.success) {
      log("SUCCESS", `Bounty #33 delivered successfully! Receipt: ${deliveryResult.deliveryReceipt}`);
      saveState({
        completedAt: new Date().toISOString(),
        bounty: 33,
        claimId: claimResult.claimId,
        deliveryReceipt: deliveryResult.deliveryReceipt,
      });
      return;
    } else {
      log("ERROR", "Delivery for Bounty #33 encountered issues", deliveryResult.raw);
      return;
    }
  }

  // 2. Fallback Strike: Bounty #128 ($8 USD)
  log("WARN", `Primary Bounty #33 unavailable or failed (${claimResult.error}). Triggering immediate fallback to Bounty #128 ($8 USD)...`);

  let fallbackClaim = await claimBounty("vendor-d33814cb-e0c7-4a59-813c-40677bd66321");
  if (!fallbackClaim.success && fallbackClaim.error !== "pending_review_limit") {
    log("INFO", "Retrying Bounty #128 with integer identifier 128...");
    fallbackClaim = await claimBounty(128);
  }

  if (fallbackClaim.success && fallbackClaim.claimId && packet128) {
    log("SUCCESS", `Successfully claimed fallback Bounty #128! Claim ID: ${fallbackClaim.claimId}`);
    const deliveryResult = await deliverBounty(fallbackClaim.claimId, packet128);
    if (deliveryResult.success) {
      log("SUCCESS", `Bounty #128 delivered successfully! Receipt: ${deliveryResult.deliveryReceipt}`);
      saveState({
        completedAt: new Date().toISOString(),
        bounty: 128,
        claimId: fallbackClaim.claimId,
        deliveryReceipt: deliveryResult.deliveryReceipt,
      });
      return;
    } else {
      log("ERROR", "Delivery for Bounty #128 encountered issues", deliveryResult.raw);
      return;
    }
  }

  log("WARN", "Snipe sequence finished round. Neither bounty claimed or slots remained blocked.", {
    bounty33Error: claimResult.error,
    bounty128Error: fallbackClaim.error,
  });
}

function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Failed writing state file:", err);
  }
}

// Main polling loop
async function runLoop() {
  log("INFO", "Autonomous Bounty Sniper Daemon initialized.");
  log("INFO", `Monitoring Agent: ${CONFIG.AGENT_KID} | Target Bounties: #33 ($20) -> #128 ($8)`);
  log("INFO", `Poll interval: ${CONFIG.POLL_INTERVAL_MS / 1000}s`);

  let pollCount = 0;

  while (true) {
    pollCount++;
    try {
      const status = await checkStatus();

      if (status && status.ok) {
        const summary = status.work?.summary;
        const openClaims = status.work?.open || [];
        const deliveredPendingReview = summary?.deliveredPendingReview ?? openClaims.length;
        const humanReviewPending = summary?.humanReviewPending ?? 0;
        const loadCashClaims = status.load?.cash_funded_claims;

        const openBounties = openClaims.map((c) => `#${c.bounty?.number || c.claimId.slice(0, 8)} (${c.stage})`).join(", ");

        const slotFreed =
          (deliveredPendingReview < CONFIG.MAX_PENDING_REVIEW_LIMIT) ||
          (humanReviewPending < CONFIG.MAX_PENDING_REVIEW_LIMIT) ||
          (loadCashClaims !== undefined && loadCashClaims < CONFIG.MAX_PENDING_REVIEW_LIMIT) ||
          (openClaims.length < CONFIG.MAX_PENDING_REVIEW_LIMIT);

        if (slotFreed) {
          log("SNIPE", `Slot capacity condition triggered! pendingReview=${deliveredPendingReview}, humanReviewPending=${humanReviewPending}, openClaims=${openClaims.length}`);
          await executeSnipeSequence();
        } else {
          // Heartbeat log
          if (pollCount % 3 === 1 || pollCount <= 3) {
            log(
              "INFO",
              `Poll #${pollCount}: Review slots full (${deliveredPendingReview}/${CONFIG.MAX_PENDING_REVIEW_LIMIT} pending review). Open: [${openBounties}]. Standby.`
            );
          }
        }
      } else {
        log("WARN", `Poll #${pollCount}: Could not retrieve agent status.`);
      }
    } catch (loopErr) {
      log("ERROR", `Loop error: ${loopErr.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
  }
}

// Graceful termination handling
process.on("SIGINT", () => {
  log("INFO", "Received SIGINT. Shutting down sniper daemon gracefully.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("INFO", "Received SIGTERM. Shutting down sniper daemon gracefully.");
  process.exit(0);
});

// Run
runLoop();
