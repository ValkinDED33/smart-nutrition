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
- Decision: Release quality must verify `index.html`, `robots.txt`, `sitemap.xml`, and `manifest.webmanifest` as one SEO discovery contract. The sitemap may list only canonical public entry routes, while protected SPA screens and token routes must be blocked from crawler discovery.
- Consequences: Search discoverability cannot rely on one-off manual edits. Any route, domain, manifest, canonical URL, or crawler policy change must keep `npm run audit:seo` passing before release.

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
