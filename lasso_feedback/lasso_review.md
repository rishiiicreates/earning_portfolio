# Lasso RPC Developer Review & Agent First Impressions

**Tested By**: Rishii / Autonomous Coding Agent  
**GitHub**: [rishiiicreates](https://github.com/rishiiicreates)  
**X / Twitter**: [@rishiicreates](https://twitter.com/rishiicreates)  
**Tested Endpoint**: `https://lasso.sh/rpc/k/lasso_15yGmAHqb23gSVGSz0PYelcAwxyc6geFJ/profile/premium/base?include_meta=body`  
**Repository Starred**: `jaxernst/lasso-rpc` (verified on GitHub)

---

## 1. What I Tested & First Impressions

We tested Lasso through its agent-native flow (`POST /api/v1/keys`), provisioned key `lasso_15yGmAHqb...` in a single unauthenticated HTTP call without manual captcha gates or credit cards, and immediately fired live EVM calls for our Base watchtower:

1. **`eth_blockNumber` via Premium Profile**:
   - Total latency: **30.18 ms** (upstream: 26.24 ms, Lasso routing overhead: **3.93 ms**)
   - Region: `sin` (routed to nearest Singapore edge)
   - Evaluated 10 candidate providers dynamically (`premium_base_2`, `premium_base_3`, `premium_base_5`, `alchemy`, etc.)
   - Dispatched to `premium_base_2:http` with zero retries.
2. **`eth_call` USDC Balance Query on Base (`balanceOf`)**:
   - Total roundtrip: **171.69 ms**
   - Lasso automatically switched transport to WebSocket (`protocol: ws`) via `premium_base_1`
   - Accurately decoded `5.00 USDC` on contract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
   - Cost: **1.5 CU = $0.0000075 USD**, with linear balance deduction tracked cleanly in `x-lasso-balance-usd` headers.

---

## 2. Would I Use It for What I'm Building?

**Yes, absolutely.**  
In autonomous agent architectures, public RPC nodes (e.g. `mainnet.base.org`) constantly rate-limit or throw transient HTTP 429/403 errors that stall long-running workflows. Having a geo-distributed proxy that:
- Evaluates provider health per method (HTTP vs WS)
- Adds < 4 ms overhead
- Automatically drops lagged providers based on block height
- Standardizes quirky provider error responses into uniform JSON-RPC codes

is a major upgrade over manual fallback arrays in Web3 libraries.

---

## 3. UI/UX Confusion & Bugs Found

1. **Persistent "Connection Interrupted" Banner on Web**:
   - On both the `/claim/{token}` and `/dashboard/public` pages, a floating bottom alert constantly flickers:
     > *"Connection interrupted. Checking your network and reconnecting automatically. Lasso is reconnecting..."*
   - Even when broadband connection is 100% active and the RPC is serving sub-50ms responses, the frontend SSE/WebSocket state machine triggers false-positive reconnect toasts.
2. **Public Dashboard Auth Barrier**:
   - Navigating to `/dashboard/public` renders the provider map, 14 chains, and the "RPC Request Tester", but clicking "Run" or scrolling down surfaces an abrupt `Error! You must log in to access this page.` banner. Either the route should be completely unauthenticated for read-only telemetry, or the Request Tester should use an ephemeral demo session automatically.
3. **Claim Flow Clarity**:
   - The `/claim/{token}` interface is sleek, showing the 1 key and $0.025 initial balance, but it only offers "Sign in to claim" without explaining whether OAuth login preserves the exact existing key ID or re-binds it.

---

## 4. Summary & Verdict

Lasso RPC delivers genuine sub-4ms routing overhead on the BEAM and an agent-first onboarding experience that works on the first try. Fixing the reconnect toast and streamlining public dashboard telemetry will make this a premier infrastructure stack for crypto agents and autonomous dApps.
