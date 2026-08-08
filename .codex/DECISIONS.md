# Smart Nutrition Architecture Decisions

## ADR-001: Backend/Cloud Is Source Of Truth

- Status: Accepted.
- Context: Smart Nutrition spans React, backend, storage, AI, Telegram, scanner, PWA, and mobile surfaces. Local-only truth creates data loss and inconsistent UX.
- Decision: Backend/cloud persistence is the canonical source of truth for user data and completed actions.
- Consequences: Frontend state may cache, stage, or optimistically display data only when reconciliation is explicit. Success states must reflect backend-confirmed state or an explicit queued/offline state.

## ADR-002: Canonical Product Intake Endpoint

- Status: Accepted.
- Context: Barcode scanner, product search, manual add, photo meal recognition, recipes, and AI food logging can easily become separate meal/product systems.
- Decision: All product and meal intake paths must converge on a canonical backend-confirmed product/meal intake contract.
- Consequences: Scanner, search, manual, photo, recipe, and AI add flows must share persistence semantics, catalog status, confirmation, error handling, and refresh/relogin restore.

## ADR-003: Unified Profile Cloud Actions

- Status: Accepted.
- Context: Profile, goals, preferences, wellness settings, AI memory, Telegram binding, and personalization depend on stable user identity.
- Decision: Profile mutations must use unified backend/cloud actions and must not be stored as isolated canonical local state.
- Consequences: Frontend profile stores may cache or stage data, but cloud actions own accepted profile changes and restore behavior.

## ADR-004: Warm Session Restore

- Status: Accepted.
- Context: PWA/mobile users expect refresh, relogin, and app resume to restore auth and critical nutrition state.
- Decision: Smart Nutrition must support warm session restore for authenticated user state and critical user data.
- Consequences: Auth restore, profile restore, meal history, reminders/tasks, water state, and assistant context must be recoverable. Loading, expired auth, and recovery failures must be explicit.

## ADR-005: Scanner Deterministic Runtime

- Status: Accepted.
- Context: Camera behavior is fragile on Android, small screens, PWA installs, and Telegram WebView.
- Decision: Scanner runtime must be deterministic: permission request, stream start, active scanning, product resolution, cleanup, and error states must be explicit and recoverable.
- Consequences: No fake scanner success. Camera streams must be cleaned up on route change and failure. Unknown barcode, permission denied, lookup failure, and user cancel must be first-class states.

## ADR-006: 3D Companion Lazy/On-Demand Loading

- Status: Accepted.
- Context: The 3D companion can improve engagement but can harm performance if loaded into core nutrition flows.
- Decision: The 3D companion must be lazy/on-demand and isolated from critical path bundles.
- Consequences: Meal logging, scanner, auth, reminders, and assistant core flows must not pay upfront 3D runtime cost. Bundle warnings involving companion code require review.

## ADR-007: Telegram As Retention Layer, Not Main App

- Status: Accepted.
- Context: Telegram is valuable for reminders, nudges, and re-engagement, but it must not become a parallel product with separate truth.
- Decision: Telegram is a retention layer that reuses canonical backend contracts for reminders, tasks, profile binding, and AI actions.
- Consequences: Telegram must not own separate reminder/task truth. Telegram messages should reflect canonical state and failures. The main app remains the complete product surface.

## ADR-008: Backend-Owned Product Lookup Providers

- Status: Accepted.
- Context: Frontend direct calls to external food catalogs create a second product resolution path, bypass backend contracts, and make persistence/catalog status harder to trust.
- Decision: Product search and barcode lookup from the frontend must call the backend product contract only. External catalog providers and fallback logic belong behind the backend.
- Consequences: Frontend product flows can display backend-confirmed, unknown, failed, or explicitly queued states only. External provider failures must be normalized by backend services and covered by backend tests. Frontend CSP must not allow direct browser connections to external food catalog providers.

## ADR-009: Canonical Reminder Persistence With Legacy Compatibility

- Status: Accepted.
- Context: Smart Nutrition reminders started with medication-specific naming, but the product now needs one reminder/task model shared by app and Telegram.
- Decision: New code should use canonical `reminders` language and `updateUserReminders` contracts across services, repositories, and storage adapters. Legacy `medicationReminders` naming may remain only as a backward-compatible database field/path until a deliberate migration retires it.
- Consequences: Do not add a second reminder system. Telegram and app reminders must converge on canonical contracts, while compatibility code must be explicit and tested.

## ADR-010: Production Gate Rejects Placeholder Values

- Status: Accepted.
- Context: A release check that accepts `CHANGE_ME`, `replace-with`, `example.com`, or `your-verified-domain.com` values can create fake production readiness.
- Decision: Production config and readiness checks must reject placeholder secrets, database URLs, and email settings.
- Consequences: Local/deploy environments must provide real production values before release certification. Example env files may remain templates, but they must not be able to masquerade as deploy-ready configuration.

## ADR-011: Stale Chunk Recovery Is A Runtime Contract

- Status: Accepted.
- Context: PWA users can return after a deploy with cached HTML pointing to removed chunks, especially on mobile and Telegram WebView.
- Decision: Vite preload/chunk failures must be globally detected, reported, and recovered through controlled cache cleanup plus a recovery-marker reload.
- Consequences: The app must not leave users on a white screen after stale chunk failures. Recovery must preserve durable user settings/session hints and guard against reload loops.

## ADR-012: Scanner Camera Must Be Allowed By Backend Security Headers

- Status: Accepted.
- Context: Smart Nutrition barcode scanning depends on browser camera access. A restrictive Permissions Policy can block camera before scanner runtime starts.
- Decision: Backend-served app responses must allow `camera=(self)` while keeping unrelated sensitive permissions such as microphone, geolocation, payment, USB, Bluetooth, accelerometer, gyroscope, and magnetometer disabled.
- Consequences: Scanner camera access remains possible for the app origin. Any future security header changes must be tested against barcode scanner availability.

## ADR-013: Cross-Site Production Auth Requires Secure None Cookies

- Status: Accepted.
- Context: Smart Nutrition production commonly runs frontend and backend on separate origins. `SameSite=Lax` or insecure cookies can break auth restore and authenticated API calls in that deployment shape.
- Decision: Production deployments with `SMART_NUTRITION_SERVE_STATIC=false` must use `SMART_NUTRITION_AUTH_COOKIE_SAME_SITE=None` and `SMART_NUTRITION_AUTH_COOKIE_SECURE=true`.
- Consequences: Local production-style containers may still use local cookie settings when serving static from the backend, but release checks must block cross-site production cookie misconfiguration.

## ADR-014: Environment Examples Are Secret-Free Contracts

- Status: Accepted.
- Context: Env example files are copied into onboarding, deployment docs, CI snippets, and chats. A real-looking provider key in a template can leak credentials and normalize unsafe release hygiene.
- Decision: `.env.example`, `render.env.example`, and `vercel.env.example` must contain placeholders only. Sensitive backend assignments in `.env.example` must not be duplicated.
- Consequences: Adding a new provider or deploy secret must update the env example guard tests. Real secrets belong only in ignored local env files or managed platform secret stores, never in templates or project memory.

## ADR-015: MongoDB Atlas Is Accepted Production Canonical Storage

- Status: Accepted.
- Context: Smart Nutrition already supports MongoDB, Postgres, and SQLite storage adapters. The active Render deployment uses MongoDB Atlas as the primary backend/cloud database, while local SQLite remains development-only and Postgres remains an optional future migration path.
- Decision: Production readiness checks must accept `SMART_NUTRITION_DATABASE_PROVIDER=mongodb` with a real non-placeholder `SMART_NUTRITION_MONGO_URI` as canonical production storage. Postgres remains valid when explicitly configured, but it is not mandatory for production certification.
- Consequences: Backend/cloud remains the source of truth regardless of storage adapter. Release checks must reject local-only SQLite and placeholder database values in production, but must not force a second database when MongoDB Atlas is the chosen canonical store.

## ADR-016: Public Health Endpoints Are Liveness Contracts, Not Diagnostics

- Status: Accepted.
- Context: Render, keepalive jobs, and uptime probes need public `/api/health` and `/api/ready` endpoints. Returning full operational diagnostics there exposes provider choices, runtime warnings, rate limits, Telegram polling state, request metrics, and internal database details.
- Decision: Public health/readiness endpoints must return only non-sensitive liveness/readiness summaries. Detailed startup and runtime diagnostics belong in explicitly gated debug/admin surfaces, not public unauthenticated endpoints.
- Consequences: `/api/health` can expose minimal service mode, auth mode, storage engine, static state, and email configured state. `/api/ready` can expose readiness booleans and check names. Telegram, AI provider internals, limits, warnings, metrics, keepalive internals, and database names must not be exposed from public health responses.

## ADR-017: Granular Meal Mutations Return Canonical Meal State

- Status: Accepted.
- Context: Quick add, scanner, product cards, templates, saved/recent products, photo meal, recipes, and AI actions can all mutate meal state through granular backend endpoints. Returning only `{ ok, meta }` lets the frontend apply locally computed meal state and can hide backend normalization, persistence differences, or contract drift.
- Decision: Granular meal/product mutation endpoints must return canonical backend `meal` state with mutation metadata. The frontend must treat `ok` without canonical `meal` as a broken contract for granular mutation success.
- Consequences: UI success for granular meal/product actions is based on backend-confirmed meal state only. Full-state `PUT /meal-state` may still apply the submitted state after backend confirmation because that endpoint saves the exact state payload. Tests must cover missing canonical meal responses so fake local success cannot return.

## ADR-018: SEO Discovery Is A Release Contract

- Status: Accepted.
- Context: Smart Nutrition needs to be discoverable by search engines without exposing authenticated app surfaces, token routes, or user data pages as public SEO content.
- Decision: Release quality must verify `index.html`, `robots.txt`, `sitemap.xml`, `sitemap-images.xml`, `manifest.webmanifest`, `llms.txt`, and `ai.txt` as one SEO/search discovery contract. The sitemap may list only canonical public entry routes, the image sitemap may list only public brand assets, and protected SPA screens or token routes must be blocked from crawler discovery.
- Consequences: Search discoverability cannot rely on one-off manual edits. Any route, domain, manifest, canonical URL, crawler policy, image discovery, or AI answer-engine summary change must keep `npm run audit:seo` passing before release, and `npm run audit:live` must verify deployed discovery files after Vercel/Render redeploy.

## ADR-019: Route-Heavy Vendors Must Stay Out Of Initial Payload

- Status: Accepted.
- Context: Scanner, photo compression, markdown rendering, analytics SDKs, native bridges, and 3D companion vendors can make mobile/PWA startup feel slow even when each chunk is below the generic size limit.
- Decision: Bundle audit must inspect both initial scripts and modulepreload assets, cap total initial JavaScript payload, and block route-heavy vendors from being preloaded by `index.html`.
- Consequences: Heavy capabilities remain available through route-local lazy chunks, but landing/auth/startup must not pay for scanner, photo, markdown, analytics, native, or 3D runtime before the user opens those surfaces.

## ADR-020: Live Production Smoke Is Separate From Local Release Gate

- Status: Accepted.
- Context: Local release checks are deterministic and must not depend on live network state, but deploy-sensitive fixes still need evidence that Vercel, Render, public SEO files, CORS, frontend assets, and sanitized health endpoints work together after deployment.
- Decision: `npm run audit:live` is the canonical public live smoke command. It checks the deployed app and backend through public unauthenticated endpoints only, uses no secrets, performs no protected user actions, and is intentionally kept outside `npm run quality` and `npm run release:gate`.
- Consequences: Run `npm run audit:live` after deployment, after domain/CORS/SEO/backend URL changes, and before claiming live production readiness. Protected flows such as registration, login, admin, scanner camera, and meal writes still need separate authenticated smoke checks.

## ADR-021: Authenticated Production Smoke Uses A Dedicated Verified Account

- Status: Accepted.
- Context: Public health checks cannot prove that real users can log in, restore sessions, mutate water/meal/reminder state, or access Telegram connection status. At the same time, personal/admin credentials must never be committed or echoed by tooling.
- Decision: `npm run audit:live:auth` is the canonical authenticated production smoke command. It requires `SMART_NUTRITION_LIVE_SMOKE_EMAIL` and `SMART_NUTRITION_LIVE_SMOKE_PASSWORD`, uses the live httpOnly cookie session flow, verifies backend-confirmed state actions, and cleans up smoke mutations where the API supports cleanup.
- Consequences: Use a dedicated verified smoke account, not owner/admin/personal credentials. The command intentionally fails when credentials are missing, and it stays outside local `quality`/`release:gate` because it mutates production smoke-account state and depends on external auth availability.

## ADR-022: Storage Startup Logs Must Be Sanitized And Intentional

- Status: Accepted.
- Context: Public health endpoints were already reduced to liveness summaries, but storage adapters could still print MongoDB database and host details directly during successful startup. Logs are not public UI, yet they are operational evidence and should not become an uncontrolled diagnostics channel.
- Decision: Storage adapters must not call `console.log` for infrastructure success details. If connection summaries are needed, they must go through an explicit logger path with sanitized fields.
- Consequences: Retry/failure warnings may remain operational, but successful database/host output must stay controlled. Contract audit protects MongoDB storage and AI repository adapters from reintroducing direct success stdout.

## ADR-023: AI Debug Stdout Is Forbidden In Production

- Status: Accepted.
- Context: AI provider fallback, model routing, provider errors, and prompt orchestration are sensitive operational surfaces. Debug stdout can accidentally expose provider details, user context, or raw upstream errors when enabled in a live deployment.
- Decision: `SMART_NUTRITION_AI_DEBUG_LOGS=true` is allowed only outside production. Production observability must use controlled audit logs, public sanitized runtime status, Sentry, or explicit admin/debug surfaces.
- Consequences: Production config fails fast if AI debug stdout logging is enabled. AI troubleshooting can still be done locally or in controlled non-production environments.

## ADR-024: Startup Debug Diagnostics Are Development-Only

- Status: Accepted.
- Context: Startup diagnostics include environment presence checks, CORS origins, cookie policy, storage/AI provider summaries, product lookup status, warnings, and request diagnostics. This is useful locally but too broad for a live production debug surface or unconditional startup dump.
- Decision: `SMART_NUTRITION_DEBUG_STARTUP_ENABLED=true` is forbidden in production, `/api/debug/startup` must not be registered in production, and full startup diagnostics must be logged only when debug startup diagnostics are enabled.
- Consequences: Production startup logs keep only concise service lifecycle messages and controlled warnings. Detailed config/debug dumps remain available for local development and non-production troubleshooting.

## ADR-025: Redis Requirement Follows Backend Instance Count

- Status: Accepted.
- Context: Redis backs distributed cache and rate limiting. A single backend instance can safely use in-memory cache/rate limiting, but multiple backend instances would otherwise drift into separate per-instance runtime state.
- Decision: `SMART_NUTRITION_RUNTIME_INSTANCE_COUNT` declares the intended production backend instance count. Production may run without Redis only when the count is `1`. If the count is greater than `1`, `SMART_NUTRITION_REDIS_URL` is required and production config fails fast when it is missing.
- Consequences: `server:check` does not warn about Redis for an explicitly single-instance deployment, but horizontal scaling must configure Redis before deploy. Scaling decisions are visible, test-covered, and protected by contract audit.

## ADR-026: Family Wellness Is A Lifecycle Layer

- Status: Accepted.
- Context: Smart Nutrition is expanding from personal nutrition into planning, pregnancy, partner support, postpartum, breastfeeding, baby care, and family habits. Building a separate family app, local family store, second AI memory, or separate Telegram flow would recreate the same architecture drift the project rules are designed to prevent.
- Decision: Family Wellness is a lifecycle layer inside the existing Smart Nutrition account, profile cloud state, AI runtime, Telegram retention layer, and backend-owned sharing contracts. Existing `womenHealth` profile state remains the canonical owner for planning, pregnancy, postpartum, symptom, and baby-preview context. The canonical `familyLifecycleMode` profile field summarizes the active lifecycle for AI/UI/Telegram context, but pregnancy truth is derived from `womenHealth` and partner mode is derived from permission-scoped partner sharing. Partner access remains permission-scoped and must not become full account synchronization.
- Consequences: New family modes must extend canonical backend/profile/family contracts instead of adding local-only state or duplicate systems. AI and Telegram must read lifecycle context through canonical profile/sharing data and must keep medical safety boundaries. Pregnancy, baby, breastfeeding, partner, and family-goal actions can show success only after backend confirmation or explicit queued/offline state.

## ADR-027: Transactional Email Uses Provider Failover, Not Duplicate Mailers

- Status: Accepted.
- Context: Registration, password reset, and partner invitations depend on transactional email. A single provider quota, outage, timeout, or domain reputation issue must not silently break account creation, but adding separate mailers per feature would create duplicate delivery logic and fake success risks.
- Decision: `server/services/emailService.mjs` is the canonical transactional email service. Brevo is the primary provider when `SMART_NUTRITION_BREVO_API_KEY` is configured, protected by timeout and transient retry handling. Resend remains the reserve provider when configured. UI success may be shown only after the canonical service returns `ok: true`; delivery failure must remain an honest retry/edit recovery state.
- Consequences: New transactional emails must use the canonical email service instead of direct provider calls. Provider errors may be logged only as sanitized codes/status/messages. Release checks and contract audit must keep Brevo primary, retry/timeout protection, and Resend fallback in place.

## ADR-028: Onboarding Is A Recoverable State Machine

- Status: Accepted.
- Context: Registration, email verification, language/theme setup, profile questions, women-health context, optional personalization, and app entry can drift into route-driven traps if each page decides completion on its own.
- Decision: Onboarding completion is a single backend-confirmed profile/user save contract. `Finish setup` may mark onboarding complete only after the canonical profile save succeeds. `Continue` must keep onboarding open and route to remaining personalization instead of saving completion or navigating to profile as a disguised finish action.
- Consequences: Onboarding routes are navigation only, not source of truth. Draft answers must be preserved on save failure, retry must be explicit, and users must be able to go back without losing entered data. Final save conflict recovery must replay the same onboarding answer patch on top of the freshly recovered cloud profile so women-health/family context is not lost. Authenticated users who still need setup must enter through `/onboarding/choice`, not a flow that feels like language/theme setup is being repeated. Future family, pregnancy, assistant, and preference questions must extend this state machine rather than adding a second onboarding flow.

## ADR-029: Backend Capabilities Must Be Honest

- Status: Accepted.
- Context: Repository and service wrappers can accidentally expose optional storage methods even when the active adapter does not implement them, creating fake atomic paths and hiding partial-write risk behind `null` fallbacks.
- Decision: Optional backend capabilities, including atomic user+profile persistence, may be exposed only when the active storage adapter implements the method. Unsupported capabilities must be absent, not present-but-null.
- Consequences: Routes and services must branch on real method availability. New storage adapters must either implement the canonical capability completely or leave it absent so callers can use explicit fallback/error behavior instead of assuming backend-confirmed atomic success.

## ADR-030: Women-Health Access Must Be Visible

- Status: Accepted.
- Context: Smart Nutrition already keeps pregnancy, planning, postpartum, baby preview, and family support inside canonical profile cloud state, but eligible users can reasonably experience the feature as missing if it is reachable only through a hidden or horizontally buried profile tab.
- Decision: Female accounts and accounts with women-health/family context must expose an obvious visible entrypoint into the canonical `women-health` profile section. The entrypoint may be a profile/header/app shortcut, but it must route to the existing profile-owned section instead of creating a second women-health app, local store, or duplicate family dashboard.
- Consequences: Discoverability is part of the contract. Future UI changes must keep eligible users able to find women-health features, while all saves and sharing continue through canonical profile cloud and permission-scoped family contracts.

## ADR-031: Combined Profile-State Success Requires Complete Canonical Records

- Status: Accepted.
- Context: `/api/auth/profile-state` updates both account-facing user fields and profile state. If storage returns an incomplete result, response shaping can crash into a generic `500`, or the UI can be tempted to treat a partial save as success.
- Decision: Combined profile-state saves may return success only when backend persistence returns both confirmed `user` and `profile` records. Missing or malformed records must be rejected as `STATE_SYNC_UNAVAILABLE` with recoverable `503` behavior.
- Consequences: Onboarding/profile saves stay honest: no fake success, no partial local confirmation, and no raw `toPublicUser` crashes. Tests and contract audit must keep the complete-result guard in place.

## ADR-032: Onboarding Completion Failures Are Recoverable, Not 500 Traps

- Status: Accepted.
- Context: A female/new-user onboarding finish can be blocked if `/api/auth/profile-state` exposes ordinary storage failures as generic `500` responses or if stale onboarding URLs route back into the assistant/language step.
- Decision: Unexpected profile-state persistence or snapshot-meta failures during combined onboarding/profile completion must be converted to `STATE_SYNC_UNAVAILABLE` with public `503` recovery copy. Unknown onboarding routes must return to the explicit onboarding choice step, not to assistant/language setup.
- Consequences: Users can retry or go back without losing draft answers, female/women-health context remains part of the canonical save contract, and future changes must prove onboarding completion through local tests plus authenticated production smoke after deployment.

## ADR-033: Git Pushes Are Coherent Checkpoints

- Status: Accepted.
- Context: Pushing after every small edit creates noisy history, CI debugging loops, and partial production states that conflict with the project's stabilization-first policy.
- Decision: Work should stay local until a coherent validated development batch, substantial milestone, or explicit user request is ready. A push is a release/checkpoint act, not a progress heartbeat.
- Consequences: Local validation, root-cause fixes, and implementation ledgers come before GitHub updates. Commit messages should remain meaningful and project-standard, and CI should be final verification rather than the primary debugger.

## ADR-034: AI Lifecycle Context Comes From Profile State

- Status: Accepted.
- Context: Women-health, pregnancy, planning, postpartum, symptoms, baby-preview, and family lifecycle data are saved in canonical profile state. Auth/user snapshots can lag during registration, onboarding, refresh, or recovery, which can make web AI, backend AI, or Telegram behave as if the context is missing.
- Decision: Web assistant, backend AI, and Telegram assistant context must preserve saved `womenHealth` profile state whenever it exists. `user.gender` may be a helpful display or eligibility hint, but it must not be the only gate for passing canonical lifecycle context to the assistant.
- Consequences: The assistant can support pregnancy/family scenarios from real saved profile data even after stale session snapshots. Unfinished onboarding must also seed female-context state from saved `womenHealth` data before user gender fallback so final completion cannot erase lifecycle answers. Future web AI, backend AI, Telegram, and onboarding context changes must avoid second lifecycle stores and must keep medical-safety boundaries.

## ADR-035: Mongo Profile-State Writes Use Transactional Compare-And-Set

- Status: Accepted.
- Context: Profile-state saves touch canonical user/profile/snapshot records and may arrive from multiple devices, refresh recovery, onboarding retry, Telegram, or future mobile sessions. A separate version read followed by an unconditional write can lose a concurrent update.
- Decision: MongoDB profile-state and full snapshot writes must compare the expected `updatedAt` cloud version inside the `states.updateOne` filter and inspect `matchedCount`. Combined profile/user saves must run profile, state meta, and user updates in one transaction when MongoDB supports transactions.
- Consequences: Parallel stale writes return `STATE_CONFLICT` instead of silently overwriting newer cloud state. Transaction bodies must avoid `Promise.all`; future storage changes must preserve backend-confirmed complete records or explicit recoverable sync failure.

## ADR-036: GitHub Quality Gate Mirrors Local Stabilization

- Status: Accepted.
- Context: Smart Nutrition should not use GitHub Actions as a trial-and-error loop, but production deploys also must not bypass checks that local release work treats as mandatory.
- Decision: The `Smart-Nutrition` GitHub workflow must run the local `quality` suite, dependency security audit, and production config validation on master pushes and pull requests. CI production config uses explicit non-secret CI-only values and must not require live production secrets.
- Consequences: Broken lint, build, tests, bundle/SEO/dead-code audits, dependency/security issues, architecture violations, contract drift, or production config regressions block the checkpoint before deploy. Render still needs platform-side configuration to wait for this gate before promoting production.

## ADR-037: Token Cleanup Is Scheduled Housekeeping

- Status: Accepted.
- Context: Expired session, reset, and verification tokens need cleanup, but running that cleanup from every API request couples ordinary user latency to global storage delete scans.
- Decision: Token cleanup must run at startup and on the scheduled cleanup interval. Request routing must not call expired-token cleanup directly.
- Consequences: Normal auth/product/profile requests avoid unnecessary storage cleanup work. Token cleanup failures are logged as housekeeping failures and retried by the scheduler instead of affecting unrelated user actions.

## ADR-038: Password Reset Consumes Tokens After Password Persistence

- Status: Accepted.
- Context: Password reset is a recovery flow. If the reset token is consumed before the new password is saved, a transient storage failure can leave the user locked out with a burned recovery link and unchanged password.
- Decision: Password reset must validate the token, persist the new password, revoke existing sessions, and only then consume/delete reset tokens.
- Consequences: Storage failures during password update keep the reset token usable for retry. Tests and contract audit must preserve the ordering so recovery never reports or enforces a terminal state before backend persistence succeeds.
