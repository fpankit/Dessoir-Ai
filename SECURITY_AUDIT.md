# Security Audit — Dessoir AI

**Audit date:** 2026-10-23  
**Scope:** Vite/React frontend, Clerk authentication, Vercel deployment config, n8n workflow, Firestore rules, browser-to-backend data flows, and AI/Retell prompt handling.  
**Method:** Static review, local unit/VM tests, dependency audit, local build inspection, and read-only public checks against the deployed site. No production data was read, no writes were made to Firestore or n8n, and no destructive actions were taken.  
**Secret handling:** No secret values are included in this report.

## Executive Summary

The most serious issue was architectural: the n8n shared secret was intended to be bundled into browser JavaScript via `VITE_N8N_SHARED_SECRET`. A local production build contained the literal secret, although the live Vercel bundle did not because the variable was absent there. This has been replaced with a server-side proxy that verifies Clerk session tokens and injects the shared secret server-side.

The scraper console was also reachable without authentication and auto-ran a scrape from a URL parameter. It is now gated behind Clerk and redirects unauthenticated visitors to sign-in.

Several backend controls were ineffective or fail-open: the n8n chat auth block called undefined functions, authentication exceptions were swallowed, the shared-secret comparison was not constant-time, and rate limiting ran before authentication using a spoofable IP header. Those paths were corrected and covered by local tests. SSRF validation was expanded, the undefined `hostname` reference was fixed, and the chat responder no longer falls back to a global `latestBrief`.

Local verification passed:

- `npm run test:security`: **17/17 tests passed**
- `npm run build`: **passed**
- `npm run check:secrets`: **43 build files scanned, no client secret patterns found**
- `npm audit --json`: **0 vulnerabilities** (info/low/moderate/high/critical all zero)
- All five Vercel API route modules import successfully.

Not verified in this audit:

- Live n8n workflow execution (`localhost:5678` was not listening)
- Deployed Firestore rules (no Firebase CLI/auth; rules are only present in the repo)
- Post-deployment Vercel headers (the live site still serves the old configuration)
- Browser E2E/TestSprite execution (no TestSprite API key or credentials)
- Live payment behavior (there is no payment backend to test)

## Attack Surface

| Component | Notes |
|---|---|
| `index.html`, `auth.html`, `onboarding.html`, `pricing.html`, `scraper.html` | Five Vite entry points with meta CSP. |
| Clerk | Browser auth; session tokens now forwarded to the server proxy. |
| Vercel Functions (`api/n8n/`) | Clerk-verified, allowlisted proxy to n8n. |
| n8n workflow | 29 nodes; public webhook and public chat trigger; uses Retell AI, Firecrawl, Ollama/LLM. |
| Firestore | Repo rules are deny-by-default/owner-only; browser sync is disabled; deployment unverified. |
| Payments | Pricing UI and client-side credits only; no Stripe or payment webhook exists. |
| Admin | No admin routes, roles, or endpoints found. |

## Findings

### C-01 — Shared secret was designed into the browser bundle

**Severity:** Critical  
**Status:** Fixed in repository; production deployment and secret rotation pending  
**Affected files:** `src/services/scraperApi.js`, `src/services/chatApi.js`, `vite.config.js`, `api/n8n/*`, `src/server/n8nProxy.js`, `.env.example`

**Evidence:** `scraperApi.js` exported `N8N_SHARED_SECRET` from `import.meta.env.VITE_N8N_SHARED_SECRET`, and both scrape and chat requests sent it in the body. Local build artifacts (`dist/assets/chatApi-DbONomu-.js` and `dist/assets/styles-DgbXejbV.js`) contained the literal 48-character secret. The live Vercel bundle did not contain it because `VITE_N8N_SHARED_SECRET` was absent there, so production was failing closed rather than authenticating.

**Fix:** Removed the secret from all client code. The browser now calls relative `/api/n8n/*` routes. Vite proxies those routes in development; Vercel Functions verify a Clerk bearer token, enforce a route allowlist, strip client-supplied secret fields, inject `x-shared-secret` server-side, and pass the verified Clerk `sub` as `x-client-id`. The proxy also redacts API-key fields from upstream JSON responses.

**Retest:** `npm run check:secrets` passed with no secret value or `VITE_N8N_SHARED_SECRET` in `dist`. Proxy unit tests cover missing/invalid tokens, secret injection, body stripping, and response redaction.

**Residual:** The old secret existed in local build artifacts. Rotate `N8N_SHARED_SECRET` and remove any old `VITE_N8N_SHARED_SECRET` from Vercel/env stores. Production requires `CLERK_SECRET_KEY`, `N8N_BASE_URL`, `N8N_SHARED_SECRET`, and `APP_ORIGIN`.

### C-02 — Scraper console was unauthenticated and auto-ran from URL parameters

**Severity:** Critical  
**Status:** Fixed in repository; browser E2E not run  
**Affected files:** `src/scraper/ScraperApp.jsx`

**Evidence:** The console called `executeScrapeRequest` directly and `runResearch` auto-ran for `?url=`/`?demo=1`. `useAuth` was only used in the header; no route gate existed.

**Fix:** Added a Clerk gate. Unauthenticated loading shows a session check and redirects to `/auth.html?mode=signin`. The console component only mounts after Clerk reports a signed-in session, so URL-triggered scrapes cannot run before authentication.

**Retest:** Static security tests assert the gate, redirect, and `ScraperConsole` split. `npm run build` passed. A full browser sign-in/sign-out E2E test was not run.

### H-01 — n8n chat authentication failed open

**Severity:** High  
**Status:** Fixed in repository  
**Affected files:** `workflow.json` (`Agent Chat Responder`, `Process Agent Chat Message`)

**Evidence:** `Agent Chat Responder` called `readEnvSharedSecret()` and `extractProvidedSecret()` without defining them. The `ReferenceError` was swallowed by `try/catch`, so the auth check never ran. Both chat nodes also treated an empty configured secret as a successful comparison, and `Process Agent Chat Message` used a non-constant-time `!==` comparison.

**Fix:** Defined both helpers in the responder, added `safeEqual` constant-time comparison, and made the checks fail closed when the secret is missing or the provided value is empty. The responder now also has its own per-minute chat rate limit.

**Retest:** VM tests cover wrong secret, missing env secret, and valid secret for `Agent Chat Responder`; all pass. The test also asserts the old `providedSecret !== envSharedSecret` comparison is gone.

### H-02 — Rate limiting ran before authentication and used a spoofable key

**Severity:** High  
**Status:** Fixed in repository  
**Affected files:** `workflow.json` (`Extract & Validate URL`, `Process Agent Chat Message`)

**Evidence:** The first code node incremented its global/per-client counters before checking the shared secret. A caller could exhaust the global bucket without authenticating. The key came from `x-forwarded-for`, which the caller controls. Limits were 30/minute per client and 120/minute globally.

**Fix:** Authentication now runs before rate limiting. Keys prefer the proxy-supplied `x-client-id` (verified Clerk user id), then chat session id, then remote-address fallbacks. Client keys are prefixed to avoid prototype-key collisions. Scrape limits are 10/minute per authenticated user and 60/minute globally; chat is 30/120.

**Retest:** Tests assert an unauthenticated request receives 401 without touching workflow static data, and the 11th authenticated scrape receives 429.

**Residual:** Vercel proxy rate limiting is in-memory per serverless instance and is best-effort; n8n rate limiting is the authoritative bucket but is also per n8n instance. Distributed deployments need Redis or an API gateway for strict global limits.

### H-03 — SSRF validation bypasses and undefined `hostname` bug

**Severity:** High  
**Status:** Fixed in repository; DNS rebinding residual  
**Affected files:** `workflow.json` (`Extract & Validate URL`, `Fetch Website HTML`)

**Evidence:** The host blocklist missed `metadata.google.internal`, `127.0.0.1.nip.io`, `localtest.me`, and IPv6-mapped private addresses. It did not enforce an HTTP(S) protocol allowlist. `Extract & Validate URL` also referenced an undefined `hostname` variable, which would throw for valid URLs.

**Fix:** Added protocol allowlisting, IPv4/IPv6 literal handling, private/loopback/link-local/CGNAT/multicast ranges, `.local`/`.internal`/metadata hostnames, common wildcard-DNS services, and embedded-userinfo rejection. Firecrawl targets are revalidated. Redirects remain hop-by-hop validated and cannot downgrade from HTTPS to HTTP. Fixed the `hostname` reference.

**Retest:** VM tests cover `169.254.169.254`, `metadata.google.internal`, `127.0.0.1.nip.io`, `localtest.me`, IPv6-mapped private addresses, `ftp://`, and a redirect to `127.0.0.1`. All are blocked; a normal `https://example.com` request is allowed.

**Residual:** The workflow validates hostnames, not resolved IP addresses. DNS rebinding can still point an allowed hostname at a private address. Run n8n with an egress firewall/proxy that denies private ranges. This is documented in the README.

### H-04 — Cross-tenant chat context fallback

**Severity:** High  
**Status:** Fixed for the global fallback; global brief cache remains a low-risk residual  
**Affected files:** `workflow.json` (`Agent Chat Responder`, `Assemble Final Response`)

**Evidence:** `Agent Chat Responder` fell back to `$getWorkflowStaticData("global").latestBrief`, which is overwritten by every scrape. Any caller of the public chat trigger could receive a reply grounded in another customer's most recent brief.

**Fix:** Removed the `latestBrief` read and the `latestBrief` write. The responder now looks up only the brief matching the requested normalized `website_url` and uses the request's own brief fields.

**Retest:** Test seeds a `latestBrief` and a `briefs` entry for tenant A, sends a tenant B request, and asserts tenant A data never appears.

**Residual:** `store.briefs` is a workflow-global cache keyed by website URL, not by user. An authenticated user who knows another scraped URL could ask the chat workflow for that public website summary. The cached content is public website-derived data, so confidentiality impact is low; do not place private data in this cache. A user-scoped cache key would require carrying the Clerk `sub` through the scrape workflow.

### H-05 — Missing HTTP security headers and incomplete CSP

**Severity:** High  
**Status:** Fixed in repository; not deployed  
**Affected files:** `vercel.json`, `index.html`, `auth.html`, `onboarding.html`, `pricing.html`, `scraper.html`

**Evidence (live check on 2026-10-23):** `https://dessoir-ai.vercel.app/` returned HSTS and `Access-Control-Allow-Origin: *`, but no `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy` headers. Meta CSP existed but cannot express `frame-ancestors`.

**Fix:** Added `vercel.json` headers for CSP (including `frame-ancestors 'none'` and `object-src 'none'`), HSTS, nosniff, DENY framing, referrer policy, permissions policy, and COOP. Tightened the meta CSP: Clerk/Cloudflare/GA/Firebase origins are explicit, direct `localhost:5678` access is removed, and `frame-src` is restricted to Clerk/Cloudflare.

**Retest:** Static tests assert the header values and meta CSP. The live site still serves the pre-deploy headers, so post-deploy header verification is required.

**Residual:** CSP still needs `'unsafe-inline'` for current inline styles/scripts. A nonce/hash migration would allow removing it. `Access-Control-Allow-Origin: *` on static assets is low risk because they are public, but can be narrowed to the production origin later.

### M-01 — Firestore rules deployment is unverified

**Severity:** Medium  
**Status:** Unresolved verification  
**Affected files:** `firestore.rules`, `firebase.json`

**Evidence:** The repo rules are deny-by-default and owner-only for `users/{userId}` and `auth_history`, but no `firebase.json` existed and Firebase CLI was not installed. An unauthenticated probe returned 404 for a nonexistent document and 200 `{}` for an empty nonexistent collection; that is ambiguous and not proof of rules deployment. Real user data was not read.

**Fix:** Added `firebase.json` pointing at `firestore.rules` and documented deployment. Client sync remains disabled because the browser has no Firebase Auth token.

**Retest:** Not executed. Deploy rules and verify in the Firebase console or emulator. Repository rules are not proof of deployed rules.

**Residual:** If the deployed database is still in test mode, it may be permissive. This must be verified in the Firebase project.

### M-02 — Paywall and credits are client-side only

**Severity:** Medium  
**Status:** Unresolved business risk  
**Affected files:** `pricing.html`, onboarding/pricing UI

**Evidence:** Plans and credit limits are presentation/local state. There is no payment provider integration, no server-side entitlement check, and no webhook to validate purchases.

**Fix:** Not changed; implementing enforcement requires a payment backend and server-side entitlement model, which is outside a minimal security patch.

**Retest:** Not applicable until a backend exists. Treat all client-side credit/plan state as cosmetic.

### M-03 — Prompt injection through scraped website content

**Severity:** Medium  
**Status:** Mitigated; not fully solvable  
**Affected files:** `workflow.json` (`Basic LLM Chain`, `Prepare Retell AI Payload`)

**Evidence:** Scraped content is inserted into LLM and Retell prompts. A malicious website could embed instructions intended to alter summaries or the customer agent's behavior. No tools are available to the LLM, and the scrape path does not include other tenants' context.

**Fix:** Added explicit untrusted-data instructions to the LLM and Retell prompts: ignore embedded instructions and extract only company facts. Output is still validated against context words.

**Retest:** Static tests assert the guard text is present. Live adversarial prompt testing requires a running n8n/LLM stack and was not executed.

**Residual:** Prompt injection cannot be eliminated by prompt wording alone. Keep tool access disabled, validate outputs, and monitor agent behavior.

### M-04 — Unsanitized Retell URLs

**Severity:** Medium  
**Status:** Fixed in repository  
**Affected files:** `src/data/sampleBriefs.js`

**Evidence:** `normalizeBrief` passed `retell_ai.chat_interface_url`, `chat_webhook_url`, and `web_call_url` through unchanged. A compromised backend response could supply a `javascript:` or `data:` URL used in `href`.

**Fix:** Added `safeExternalUrl`, which allows only HTTP(S) URLs without embedded credentials; invalid values become `null`.

**Retest:** Test supplies `javascript:` and `data:` URLs and asserts both are null while an HTTPS URL is preserved.

### M-05 — Local test client did not send the shared secret

**Severity:** Medium  
**Status:** Fixed in repository  
**Affected files:** `test_scraper.py`

**Evidence:** The script posted only `{"url": ...}` and would receive 401 after fail-closed authentication was enforced.

**Fix:** It now reads `N8N_SHARED_SECRET` and `N8N_BASE_URL` from the environment and sends `x-shared-secret`.

**Retest:** Not executed against n8n because n8n was not running; behavior is covered by the workflow tests.

### L-01 — Auto-push scripts could commit environment files

**Severity:** Low  
**Status:** Fixed  
**Affected files:** `scripts/auto-push.ps1`, `scripts/auto-push-watch.ps1`

**Evidence:** Both scripts used `git add .` without checking the staged file list. `.gitignore` currently excludes env files, but a future ignore change could stage one.

**Fix:** Both scripts now inspect staged files and abort/reset if a `.env` variant other than `.env.example` is staged.

**Retest:** Static review; scripts were not executed against GitHub.

### L-02 — Clerk test key in production

**Severity:** Low  
**Status:** Unresolved user action  
**Affected files:** Vercel environment, `src/ClerkRoot.jsx`

**Evidence:** Production uses a `pk_test_...` publishable key; Clerk shows a development-key warning. Publishable keys are public by design.

**Fix:** No code change. Set `VITE_CLERK_PUBLISHABLE_KEY` to a `pk_live_...` key in Vercel and redeploy. Keep `CLERK_SECRET_KEY` server-only. If the live Clerk Frontend API uses a custom domain outside `*.clerk.accounts.dev`/`*.clerk.com`, add that origin to the CSP `script-src`, `connect-src`, and `frame-src` allowlists and set `APP_ORIGIN` to the exact deployed origin.

### L-03 — Permissive CORS on the deployed static site

**Severity:** Low  
**Status:** Accepted  
**Affected files:** Vercel platform response headers

**Evidence:** Live response includes `Access-Control-Allow-Origin: *`. Marketing assets are public, and authenticated API routes are same-origin through the proxy.

**Fix:** Not changed; narrow to the production origin at the CDN if cross-origin asset use is not required.

### L-04 — Client-side session/onboarding data in localStorage

**Severity:** Low  
**Status:** Mitigated by XSS controls; residual  
**Affected files:** `src/App.jsx`, onboarding/scraper code

**Evidence:** Uses `dessoir.session` (legacy name/email), `dessoir.website`, and onboarding state. No XSS sink (`dangerouslySetInnerHTML`, `innerHTML`, `eval`) was found; React escapes rendered text and the CSP is being hardened.

**Fix:** No storage redesign. Do not store tokens or sensitive PII there. Formal browser E2E/XSS testing remains pending.

### L-05 — Dependency vulnerabilities

**Severity:** Low  
**Status:** Verified clean at audit time  
**Affected files:** `package.json`, `package-lock.json`

**Evidence:** `npm audit --json` reported 0 vulnerabilities across all severities. `@clerk/backend` was added for server-side token verification.

**Residual:** No CI dependency scanning, SBOM, or scheduled audit is configured. Add `npm audit`/Dependabot/SCA to CI.

## OWASP Top 10:2025 Mapping

| Category | Audit result |
|---|---|
| A01 Broken Access Control | Scraper now Clerk-gated; proxy verifies Clerk tokens; chat global fallback removed. Firestore rules owner-only but deployment unverified. Global public-brief cache residual. |
| A02 Security Misconfiguration | Security headers/CSP added in `vercel.json`; live deployment still old. Clerk test key remains. Static CORS is permissive. |
| A03 Software Supply Chain Failures | `npm audit` 0; no CI SCA/SBOM yet. Lockfile present. |
| A04 Cryptographic Failures | Removed client-bundled shared secret; constant-time comparisons; HSTS; server-only Clerk secret. No custom cryptography. Rotate exposed historical secret. |
| A05 Injection | No SQL/innerHTML/eval sinks found; React escaping; URL/redirect sanitization; SSRF hardened; prompt-injection guard added. |
| A06 Insecure Design | Client-side paywall remains cosmetic; public chat trigger is intentionally public; rate limiting is best-effort. |
| A07 Authentication Failures | Clerk proxy auth, scraper gate, fail-closed backend secret checks. Clerk `pk_test` production warning remains. |
| A08 Integrity Failures | Webhook authentication, CSP, dependency lockfile. Third-party Clerk/GA scripts are CDN-delivered without SRI; CSP restricts origins. |
| A09 Logging & Alerting Failures | No centralized security logging/alerting was found. n8n execution logs exist but no alerting. Add auth-failure/rate-limit alerts. |
| A10 Mishandling of Exceptional Conditions | Fail-open auth catches fixed; missing config fails closed; n8n fetch errors are contained. Rate limiting is skipped if n8n static data is unavailable. |

## Access Control and Tenant Isolation Review

- The proxy allowlists exactly five routes and rejects traversal, unknown paths, wrong methods, oversized bodies, and missing/invalid Clerk tokens.
- The browser never receives `N8N_SHARED_SECRET`; the proxy strips `shared_secret` and `x-shared-secret` from client bodies and redacts backend API-key fields from responses.
- `x-client-id` is set from the verified Clerk `sub` by the proxy. Direct n8n callers who possess the shared secret can spoof it; rotate the secret and keep n8n off the public internet where possible.
- The scraper console redirects unauthenticated visitors to Clerk sign-in before mounting.
- Firestore rules restrict `users/{userId}` to the matching Firebase Auth uid and make `auth_history` append-only. The browser does not currently hold a Firebase Auth token, so sync is disabled; deployment of these rules is unverified.
- The chat responder no longer uses a global `latestBrief`. The remaining `briefs` cache is keyed by public website URL and is not user-scoped; treat its contents as public.
- No IDOR was found in admin/payment functionality because no admin/payment backend exists.

## Secrets Review

- No secret values are committed in the repository. Only `.env.example` is tracked; `.env.local` is ignored.
- `N8N_SHARED_SECRET` is now server-only (n8n + Vercel + local `.env.local`), never `VITE_`-prefixed.
- `CLERK_SECRET_KEY` is documented as server-only.
- The Firebase web API key and Clerk publishable key are public identifiers, not secrets. Firebase API-key restrictions could not be verified without cloud-console access.
- The historical N8N secret was present in local build artifacts and should be rotated regardless of whether those artifacts were shared.

## Verification Performed

| Check | Result |
|---|---|
| `npm run test:security` | Passed: 17/17 |
| `npm run build` | Passed (Vite 6.4.4; chunk-size warning only) |
| `npm run check:secrets` | Passed: 43 build files, no secret patterns |
| `npm audit --json` | 0 vulnerabilities |
| API route imports | 5/5 modules exported functions |
| Vite dev smoke | `/` returned 200; `/api/n8n/health` returned 500 because n8n was not running |
| n8n TCP check | `localhost:5678` not reachable |
| Live Vercel headers | Missing CSP/XCTO/XFO/Referrer/Permissions; HSTS present; ACAO `*` (pre-deploy state) |
| live meta CSP | `worker-src` and `googletagmanager` present (prior fix deployed) |
| TestSprite | Not run: no `TESTSPRITE_API_KEY` and no `~/.testsprite/credentials` |

## Unresolved Risks and Required Actions

1. **Deploy the security changes.** The live site still serves the old headers and client bundle. Set Vercel server env: `CLERK_SECRET_KEY`, `N8N_BASE_URL`, `N8N_SHARED_SECRET`, `APP_ORIGIN`. Redeploy, then re-scan headers.
2. **Make n8n reachable from Vercel.** The proxy cannot reach `localhost:5678` in production. Host n8n behind HTTPS or a private tunnel accessible to the Vercel functions.
3. **Rotate `N8N_SHARED_SECRET`.** Remove any old `VITE_N8N_SHARED_SECRET` from environment stores.
4. **Upgrade Clerk to a `pk_live_` key** in Vercel.
5. **Deploy and verify Firestore rules** (`firebase deploy --only firestore:rules`) and confirm test-mode is off.
6. **Add an egress firewall** around n8n to mitigate DNS rebinding and SSRF against private networks.
7. **Decide on the public n8n chat trigger.** It remains unauthenticated by design; rate limiting and scoped briefs reduce abuse but do not authenticate users. Disable it or put n8n Basic Auth in front if not needed.
8. **Replace the client-side paywall** with server-side entitlements before charging customers.
9. **Add security monitoring/alerting** for 401/429 spikes and n8n failures.
10. **Run browser E2E/TestSprite** with a real Clerk session and a running n8n instance.
11. **Consider CSP nonces/hashes** to remove `'unsafe-inline'`.
12. **Do not store private data in `store.briefs`** while it remains URL-keyed and global.
13. **Align timeouts with Vercel limits.** `vercel.json` sets `maxDuration: 60`, while the proxy/client allow 190s/180s. Requests that exceed the platform limit are terminated before the proxy timeout; raise the function limit on a plan that supports it or fail gracefully earlier.
14. **Replace hardcoded localhost agent links.** `Assemble Final Response` still emits `http://localhost:5678/...` for `chat_interface_url`/`chat_webhook_url`; use the public n8n origin or proxy URLs in production.

## TestSprite Checklist

TestSprite could not be enabled because no API key/credentials are configured. To run it later:

```bash
npx @testsprite/testsprite-cli --help
export TESTSPRITE_API_KEY=...
```

Suggested security cases:

- Anonymous visit to `/scraper.html?url=https://example.com` redirects to sign-in and does not call `/api/n8n/*`.
- Signed-in visit to `/scraper.html?url=...` sends `Authorization: Bearer ...` and never sends `shared_secret`.
- Direct `POST /api/n8n/company-summary` with no/invalid token returns 401.
- Direct `POST /api/n8n/company-summary` with a valid token and a `shared_secret` body field succeeds and the field is stripped upstream.
- Unknown `/api/n8n/*` path returns 404; GET on a POST route returns 405.
- 11 rapid authenticated scrapes return 429.
- `http://169.254.169.254`, `http://metadata.google.internal`, `http://127.0.0.1.nip.io`, and `http://localtest.me` are rejected.
- Chat for website B never contains data from website A.
- Response headers include CSP with `frame-ancestors 'none'`, `nosniff`, `DENY`, HSTS, Referrer-Policy, and Permissions-Policy.
- Response body never contains `retellApiKey`, `firecrawlApiKey`, or `shared_secret`.
- Firestore unauthenticated reads/writes are denied; user A cannot read user B.

## Key Files Changed

- `src/server/n8nProxy.js` — Clerk-verified, allowlisted n8n proxy; body/response sanitization; rate limiting.
- `api/n8n/*.js` — five Vercel function entry points.
- `vite.config.js` — development proxy and server-only secret loading.
- `src/services/scraperApi.js`, `src/services/chatApi.js`, `src/services/authToken.js` — client calls use Clerk tokens and relative proxy routes.
- `src/ClerkRoot.jsx` — Clerk token bridge.
- `src/scraper/ScraperApp.jsx` — authentication gate.
- `src/data/sampleBriefs.js` — external URL sanitization.
- `workflow.json` — auth ordering/fail-closed checks, constant-time compare, rate limits, SSRF hardening, chat scoping, prompt-injection guards, `hostname` fix, `latestBrief` removal.
- `vercel.json` — security headers and function duration.
- `firebase.json` — Firestore rules deployment path.
- `test_scraper.py` — shared-secret header.
- `scripts/auto-push*.ps1` — environment-file commit guard.
- `tests/security.test.mjs` — 17 regression tests.
- `scripts/check-no-client-secrets.mjs` — build secret scanner.
- `README.md` — updated deployment/security documentation.
