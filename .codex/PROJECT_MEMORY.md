# Smart Nutrition Project Memory

## Project Vision

Smart Nutrition is an AI wellness ecosystem that helps users log meals, understand nutrition, track hydration, manage reminders, use Telegram for retention, and interact with a helpful assistant across web, PWA, mobile, and Telegram WebView surfaces.

The product must feel trustworthy, fast, recoverable, and coherent. Every user action that claims success must map to backend-confirmed state or an explicit queued/offline state. The ecosystem must remain one product, not a collection of parallel experiments.

## Current Production Status

Status: stabilizing with live smoke checks passing; not yet fully certified for production.

The project has a formal Codex governance layer and specialist skill suite. The latest stabilization pass removed a frontend external product lookup bypass, added a canonical reminder repository method with legacy compatibility, tightened photo meal fallback UX copy, hardened production config checks against placeholders, added global Vite stale chunk recovery, redacted a real-looking provider key from env examples with a regression test, synchronized backend-confirmed supplement reminder creation into the visible reminder manager, hardened the 3D companion runtime so mobile/low-power/data-saver sessions stay on 2D, made assistant history reset backend-confirmed instead of local-only, aligned production readiness with MongoDB Atlas as accepted canonical storage, reduced public health/readiness responses to non-sensitive liveness summaries, locked production auth session cookies behind tests for cross-site `SameSite=None; Secure; HttpOnly` behavior, updated frontend backend probing to accept the live sanitized public health payload (`mode=remote-cloud`, `auth=httpOnly-cookie-session`), added backend-owned OpenFoodFacts host fallback for product lookup resilience, aligned committed environment templates with the live `smart-nutrition.club` / `www.smart-nutrition.club` deployment, updated the ignored local `.env` to production-like non-placeholder required settings, clarified owner bootstrap wording so `SMART_NUTRITION_SUPER_ADMIN_EMAIL` is documented as promotion to `OWNER` rather than a separate `SUPER_ADMIN` promise, made `server:check` self-select production mode so local env files do not need `NODE_ENV=production` and do not pollute Vite builds, hardened Redis production config validation so invalid or placeholder Redis URLs cannot be counted as distributed runtime state, added a PWA update fallback reload path so stalled service-worker handoffs do not leave users stuck on an endless updating state, made Telegram connect-link creation a pending/info UI state instead of a confirmed success until backend status reports the account is connected, extended client persistence startup cleanup to remove legacy browser-stored assistant conversation history keys, made the non-secret remote device id durable so cloud conflict ownership survives refresh/relogin, hardened reset-password/verify-email pages so email tokens are captured into runtime state and removed from the browser URL while Vercel-served frontend routes send a strict referrer policy, and collapsed owner role bootstrap into one awaited access-control startup path instead of a hidden auth-service fire-and-forget side effect. Live smoke checks confirm Render readiness, Vercel hydration, UI login, secure cross-site auth cookies, backend product lookup, canonical product meal intake, water restore, reminder create/edit/delete/restore, AI chat reset, Telegram connect link generation, PWA/service worker assets, and mobile protected meal screen rendering. Core automated checks and `server:check` now pass locally; `server:check` still reports only the recommended Redis warning.

## Completed Milestones

- Defined Smart Nutrition as one unified AI wellness ecosystem.
- Created project-local Codex specialist skills under `.codex/skills`.
- Established `smart-nutrition-chief` as orchestration and routing layer.
- Established specialist roles for architecture, production audit, production fixing, mobile/PWA/Telegram WebView, nutrition flows, AI runtime, and release readiness.
- Accepted strict rules against duplicate systems, fake persistence, fake success, and warehouse architecture.
- Added this project knowledge layer for memory, architecture decisions, and rules.
- Removed direct frontend Open Food Facts fallback from product search/barcode lookup; product provider fallback must be backend-owned.
- Removed external food catalog providers from frontend CSP `connect-src`; browser-side product lookup must not bypass the backend.
- Added canonical `updateUserReminders` repository persistence with legacy `updateUserMedicationReminders` fallback.
- Updated reminder service status to expose canonical `reminders` storage intent while documenting legacy `medicationReminders` compatibility.
- Added canonical `updateUserReminders` methods to SQLite, Postgres, and Mongo storage adapters while keeping legacy compatibility.
- Reworked free photo meal fallback copy to be consumer-friendly and protected by UX tests.
- Hardened production readiness checks so placeholder JWT, database, and email values cannot look production-ready.
- Hardened cross-site production cookie checks so separate frontend/backend deployments require `SameSite=None` and `Secure=true`.
- Added auth session cookie tests so login/refresh/restore responses keep tokens in secure HTTP-only cookies and do not leak access or refresh tokens in JSON bodies.
- Updated backend security headers to allow camera access for same-origin scanner runtime while keeping microphone/geolocation and other sensitive browser permissions disabled.
- Added global `vite:preloadError` recovery for stale deployment chunks with TTL protection against reload loops.
- Redacted a real-looking Resend key from `.env.example` and added env example tests so provider keys and duplicate sensitive assignments cannot re-enter templates silently.
- Added a browser-local reminder upsert event so backend-confirmed reminder creation from supplement recommendations immediately appears in the canonical reminder manager without a manual refresh.
- Hardened companion render-mode runtime so explicit 3D preference cannot load Three.js on mobile, low-power devices, reduced-motion/data-saver contexts, or unsupported WebGL environments.
- Hardened assistant conversation reset so UI clears the chat only after backend history deletion is confirmed.
- Accepted MongoDB Atlas as a production canonical backend storage option and updated release checks/templates so production certification does not force Postgres when MongoDB is the chosen source of truth.
- Hardened public health/readiness endpoints so unauthenticated probes do not expose Telegram, AI provider, metrics, warning, limit, keepalive, or database-name diagnostics.
- Updated frontend remote API probing so deployed Vercel builds accept the sanitized live `/api/health` response without requiring legacy diagnostic `provider` details.
- Added backend-owned OpenFoodFacts fallback host support so product search/barcode lookup can recover when one OpenFoodFacts edge/host fails from the backend runtime.
- Verified live production readiness signals after Render/Vercel deployment: `/api/ready` reports storage/cache/static/email ready; Vercel serves the app; CORS allows both canonical frontend origins and does not grant credentials to untrusted origins.
- Verified live UI login from Vercel to Render sets `smart-nutrition-access` and `smart-nutrition-refresh` as `HttpOnly`, `Secure`, `SameSite=None` cookies without exposing raw tokens in JSON.
- Verified live product search, barcode lookup, and `POST /api/meal/product-intake` persist through backend-confirmed meal history and cleanup correctly.
- Verified live reminders and water state restore across relogin using backend state, then cleaned up the smoke data.
- Verified live AI chat responds through the backend and chat reset is backend-confirmed.
- Verified live Telegram connect status/link generation without exposing the bot token.
- Verified live mobile protected meal screen renders after authenticated UI login without console/page errors; scanner and ZXing bundles remain lazy rather than initial-route payload.
- Updated `.env.example` and `render.env.example` to match the current production domain/CORS/OpenRouter referer/Telegram/keepalive configuration without adding secrets.
- Updated ignored local `.env` to production-like required values without printing secrets, allowing `npm run server:check` to pass required gates locally.
- Clarified owner bootstrap templates/docs/check output: `SMART_NUTRITION_SUPER_ADMIN_EMAIL` promotes the matching account to `OWNER` on backend start.
- Made `server:check` force production readiness mode internally, allowing ignored local `.env` files to omit `NODE_ENV=production` so frontend builds are not polluted by backend-only environment mode.
- Hardened Redis production config validation: provided Redis URLs must be valid `redis://` or `rediss://` values, and production placeholders such as example domains are rejected by tests.
- Added a guarded PWA service-worker update fallback reload so the update button recovers even if the normal Workbox `controlling` handoff stalls.
- Collapsed legacy reminder persistence methods into canonical `updateUserReminders` delegation across auth repository, SQLite, Postgres, and Mongo adapters so `updateUserMedicationReminders` cannot drift into a second reminder write path.
- Made Telegram account linking honest in the profile UI: creating/opening a personal bot link is an info/pending state, while success is reserved for backend-confirmed `connected=true` status from polling.
- Extended browser persistence migration cleanup to purge legacy `smart-nutrition-assistant-history:*` keys so old local assistant conversations do not remain after backend-owned AI memory is active.
- Made `smart-nutrition.remote-device-id` a durable non-secret client key so backend `lastWriterDeviceId` conflict ownership remains stable across refresh/relogin.
- Hardened email verification and reset password token handling: pages capture the `token` into runtime state, immediately remove it from the address bar with history replacement, and Vercel frontend routes now declare `Referrer-Policy: strict-origin-when-cross-origin`.
- Collapsed owner bootstrap side effects: `authService` no longer promotes configured owner email during construction; `platformService.bootstrapAccessControl()` is the single awaited startup path before the API begins serving routes.
- Hardened granular meal/product mutations so backend routes return canonical `meal` state alongside `meta`, and frontend meal sync rejects `ok` responses from granular endpoints when canonical meal state is missing.
- Reconnected Telegram free-text conversation to the same backend AI assistant runtime as the website: deterministic agent actions still execute backend-confirmed tools first, and unhandled conversational text falls back to `aiService.askQuestion` with `interactionChannel=telegram`.
- Verified latest stabilization with build, tests, lint, dependency audit, cycle audit, and architecture audit.
- Hardened frontend remote API routing so public deployments prefer the canonical configured Render backend over stale browser-stored API base URLs; added regression coverage for registration availability when old localStorage state exists.
- Added SEO discovery as a release-gated contract: `robots.txt` now exposes the canonical sitemap while blocking protected/token SPA surfaces, `sitemap.xml` uses current canonical public URLs, and `npm run audit:seo` verifies index metadata, crawler policy, sitemap scope, lastmod freshness, and manifest identity.

## Current Architecture

- Frontend: React application with mobile, PWA, scanner, assistant, food, profile, community, analytics, and companion surfaces.
- Backend: Node backend owns canonical business actions and persistence contracts.
- Storage: MongoDB Atlas is the current production canonical backend storage. Postgres remains a supported future migration path, and SQLite remains local/development storage.
- AI: Assistant behavior must run through backend tools/contracts for saved actions and must not invent completion.
- Telegram: Retention and notification layer that must reuse canonical backend reminder/task contracts.
- Telegram AI: Telegram is an AI companion surface for the same Smart Nutrition assistant runtime as the website; commands/reminders are tools and shortcuts, not a separate bot product or second AI brain.
- Nutrition: Scanner, search, manual add, photo recognition, recipes, products, and meals must converge on one canonical backend-confirmed intake flow.
- Product Lookup: Frontend calls the backend product contract only; external catalog provider fallback belongs behind the backend.
- Security/CSP: Frontend `connect-src` must not allow direct external food catalog providers for product lookup.
- Scanner security headers: backend-served app responses must allow `camera=(self)` so barcode scanning is not blocked by Permissions Policy.
- Health endpoints: public `/api/health` and `/api/ready` are liveness/readiness contracts only; detailed diagnostics must stay gated behind debug/admin surfaces.
- Frontend remote backend discovery must accept the sanitized public health contract and must not require provider names or detailed diagnostics from public `/api/health`.
- Public frontend deployments must prefer the canonical configured backend URL over stale stored browser API base URLs. LocalStorage may remember a remote base URL as cache/hint only; it must not override the accepted production backend contract.
- Auth cookies: production frontend/backend split deployments must use `SameSite=None; Secure=true` for restore and authenticated API calls.
- Auth session responses must place access/refresh tokens only into HTTP-only cookies and return user/snapshot data in the JSON body without raw tokens.
- Configured owner promotion belongs to the explicit awaited access-control bootstrap path, not to fire-and-forget service construction side effects.
- Email verification and reset password tokens may be consumed from URL links only long enough to capture them into runtime state; the browser address bar/history entry must be cleaned before user interaction continues.
- Vercel-served frontend routes must keep `Referrer-Policy: strict-origin-when-cross-origin` so auth link query data is not sent cross-origin.
- Reminders: Canonical service/repository/storage language is `reminders`; legacy medication-reminder naming is compatibility only until a planned migration retires it.
- Mobile/PWA: Android, small screens, Telegram WebView, service worker recovery, safe areas, camera runtime, and keyboard behavior are first-class architecture concerns.
- Companion: 3D companion must load lazily/on demand and must not damage core performance.

## Active Contracts

- Backend/cloud is the source of truth for canonical user data.
- Production canonical storage may be MongoDB Atlas or Postgres, but it must be backend-owned, configured explicitly, and non-placeholder.
- Product and meal intake must use a canonical backend-confirmed flow.
- Granular meal/product mutations (`/meal-entries`, `/meal-templates`, `/meal-products`, and `/meal/product-intake`) must return canonical backend `meal` state; frontend must not apply locally computed meal state as success for those granular contracts.
- Product search/barcode resolution must not call external catalogs directly from the frontend.
- External product catalog lookup and provider fallback must run behind backend contracts.
- Backend product lookup may use multiple backend-owned provider hosts for resilience, but the frontend must still call only the Smart Nutrition backend contract.
- Frontend CSP must not reopen direct browser access to external food catalog providers.
- SEO discovery is a release contract: public metadata, `robots.txt`, `sitemap.xml`, and `manifest.webmanifest` must remain aligned with `https://smart-nutrition.club`, while protected app screens and token routes must not be promoted as public search pages.
- Profile mutations must use unified cloud actions, not isolated local state.
- Warm session restore must recover authenticated user state and critical data after refresh/relogin.
- Remote device id is a non-secret client identifier used for sync conflict ownership; it may persist locally, but it must not contain tokens, user data, or authorization state.
- Production readiness checks must reject placeholder secrets, database URLs, and email settings.
- Production readiness checks must reject cross-site cookie settings that break auth restore.
- Auth cookie helpers must keep `SameSite=None`, `Secure`, `HttpOnly`, `Path=/`, and explicit `Max-Age` behavior covered by tests for split frontend/backend deployments.
- Public health/readiness endpoints must not expose operational diagnostics such as provider internals, limits, warnings, request metrics, Telegram polling state, or database names.
- Frontend health probes must validate public liveness shape (`ok`, `mode=remote-cloud`, `auth=httpOnly-cookie-session`, `storage.engine`) instead of depending on removed diagnostic provider fields.
- Product lookup provider resilience belongs in `productLookupService`; do not reintroduce frontend OpenFoodFacts calls to paper over backend provider failures.
- Environment example files must never contain real-looking provider secrets or duplicate sensitive backend assignments.
- Vite preload/chunk failures must trigger controlled stale-build recovery instead of leaving a white screen.
- Scanner runtime must be deterministic: permission, stream start, scan, cleanup, and errors must be explicit.
- 3D companion must be lazy/on-demand and isolated from core flows.
- 3D companion runtime must stay 2D on mobile, low-power, data-saver, reduced-motion, and unsupported WebGL contexts even if 3D is selected in profile preferences.
- Telegram is a retention layer, not the main application or a separate reminder backend.
- Telegram free text must route through the canonical assistant runtime after deterministic backend-confirmed agent actions are checked.
- Telegram connect-link creation must not be reported as confirmed connection; only backend-confirmed status polling can show connected success.
- Reminder persistence should use `updateUserReminders`; `updateUserMedicationReminders` is a legacy compatibility alias that must delegate to the canonical method and must not contain separate write logic.
- Reminder UI surfaces that create or update backend-confirmed reminders must keep the visible reminder manager synchronized with the returned canonical reminder item.
- AI saved actions must call backend tools/contracts and report only confirmed, pending, or failed states.
- AI conversation history reset must be backend-confirmed; local cleanup is hygiene only and cannot report success by itself.
- Legacy browser-stored assistant history is privacy-sensitive migration debt and must be purged on startup, not treated as canonical memory.
- UI success must be backend-confirmed unless clearly marked as queued/offline.
- Every user action must be recoverable through refresh, relogin, retry, or explicit error handling.

## Open Risks

- Duplicate meal/product/reminder/AI/profile systems can appear if new features bypass canonical contracts.
- Scanner and photo meal flows can drift into separate product/meal persistence paths.
- Local-only state can masquerade as real persistence.
- Stale PWA/service-worker cache or stale localStorage API routing can make production users see old behavior after redeploy unless deploy-sensitive fixes verify the full live chain.
- Local `server:check` passes required checks with the ignored `.env`; Redis remains the only recommended local warning.
- Live owner/admin access is not active for the tested account until Render has `SMART_NUTRITION_SUPER_ADMIN_EMAIL` set to the real owner email and is redeployed.
- Ignored/private env files and local browser profiles can contain sensitive machine-specific data; audits must avoid printing secrets and should scan committed templates separately.
- Email deliverability is functional but at least one confirmation message landed in spam during live testing; DNS sender alignment and mailbox reputation need an external deliverability check outside code.
- Telegram reminder behavior can diverge from the app reminder/task model if legacy reminder naming is extended instead of migrated.
- PWA stale chunks and service worker updates are guarded by preload recovery, service-worker cache bypass, explicit update UI, and a fallback reload path; real-device PWA smoke should still validate this after deploy.
- Mobile safe areas, bottom navigation, keyboard resize, and camera overlays can break core flows.
- AI assistant can hallucinate saved actions or memory resets if backend tool execution is not enforced.
- 3D companion, scanner, photo recognition, and AI UI can increase bundle cost if not lazy loaded.

## Technical Debt

- Production status needs regular audit updates after real checks.
- Architecture decisions need timestamps/status updates when contracts evolve.
- Current risks should be retired only after code inspection and validation.
- Smoke check evidence exists under `.codex/runtime-smoke` locally, but the directory is intentionally ignored; durable release notes should summarize results without committing screenshots unless explicitly requested.
- Any local storage usage must be classified as cache, draft, preference, or bug.
- Stored remote API base URLs are cache/hints only and must not outrank the canonical backend on public deployments.
- Reminder database fields still have legacy `medicationReminders` naming in compatibility paths; write behavior now delegates through canonical reminder methods, and field/schema migration should happen deliberately after production safety is proven.
- Env example guard currently covers common provider key shapes; extend it when adding a new provider or deploy platform secret.
- Vite still reports a large lazy `three-core-vendor` chunk; mobile/low-power runtime is guarded, but desktop 3D bundle size still needs a deeper Three.js strategy if warning-free builds become mandatory.
- Lint passes with existing warnings; warnings should be burned down without broad rewrites.

## Next Highest-Impact Tasks

1. Set `SMART_NUTRITION_SUPER_ADMIN_EMAIL` in Render to the real owner account email, redeploy Render, and verify `/api/admin/users` returns 200 for that account.
2. Decide whether to configure Redis for production hardening.
3. Review large bundle chunks and lazy-load high-cost scanner, AI, companion, markdown, and vendor paths where safe.
4. Complete reminder naming migration plan from legacy `medicationReminders` to canonical `reminders`.
5. Run real-device mobile/PWA/Telegram WebView smoke checks for safe areas, keyboard, bottom nav, scanner camera permission, stale chunks, and service worker recovery.
6. Trace canonical product/meal intake end-to-end across manual add, photo add, AI actions, scanner UI camera scan, and refresh/relogin restore.
7. Check email deliverability DNS/reputation so verification messages stop landing in spam.
8. Trace AI tool execution so saved actions and memory changes cannot be hallucinated.
9. Submit and monitor SEO indexing externally after deployment: Search Console, Bing Webmaster, Yandex/Webmaster, and indexed-result appearance for Smart Nutrition brand queries.

## Release Checklist

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run audit:deps`
- `npm run audit:cycles`
- `npm run audit:architecture`
- `npm run audit:seo`
- Mobile smoke checklist completed.
- Scanner smoke checklist completed.
- Auth restore verified after refresh and relogin.
- Meal/product add verified through scanner, search, manual, and photo flows.
- Telegram reminders verified through canonical reminder/task model.
- PWA update/recovery verified, including stale chunk recovery.
- Bundle chunk warnings reviewed, especially scanner, photo recognition, AI, and 3D companion.
- `npm run server:check` passes against production-like environment variables.
- Env examples verified to contain placeholders only, with no real-looking provider secrets or duplicate sensitive assignments.
- Reset-password and verify-email links verified to remove sensitive token query params from the browser URL after token capture.
- SEO/indexing verified: `npm run audit:seo` passes, live `robots.txt` and `sitemap.xml` return 200, landing metadata is indexable, Search Console/Bing/Yandex submissions are complete, and protected app/user data routes are not exposed as public SEO pages.
- `PROJECT_MEMORY.md`, `DECISIONS.md`, and `PROJECT_RULES.md` updated if architecture changed.
