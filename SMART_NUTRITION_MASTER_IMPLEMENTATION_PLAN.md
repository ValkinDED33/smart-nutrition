# Smart Nutrition Master Implementation Plan

Last audit: 2026-08-22  
Scope: repository audit against the Smart Nutrition Master Product Spec  
Rule: this document is the source of truth for what exists, what works, what is incomplete, and what must be finished before new feature expansion.

Audit source: current local repository snapshot on 2026-08-22, including the visible uncommitted working tree. Production deployment may lag behind this plan until Vercel/Render redeploy plus browser smoke checks prove the same behavior live.

## Current Verification Checkpoint

This checkpoint is the current truth for the next implementation decision. Do not treat local contract tests as proof of production readiness.

### Locally Proven

- `npm test -- --run src/shared/lib/remoteStateCache.test.ts src/shared/api/authRemote.test.ts src/features/profile/profileCloudSync.test.ts src/features/auth/authSlice.test.ts src/appStartupAuth.contract.test.ts src/pages/onboardingProfileFlow.contract.test.ts` passed with 60 focused P0 auth/session/profile tests.
- `npm test -- --run server/services/authService.test.mjs server/services/stateService.test.mjs server/runtime/errorHandler.test.mjs src/features/profile/profileCloudSync.test.ts src/appStartupAuth.contract.test.ts src/pages/onboarding/OnboardingFlow.contract.test.ts` passed with 79 focused server/profile/onboarding tests.
- `npm test -- --run server/scripts/liveAuditDiagnostics.test.mjs server/routes/health.routes.test.mjs server/lib/http.test.mjs` passed 20 focused checks for live-audit diagnostics, safe deployment fingerprint detection, exact `X-Request-Id` exposure, health route output, and HTTP/CORS behavior.
- `npm run server:check` passed with 0 failed required checks; local production config has MongoDB, `SameSite=None`, `Secure=true`, exact public CORS origins, and email providers `brevo, resend`.
- `npm run audit:contracts` passed 169 Smart Nutrition architecture/product contracts.
- `node --check server/scripts/audit-live-production.mjs; node --check server/scripts/audit-live-authenticated.mjs; node --check server/scripts/liveAuditDiagnostics.mjs; node --check server/scripts/audit-smart-nutrition-contracts.mjs` passed after extracting the shared live-audit diagnostics module.
- `npm run build` passed after the current auth/session/cache diagnostic work.
- `git diff --check` passed after the current auth/session/cache diagnostic work.
- Local code now scopes remote state cache to the authenticated user id, preventing user B, deleted-account, or legacy unowned snapshot data from poisoning user A/B profile-state saves after relogin, refresh-cookie restore, Safari restore, or shared-browser flows.
- Local code now attaches and preserves safe request diagnostics for unsafe auth/profile requests, refresh, and profile-state failures.

### Not Production-Proven

- `npm run audit:live` still failed on 2026-08-22 after the latest local checks because production Render returned `/api/health` with `deployment=missing commit=missing`, credentialed responses exposed `ACEH=missing`, and preflight did not allow `X-Request-Id`.
- `npm run audit:live:auth` still failed before authenticated smoke after the latest local checks because the same production fingerprint/CORS contract failed for both `https://smart-nutrition.club` and `https://www.smart-nutrition.club`; this shell also did not contain `SMART_NUTRITION_LIVE_SMOKE_EMAIL` and `SMART_NUTRITION_LIVE_SMOKE_PASSWORD`.
- Safari/iPhone registration/onboarding cannot be honestly marked fixed until the exact deployed backend/frontend revision passes the live auth smoke and a real Safari/iPhone or WebKit-equivalent registration -> verification -> onboarding finish -> reload restore journey.
- Current production evidence points to deployment drift or wrong backend revision, not yet to a proven remaining application-code defect.

### Required Next Evidence

1. Push/deploy the exact current backend and frontend source state.
2. Confirm `/api/health.deployment.provider === "render"` and an expected short commit fingerprint are visible.
3. Run `npm run audit:live`.
4. Run `npm run audit:live:auth` with safe smoke credentials.
5. Run one real browser journey on the deployed app: registration -> email verification -> onboarding finish -> reload -> profile data still present -> logout/login -> data still present.
6. Only after those pass may Auth move from PARTIAL to DONE.

## Status Legend

- DONE: implemented, wired to backend/cloud source of truth, tested, and production-usable.
- PARTIAL: real code exists and some flow works, but the module is incomplete or not fully proven.
- BROKEN: visible or promised behavior currently fails in normal use.
- PLACEHOLDER: UI/schema/copy exists, but production logic is shallow.
- MISSING: target product capability is not present.
- LEGACY: old flow exists and should be retired or migrated.
- NEEDS_REFACTOR: works in pieces, but architecture blocks a coherent production product.

## Repository Evidence Snapshot

This section is the evidence layer for the audit. It exists so future work does not rely on memory, screenshots, or optimistic claims.

### Frontend Route Map

| Surface | Current route evidence | Audit meaning |
|---|---|---|
| Public landing | `src/App.tsx`, `src/pages/LandingPage.tsx`, `src/pages/HomePage.tsx` | Public product entry exists, but visual/product magic must be unified with authenticated product, not treated as a separate marketing page. |
| Language setup | `/language`, `src/pages/LanguageSetupPage.tsx` | Language exists before registration, but post-login language prompts must not repeat after profile/session restore. |
| Auth | `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Real auth surfaces exist and are protected by `PublicRoute`; P0 proof is cross-browser persistence, not only form rendering. |
| Partner invite | `/partner-invite`, `src/pages/PartnerInvitePage.tsx` | Invite entry exists outside protected route; partner permission and email/QR acceptance need E2E proof. |
| Onboarding | `/onboarding/*`, `src/pages/OnboardingPage.tsx`, `src/pages/onboarding/*` | Multi-step flow exists; women/family branches and finish save remain P0/P1 areas. |
| App shell | `src/app/layouts/AppLayout.tsx`, `src/app/navigation/appNavigation.ts` | Main shell exists; needs one blueprint-consistent desktop/tablet/mobile experience. |
| Dashboard | `/dashboard`, `src/pages/DashboardPage.tsx` | Real dashboard exists; target is living AI workspace, not static calorie cards. |
| Food | `/meals`, `/scanner -> /meals?mode=barcode`, `/photo-meal -> /meals?mode=photo` | Scanner/photo entry aliases exist; acceptance requires tools open directly and save backend-confirmed records. |
| Recipes | `/recipes`, `src/pages/RecipesPage.tsx` | Recipe surface exists; detail/cook/save/add loop incomplete. |
| Community | `/community`, `src/pages/CommunityPage.tsx` | Community surface exists; social graph/posts/chat/moderation incomplete. |
| Assistant | `/coach`, `/ai -> /coach`, `/assistant -> /coach` | Assistant has a main page and aliases; must become the universal worker across all modules. |
| Progress | `/progress`, `src/pages/ProgressPage.tsx`, `/water -> /progress` | Progress/water surface exists; all counted metrics need clear legends and persistence. |
| Profile | `/profile`, `src/pages/ProfilePage.tsx` | Profile/settings/assistant customization exist; must separate normal-user simplicity from admin/operator detail. |
| Admin | `/admin`, `src/pages/AdminPage.tsx`, `ProtectedRoute roles={adminRouteRoles}` | Admin route exists; operational metadata, online users, sessions, and audit visibility need completion. |

### Backend API Surface

| Domain | Current backend evidence | Audit meaning |
|---|---|---|
| Health/diagnostics | `server/routes/health.routes.mjs`, `server/runtime/diagnostics.mjs` | Runtime diagnostics exist; production errors still need request IDs/root-cause payloads for faster triage. |
| Auth | `server/routes/auth.routes.mjs`, `server/services/authService.mjs`, `server/runtime/authCookies.mjs` | Registration, verification, login, session, refresh, logout, profile-state routes exist. P0 is cross-browser cookie/session/profile save proof. |
| State/storage | `server/routes/state.routes.mjs`, `server/controllers/state.controller.mjs`, `server/services/stateService.mjs`, `server/storage/{mongo,postgres,sqlite}.mjs` | Cloud-backed state exists for profile, meal, water, fridge, community, companion; this is the canonical source-of-truth layer. |
| Meals/products/photo | `/api/products/search`, `/api/meal/product-intake`, `/api/photo-analysis`, `server/services/productLookupService.mjs`, `server/services/photoAnalysisService.mjs` | Real product/photo flow exists; quality gate must prove readable product facts for all major categories. |
| Reminders/tasks | `server/routes/reminder.routes.mjs`, `server/services/reminderService.mjs`, `server/services/medicationReminderService.mjs` | Reminders exist; universal event/task/calendar/birthday model is not complete. |
| AI | `server/routes/ai.routes.mjs`, `server/agent/*`, `server/services/ai/*` | AI runtime and tool execution exist; supported actions need backend receipts and site/Telegram parity. |
| Telegram | `server/routes/telegram.routes.mjs`, `server/services/telegramService.mjs`, `server/services/telegramPhotoIntakeService.mjs` | Telegram integration exists; full worker behavior for arbitrary tasks/photos/health/prescriptions is incomplete. |
| Family/partner | `server/routes/partner.routes.mjs`, `server/services/partnerService.mjs` | Invite foundation exists; permissions and partner lifecycle dashboard need proof. |
| Admin | `server/routes/admin.routes.mjs`, `server/controllers/admin.controller.mjs` | Admin backend exists; production admin center still lacks full operational visibility. |
| Observability/errors | `server/routes/clientError.routes.mjs`, `src/app/runtime/clientErrorReporting.test.ts`, Sentry/PostHog deps | Client error reporting exists; DevTools-clean release gate is not complete. |

### Canonical Storage Map

| State | Canonical owner | Current client role | Risk |
|---|---|---|---|
| User/auth/session | Backend auth storage and HttpOnly cookies | Session hint only; no token truth in JS | Safari/iOS cookie and refresh behavior must be proven. |
| Profile/onboarding | Backend profile-state through auth/state services | Draft recovery only until cloud confirmation | Finish save 500/503/409 can block onboarding. |
| Meals/products | Backend meal/product state and product intake routes | UI drafts and pending states | Product cards and nutrition facts can diverge if normalization is not centralized. |
| Water | Backend water state/routes | Fast UI pending state | Glasses/progress can regress visually if dashboard/progress models diverge. |
| Reminders/tasks | Backend reminder service and Telegram delivery | Local form state only | Natural language reminders still need one complete structured model. |
| AI memory/actions | Backend AI/agent/repository plus profile context | UI transcript and receipt rendering | Assistant must not claim saved actions without backend receipts. |
| Family/partner | Backend partner invite/permission service | Invite UI and QR/email helpers | Permissioned shared state is not fully proven. |
| Characters/skins | Target should be backend entitlement/inventory | Current UI selection/customization | Shop/free-premium rules are not production-backed. |

### Local Persistence Classification

Allowed local-only data in current repo: language/theme preferences, auth session hint, device/sync hints, temporary onboarding draft recovery, stale-build/offline recovery, and UI-only transient state.

Forbidden local-only truth: auth, profile completion, meals, product add, water, reminders, Telegram binding, partner permissions, AI completed actions, health records, rewards, premium entitlements. Any future code that makes these local-only is a P0/P1 architecture regression.

### Test/Audit Surface

Existing proof is broad but mostly unit/contract level: `server/**/*.test.mjs`, `src/**/*.test.ts`, `src/**/*.contract.test.ts`, `server/scripts/audit-*.mjs`. Strong areas include auth service/cookies, config validation, state repositories, meal/water persistence contracts, barcode/product/photo models, assistant contracts, Telegram service tests, client persistence, service worker recovery, and language coverage.

Missing proof: full Playwright/browser E2E across Chromium, Firefox, and WebKit/Safari-like runtime for registration, verification, onboarding finish, reload restore, scanner/photo add, assistant action receipt, Telegram link flows, women-health/family flows, and DevTools-clean screens.

## Executive Summary

Smart Nutrition is no longer an empty prototype. The repository contains real production foundations: cloud auth, email verification, refresh sessions, backend profile state, meal/water/product flows, barcode scanning, photo meal drafts, Telegram bot commands, AI runtime tools, women-health structures, partner invites, admin routes, localization, PWA/offline handling, and a large test base.

The product is still not a 1000% finished MASTER SPEC product. The largest gap is not the absence of code; it is fragmentation. Many features exist as separate cards, tabs, local UI modules, or partially connected backend endpoints. The assistant/character concept, women/family ecosystem, Telegram worker behavior, health tools, organizer, and premium shop are not yet one coherent production experience.

The highest-risk blocker remains P0 Auth and onboarding persistence across browsers. Chrome desktop and Android paths have worked, but Safari/iPhone and some Firefox/Linux cases have shown profile-state/session persistence failures. Until registration -> verification -> session -> onboarding -> cloud profile save -> reload restore is proven across current browsers, Auth cannot be marked DONE.

## Module Status Matrix

| Module | Status | Production Verdict |
|---|---:|---|
| Core / Platform | PARTIAL | Real Vite/React/Node backend foundation exists, but product shell is still fragmented. |
| Auth | PARTIAL | Strong backend flow exists; cross-browser onboarding/session restoration is not fully proven. |
| Registration | PARTIAL | Multi-step UX and availability checks exist; Safari/iPhone failure path still blocks DONE. |
| Email verification | PARTIAL | Verification flow exists; provider failover and delivery diagnostics need production proof. |
| Session / refresh | PARTIAL | HttpOnly refresh rotation exists; device/browser restore matrix is incomplete. |
| Onboarding | PARTIAL | Many steps exist; women/family branches and finish persistence remain fragile. |
| Profile | PARTIAL | Cloud profile actions exist; settings UX and profile-state conflicts need hardening. |
| Navigation | NEEDS_REFACTOR | Routes exist, but IA does not yet match the unified AI product blueprint. |
| Responsive shell | PARTIAL | Desktop/mobile shell exists; assistant overlay still blocks content on some screens. |
| Dashboard | PARTIAL | Real daily dashboard exists; not yet the final living assistant workspace. |
| Food | PARTIAL | Real scanner/search/photo/manual flows exist; still needs unified product truth everywhere. |
| Diary | PARTIAL | Meal entry state exists; diary is not yet a complete day story/timeline. |
| Search | PARTIAL | Backend product search exists; fallbacks and empty states need stronger acceptance gates. |
| Barcode | PARTIAL | Real scanner exists; result confirmation and information table must be consistent for all products. |
| Photo Analysis | PARTIAL | Real photo draft flow exists; recognition quality and review UX need stricter gates. |
| Manual products | PARTIAL | Manual submission/moderation exists; catalog lifecycle needs admin closure. |
| Water | PARTIAL | Cloud water tracker and glasses exist; must remain visible across dashboard/progress regressions. |
| Recipes | PARTIAL | Recipe cards and flows exist; production recipe system is incomplete. |
| Recipe Detail | PARTIAL | Detail pieces exist; dedicated complete detail flow is not proven. |
| Fridge | PARTIAL | Fridge state exists; recipe suggestion loop is shallow. |
| AI Runtime | PARTIAL | Backend assistant runtime and provider order exist; worker reliability needs receipts. |
| AI Tools | PARTIAL | Tools for meals, water, reminders, weather, exchange, status exist; tool coverage is incomplete. |
| AI Memory | PARTIAL | Memory/context tests exist; production user-facing memory behavior is not complete. |
| Assistant UI | NEEDS_REFACTOR | Assistant appears globally, but not yet the fixed living worker across the whole product. |
| Telegram | PARTIAL | Bot commands, localization, photo intake foundations exist; full assistant-worker behavior is incomplete. |
| Organizer | PARTIAL | Reminders/tasks pieces exist; no complete calendar/task/list suite. |
| Tasks | PARTIAL | Task/reminder commands exist; task product module is incomplete. |
| Reminders | PARTIAL | Backend reminders and Telegram commands exist; flexible event-relative reminders need completion. |
| Calendar | PLACEHOLDER | Calendar intent exists; production calendar is not complete. |
| Birthdays | MISSING | Target birthday reminder flow is not implemented as a full module. |
| Shopping Lists | MISSING | Target shared shopping list is absent. |
| Health | PARTIAL | Health data concepts exist; full health center is not finished. |
| Blood Pressure | PARTIAL | Telegram photo classification exists; confirmed BP ledger/charts are incomplete. |
| Measurements | PARTIAL | Weight/body/progress pieces exist; unified measurements module is incomplete. |
| Tests / Analyses | PLACEHOLDER | Analysis/lab language exists; real lab-tracking module is missing. |
| Women's Health | PARTIAL | Women-health onboarding/page exists; daily female lifecycle product is incomplete. |
| Cycle | PLACEHOLDER | Basic fields exist; real cycle calendar/prediction flow is not complete. |
| Trying to conceive | PARTIAL | TTC intent exists; production planning flow is incomplete. |
| Pregnancy | PARTIAL | Week/day/date estimates and partner docs exist; full weekly content and partner parity incomplete. |
| Postpartum | PLACEHOLDER | Target mode exists in docs/fields; product flow is shallow. |
| Family | PARTIAL | Family spec and invite structures exist; full family ecosystem is incomplete. |
| Partner | PARTIAL | Partner invite routes exist; partner interface/permissions need completion. |
| Invite link | PARTIAL | Link/code flow exists; email invite acceptance needs production proof. |
| QR | PARTIAL | QR invite concept exists; complete scan/join UX needs proof. |
| Permissions | PARTIAL | Permission boundaries are planned; actual granular partner access is incomplete. |
| Progress | PARTIAL | Progress cards/charts exist; overall progress must cover all counted domains. |
| XP | PARTIAL | Gamification pieces exist; product-wide XP rules are incomplete. |
| Levels | PARTIAL | Companion/progress levels exist; level economy is incomplete. |
| Achievements | PARTIAL | Achievement UI/tests exist; full achievement engine is incomplete. |
| Coins | PARTIAL | Currency-like concepts exist; ledger/store economy is not production-ready. |
| Community | PARTIAL | Community state exists; complete social product is incomplete. |
| Friends | PLACEHOLDER | Friend concept exists; full friend graph is incomplete. |
| Chat | PLACEHOLDER | Assistant chat exists; community chat is not complete. |
| Posts | PLACEHOLDER | Community post surface is shallow. |
| Community Recipes | PARTIAL | Recipe/community overlap exists; moderation and sharing are incomplete. |
| Likes | PLACEHOLDER | Social reaction logic is not fully proven. |
| Saved | PARTIAL | Saved/favorites exist in food; not unified across product. |
| Moderation | PARTIAL | Admin food moderation exists; community moderation incomplete. |
| Characters | NEEDS_REFACTOR | Character shop/skins exist; default assistant is not consistently applied project-wide. |
| Classic Assistant | PARTIAL | Free robot default exists in code/tests; visual result is inconsistent in production. |
| Character Shop | PLACEHOLDER | Shop UI exists; unlock/purchase/equip economy is incomplete. |
| Skins | PARTIAL | Skin data/UI exists; paid/free rules need real backend contract. |
| Free / Premium | PLACEHOLDER | Premium labels exist; no production subscription contract. |
| Billing readiness | MISSING | No complete billing/provider implementation found. |
| Settings | PARTIAL | Settings/profile tabs exist; normal-user/admin separation needs polish. |
| Notifications | PARTIAL | Browser/Telegram reminders exist; unified notification center incomplete. |
| Integrations | PARTIAL | Telegram and provider envs exist; integration health UI incomplete. |
| Admin Center | PARTIAL | Admin routes/users/stats exist; operational admin tooling is incomplete. |
| Localization | PARTIAL | EN/UK/PL/RU-like content exists; broken-key and mixed-language regressions remain. |
| Accessibility | PARTIAL | UI uses semantic controls in places; aria-hidden/focus warnings remain. |
| Motion | PARTIAL | Framer/motion exists; final blueprint-level magic is incomplete. |
| System states | PARTIAL | loading/saving/failed states exist; some are misleading or not actionable enough. |
| Offline handling | PARTIAL | PWA/offline recovery exists; false offline and stale chunks need E2E proof. |
| Observability | PARTIAL | Sentry/PostHog/client error routes exist; root-cause diagnostics need expansion. |
| Security | PARTIAL | Cookies, CSRF, headers, rate limits exist; full release security gate needs proof. |
| Tests | PARTIAL | Large unit/contract suite exists; browser E2E is missing. |
| E2E | MISSING | No complete production browser journey gate found. |
| DevTools cleanliness | BROKEN | User-reported console errors/warnings show this is not clean yet. |

## P0 Auth Deep Audit

### Current Flow

1. Registration UI collects language, theme, nickname, email, password, and password confirmation.
2. Nickname/email availability checks call the backend before advancing.
3. Backend `register` creates an unverified user, normalizes identity fields, hashes the password, creates a verification token, and sends email.
4. Email verification consumes the token, marks the user verified, creates a refresh session, and sets HttpOnly auth cookies.
5. Frontend session restore calls `/api/auth/session` only when a session hint exists, preventing guest public pages from spamming auth.
6. Refresh uses `/api/auth/refresh`, rotates refresh tokens, and returns public user data while keeping tokens out of JSON.
7. Onboarding finish saves profile and user state through backend profile-state actions.
8. Reload should restore session from cookies and then restore profile-backed state.

### Exact P0 Auth Trace

| Step | Frontend owner | Backend owner | Source of truth | Current status | P0 proof required |
|---|---|---|---|---|---|
| 1. Public entry | `src/pages/LandingPage.tsx`, `src/pages/LanguageSetupPage.tsx` | none | Client preference only | PARTIAL | Guest page must not spam `/api/auth/session`; language/theme choice must carry into registration. |
| 2. Nickname/email availability | `src/pages/RegisterPage.tsx`, `src/shared/api/authRemote.ts` | `POST /api/auth/availability`, `authService.checkRegistrationAvailability` | Backend user repository | PARTIAL | Taken nickname/email shows a clear X; available values show a clear check; no false green on network failure. |
| 3. User creation | `RegisterPage`, `remoteAuthProvider.register` | `POST /api/auth/register`, `authService.register` | Backend user repository | PARTIAL | Creates exactly one unverified user, no duplicate account from double tap, no fake success if email provider fails. |
| 4. Email delivery | Register success/resent email UI | `emailService`, `brevoService`, Resend fallback | Email provider + backend verification token | PARTIAL | Primary Brevo and fallback Resend errors are structured; user sees retry/open mail, not password form plus sent state. |
| 5. Verification | `src/pages/VerifyEmailPage.tsx` | `POST /api/auth/verify-registration` | Backend verified user + session | PARTIAL | Token marks user verified, creates session, sets HttpOnly cookies, returns no raw refresh token. |
| 6. Session cookie write | Browser response handling | `sendAuthSession`, `server/runtime/authCookies.mjs`, `server/lib/http.mjs` | HttpOnly cookies | PARTIAL | `SameSite=None; Secure; HttpOnly; Path=/` works on smart-nutrition.club/www across Safari/Chrome/Firefox. |
| 7. Session restore | `authSlice`, `remoteAuthProvider.restoreSession` | `GET /api/auth/session`, fallback `POST /api/auth/refresh` | Backend sessions table/collection | PARTIAL | Reload restores user and cloud snapshot without asking language/onboarding again. |
| 8. Onboarding save | `OnboardingFinishPage`, `useProfileCloudAction`, `profileCloudSync` | `PATCH /api/auth/profile-state` | Backend profile-state snapshot + user profile | BROKEN risk | Saves profile atomically or returns actionable 409/503 without losing draft; no 500 black box. |
| 9. Conflict recovery | `cloudConflictRecovery`, `authRemote` diagnostics | `getSyncContext`, state repository versioning | Backend snapshot version | PARTIAL | 409 rebases safely and lets user retry without data loss. |
| 10. Subsequent login | `LoginPage`, `authSlice` | `POST /api/auth/login`, `POST /api/auth/refresh` | Backend sessions/profile snapshot | PARTIAL | Existing verified user returns the same profile, women/family flags, assistant preferences, meals/water/progress. |

### P0 Browser/Protocol Checklist

| Area | What must be checked | Current verdict |
|---|---|---|
| Cookies | `SameSite=None`, `Secure=true`, `HttpOnly`, domain/path, access + refresh rotation, Safari ITP behavior | PARTIAL; config/tests exist, device proof missing. |
| CORS | Exact `Origin` match for `https://smart-nutrition.club` and `https://www.smart-nutrition.club`; no newline/space; `credentials: include`; preflight must allow `X-Request-Id`; credentialed responses must expose browser-readable `X-Request-Id` diagnostics | BROKEN live; local code/tests include and expose `X-Request-Id`, but current Render response does not prove the deployed backend is on that revision. |
| CSRF | Unsafe methods accept valid same-site/cross-site origins and reject hostile origins without breaking Safari/Telegram WebView | PARTIAL; needs WebKit/iOS smoke. |
| Origin/Referer | Safari/private modes can omit/alter headers; backend must distinguish safe app origins from missing hostile context | NEEDS PROOF. |
| Storage assumptions | `auth-session-hint` and onboarding draft cannot become canonical auth/profile truth | PARTIAL; contract tests exist, E2E missing. |
| Race conditions | register double tap, verify reload, session restore + profile save, refresh rotation during onboarding finish | NEEDS PROOF. |
| Timeouts/offline | Render wake/provider delay must not become false permanent offline or hidden 503 | PARTIAL; diagnostics exist, live flow missing. |
| Error shape | 409/503/profile-state sync errors preserve public diagnostic code/request id and no stack leak | PARTIAL; error handler tests exist, live DevTools still showed 503. |

### What Exists Now

- Backend auth routes: `server/routes/auth.routes.mjs`
- Cookie runtime: `server/runtime/authCookies.mjs`
- Auth service/session rotation/profile-state save: `server/services/authService.mjs`
- Server CORS/CSRF/security/error handling: `server/index.mjs`
- Frontend remote auth client: `src/shared/api/authRemote.ts`
- Auth slice/session restore/push state: `src/features/auth/authSlice.ts`
- Registration UI: `src/pages/RegisterPage.tsx`
- Verify email UI: `src/pages/VerifyEmailPage.tsx`
- Onboarding finish save: `src/pages/onboarding/OnboardingFinishPage.tsx`
- Profile cloud action helpers: `src/features/profile/profileCloudSync.ts`, `src/features/profile/useProfileCloudAction.ts`

### What Works

- Chrome Desktop: reported working.
- Chrome Android: reported working.
- Opera Android: reported working.
- Firefox Windows: registration reportedly passed.
- Backend avoids returning raw tokens in JSON.
- Refresh token rotation exists.
- HttpOnly cookie strategy exists.
- SameSite/Secure cookie config exists.
- CORS allowlist and credentialed requests exist.
- Local CORS now exposes safe browser-readable diagnostics (`X-Request-Id`, rate-limit/retry headers) without echoing arbitrary requested headers.
- CSRF checks for unsafe cross-site mutations exist.
- Frontend no longer treats local browser auth as canonical truth.

### Not DONE Yet

- Safari/iPhone has shown profile save/session persistence failures.
- Firefox/Linux had previous issues.
- `/api/auth/profile-state` has produced 500/503 in production screenshots.
- 2026-08-22 live authenticated audit, run without smoke credentials, still proved a deploy/protocol gap for both trusted domains. `OPTIONS /api/auth/profile-state` returns `status=204`, correct `ACAO`/`ACAC`, and `ACAM=GET, POST, PUT, PATCH, DELETE, OPTIONS` for `https://smart-nutrition.club` and `https://www.smart-nutrition.club`, but live `ACAH=Content-Type, Authorization, X-Device-Id, X-State-Version` omits `X-Request-Id` and `ACEH=missing` on both. Local code contains and exposes the header, so production must be redeployed/verified before Auth can move toward DONE.
- 2026-08-22 live public audit now requires `/api/health.deployment.provider === "render"` as a safe deployment fingerprint and browser-readable `X-Request-Id` diagnostics. Current production `/api/health` returns `status=200 ok=true mode=remote-cloud auth=httpOnly-cookie-session storage=mongodb email=true deployment=missing commit=missing`, proving the backend live response is not yet on the local contract.
- User-facing errors are better than fake success, but still do not expose enough root-cause context for quick diagnosis.
- Cross-browser acceptance is not automated.

### P0 Risk Areas To Verify

- Cookies: `SameSite=None`, `Secure=true`, `HttpOnly`, domain/path, and cross-site behavior between `smart-nutrition.club`, `www.smart-nutrition.club`, Vercel, and Render.
- CORS: exact origin normalization, no trailing newline/space regressions, credentialed response headers.
- CSRF: Origin/Referer behavior on Safari and Telegram/iOS WebView.
- Refresh: rotation race when session restore and profile save happen close together.
- Timeouts: false offline handling when Render wakes or email/provider calls delay.
- Storage assumptions: session hint and onboarding draft must never become source of truth.
- Profile-state conflicts: 409 conflict handling must rebase without losing user input.
- 500/503 mapping: backend must return structured diagnostic codes and request IDs.

### Auth Acceptance Criteria

Auth is DONE only when:

- A new user can register on Chrome Desktop, Firefox Desktop, Chrome Android, Opera Android, Safari iPhone, and iOS WebView/Safari-like runtime.
- Verification email arrives or a clear retry/provider error is shown.
- After verification, session cookies are present and valid.
- Onboarding can finish once without 409/500/503.
- Reload preserves auth and all onboarding answers.
- Profile page matches onboarding data.
- Logout/login restores the same profile.
- Console has no unexpected auth errors after successful flow.
- Failed backend save never claims success.

## Module Audit Details

## Module Source Map

This table is the quick index from MASTER SPEC modules to current repository evidence. It is intentionally practical: when a module enters implementation, start from these files and add the missing proof named here.

| Module | Primary frontend files | Primary backend/storage files | Existing proof | Missing proof |
|---|---|---|---|---|
| Core / Platform | `src/App.tsx`, `src/main.tsx`, `src/app/layouts/AppLayout.tsx`, `src/app/navigation/appNavigation.ts`, `src/shared/lib/registerServiceWorker.ts` | `server/index.mjs`, `server/routes/index.mjs`, `server/runtime/*`, `server/config.mjs` | config/runtime/security/static/service worker/audit tests | Full browser release gate and visual regression. |
| Auth | `src/features/auth/authSlice.ts`, `src/shared/api/authRemote.ts`, `src/routes/{PublicRoute,ProtectedRoute}.tsx` | `server/routes/auth.routes.mjs`, `server/services/authService.mjs`, `server/runtime/authCookies.mjs`, `server/repositories/*Auth*` | auth service, cookies, token, remote API, startup auth tests | Chromium/Firefox/WebKit registration-to-reload E2E. |
| Registration | `src/pages/RegisterPage.tsx`, `src/pages/onboardingProfileFlow.contract.test.ts` | `POST /api/auth/register`, `POST /api/auth/availability` | register page contracts, availability tests | Double-submit, provider failure, mobile Safari proof. |
| Email verification | `src/pages/VerifyEmailPage.tsx`, `src/pages/authTokenUrl.contract.test.ts` | `POST /api/auth/verify-registration`, `POST /api/auth/resend-verification`, `server/services/{emailService,brevoService}.mjs` | email/brevo service tests, env tests | Live provider failover and inbox/open-mail UX E2E. |
| Session / refresh | `src/features/auth/authSlice.ts`, `src/shared/lib/authSessionHint.ts`, `src/shared/lib/clientPersistence.ts` | `GET /api/auth/session`, `POST /api/auth/refresh`, sessions collections/tables | refresh restore tests, cookie tests | Safari/iOS restore, refresh race, cookie domain proof. |
| Onboarding | `src/pages/OnboardingPage.tsx`, `src/pages/onboarding/*`, `src/features/onboarding/model/onboardingDraft.ts` | `PATCH /api/auth/profile-state`, `stateService.saveProfileStateWithUser` | onboarding contracts, draft tests | Full finish save/reload by lifecycle path. |
| Profile | `src/pages/ProfilePage.tsx`, `src/features/profile/*` | `PATCH /api/auth/profile`, `PATCH /api/auth/profile-state`, state repositories | profile cloud sync, settings persistence tests | Normal/admin UX separation and conflict E2E. |
| Navigation / Responsive shell | `src/app/layouts/AppLayout.tsx`, `src/app/navigation/appNavigation.ts`, `src/widgets/GlobalAssistantLayer.tsx` | none direct | navigation/global layer/model tests | Viewport screenshots, assistant non-overlap, keyboard/safe-area tests. |
| Dashboard | `src/pages/DashboardPage.tsx`, `src/features/assistant/EcosystemPulse.tsx`, `src/features/companion/*` | `/api/state`, `/api/stats/*`, `/api/water/*`, `/api/meals/today` | dashboard-adjacent assistant/progress tests | Living dashboard E2E with no console errors. |
| Food / Diary | `src/pages/MealsPage.tsx`, `src/features/meal/FoodCommandCenter.tsx`, `src/features/meal/*` | `/api/meals`, `/api/meal-entries`, `/api/meal-state`, state repositories | meal save/restore/cloud sync tests | Scan/search/photo/manual all add to one diary and reload. |
| Search | `src/features/meal/ProductSearch.tsx`, `src/shared/api/products.ts` | `GET /api/products/search`, `productLookupService` | product lookup/search UI tests | Empty/error/rate-limit/live catalog E2E. |
| Barcode | `src/features/meal/BarcodeScanner.tsx` | `productLookupService`, `/api/meal/product-intake` | barcode model/layout tests | Camera permission/iOS/WebView scan-to-add proof. |
| Photo Analysis | `src/features/meal/photo/*` | `/api/photo-analysis`, `photoAnalysisService`, `server/services/photo/*` | photo draft/vision/fallback tests | Real image categories, poor photo guidance, Telegram/photo parity. |
| Manual products | `src/features/platform/catalogContributionModel.ts`, meal product UI | `/api/foods/submissions`, `/api/foods/duplicates`, admin food routes | catalog contribution/admin tests | Moderation lifecycle and catalog status E2E. |
| Water | `src/features/water/*`, `src/pages/ProgressPage.tsx` | `/api/water`, `/api/water-state`, state repositories | water cloud/save/persistence tests | Dashboard/progress/mobile glass regression tests. |
| Recipes / Detail / Fridge | `src/pages/RecipesPage.tsx`, `src/features/recipe/*`, `src/features/fridge/*` | `/api/fridge-state`, meal/product routes | fridge cloud/planner/save tests, recipe community contracts | Recipe detail/cook/save/add-to-diary E2E. |
| AI Runtime / Tools / Memory | `src/shared/api/assistant.ts`, `src/features/assistant/*`, `src/assistant/engine/*` | `server/routes/ai.routes.mjs`, `server/agent/*`, `server/services/ai/*`, AI repositories | assistant runtime/context/memory/action tests | Browser + Telegram action receipt E2E for every supported tool. |
| Assistant UI | `src/widgets/GlobalAssistantLayer.tsx`, `src/features/profile/{AssistantCustomizationCard,CompanionShopCard}.tsx`, `src/features/assistant-3d/*` | assistant/companion state repositories | global layer, companion render, shop/manifest tests | Whole-product fixed assistant visual and non-blocking motion proof. |
| Telegram | profile Telegram cards, shared assistant manifest | `server/routes/telegram.routes.mjs`, `server/services/{telegramService,telegramPhotoIntakeService}.mjs` | Telegram service/photo/medication tests | Text/photo/task/BP/prescription save flows and site parity. |
| Organizer / Tasks / Reminders | `src/features/profile/ReminderManagementCard.tsx`, habit reminder widgets | `server/routes/reminder.routes.mjs`, `server/services/{reminderService,medicationReminderService}.mjs` | reminder storage/routes/service tests | Calendar windows, birthdays, shopping lists, after-meal reminders. |
| Health / BP / Measurements / Analyses | `src/pages/ProgressPage.tsx`, `src/features/profile/SupplementRecommendationCard.tsx`, progress/body models | health data currently spread through state, Telegram photo intake, progress storage | body/weight/progress/BP intake tests | Typed health record model, BP graph, lab storage, report generation. |
| Women's Health | `src/pages/onboarding/OnboardingWomenHealthPage.tsx`, `src/features/profile/WomenHealthOverviewCard.tsx`, `src/domain/profile/{womenHealth,familyLifecycle,babyPreview}.ts` | profile-state storage, partner pregnancy endpoint | women-health domain/profile card tests | Female lifecycle E2E and product-wide mode propagation. |
| Family / Partner | `src/pages/PartnerInvitePage.tsx`, family profile/onboarding pieces | `server/routes/partner.routes.mjs`, `server/services/partnerService.mjs` | partner service/page contracts | QR/email invite, existing/new user join, permission boundaries. |
| Progress / XP / Achievements / Coins | `src/pages/ProgressPage.tsx`, `src/companion/{progression,rewards,achievements,inventory,catalog}/*`, `src/features/companion/*` | companion-state/profile-state storage | companion progression/reward/achievement tests | Backend reward ledger, coin economy, shop entitlement tests. |
| Community | `src/pages/CommunityPage.tsx`, `src/features/community/*`, `src/features/meal/recipeCommunityContract.test.ts` | community-state storage, admin moderation routes | community cloud/report/slice tests | Posts/friends/chat/likes/saved/moderation E2E. |
| Characters / Shop / Skins | `src/features/profile/CompanionShopCard.tsx`, `src/features/profile/AssistantCustomizationCard.tsx`, `src/features/assistant/assistantWorkerTools.json` | target backend entitlement missing; companion-state exists | shop/manifest/global assistant tests | Equip persistence across all screens, premium lock, animation state machine. |
| Free / Premium / Billing | premium labels in profile/shop | no complete billing provider found | none significant | Payment provider, entitlements, webhooks, receipt/cancel/refund tests. |
| Settings / Notifications / Integrations | `src/features/profile/*`, `src/shared/lib/notifications.ts`, Telegram cards | Telegram routes, reminder routes, admin routes | notification/profile/telegram model tests | Permission prompts, integration health, admin/user split E2E. |
| Admin Center | `src/pages/AdminPage.tsx` | `server/routes/admin.routes.mjs`, `server/controllers/admin.controller.mjs`, storage admin stats | admin controller/client error/admin tests | Online users, sessions, created/last active, role/ban/delete E2E. |
| Localization | `src/i18n/*`, `src/shared/language/*`, language UI | Telegram localized buttons | language coverage, section tab localization tests | No broken keys/mixed-language screenshots across flows. |
| Accessibility | shared UI, layout, MUI controls, assistant layer | none direct | partial component contracts | Aria/focus audit on all screens, no `aria-hidden` focus warnings. |
| Motion / System states / Offline | `src/shared/components/ErrorBoundary.tsx`, `src/shared/lib/errorRecovery.ts`, `src/shared/lib/sound.ts`, motion components | client error routes, runtime status | error recovery, service worker, sound tests | Reduced-motion, no overlay blocking, no false offline, DevTools-clean E2E. |
| Observability / Security / Tests / E2E | client error reporting, audit scripts | security headers, rate limits, error handler, diagnostics | many unit/contract/audit tests | One command browser E2E and production smoke matrix. |

### Core / Platform

STATUS: PARTIAL

1. Current: Vite React app, Node backend, Render/Vercel deployment config, PWA files, Docker files, audit scripts, docs, tests.
2. Works: app builds and server routes are structured; backend/source-of-truth direction exists.
3. Keep: Vite/React/Node split, backend route grouping, audit scripts, source-of-truth rule.
4. Visual incomplete: product shell looks different across pages and not fully blueprint-driven.
5. Misleading UI: some surfaces imply complete ecosystem when logic is partial.
6. Divergence: MASTER SPEC expects one living AI ecosystem, not feature warehouse.
7. Missing: full E2E gate and one cohesive product shell.
8. Broken chains: product state can fail at profile-state and leave onboarding stuck.
9. Duplicate logic: route-level feature cards and profile/dashboard summaries repeat assistant claims.
10. Architecture risk: independent modules can continue drifting.
11. Files: `package.json`, `vite.config.ts`, `vercel.json`, `server/index.mjs`, `src/App.tsx`, `src/app/layouts/AppLayout.tsx`, `docs/*`.
12. Existing tests: unit/contract/audit scripts across `src/**/*.test.*`, `server/**/*.test.*`, `server/scripts/*`.
13. Missing tests: cross-browser E2E and clean-console journeys.
14. Acceptance: one deployable app with passing build/lint/test/audits and no master-flow browser regressions.

### Auth, Registration, Email Verification, Session / Refresh

STATUS: PARTIAL

1. Current: full auth routes, verification, refresh sessions, cookies, CSRF/CORS, frontend remote auth client.
2. Works: normal registration works on several browsers; token rotation and HttpOnly cookies exist.
3. Keep: backend-only auth source of truth, no token JSON, refresh rotation, no fake local auth.
4. Visual incomplete: verification and failure states exist but diagnostics remain shallow.
5. Misleading UI: retry buttons can repeat provider/backend failures without explaining root cause.
6. Divergence: MASTER SPEC requires registration to work for a non-technical user on current browsers.
7. Missing: automated Chrome/Firefox/WebKit/Safari-like E2E gate.
8. Broken chains: profile-state save after onboarding can fail with 500/503.
9. Duplicate logic: session hint/draft/state restore touches auth, onboarding, and profile.
10. Architecture risk: profile persistence is too coupled to auth completion.
11. Files: `server/routes/auth.routes.mjs`, `server/services/authService.mjs`, `server/runtime/authCookies.mjs`, `server/index.mjs`, `src/shared/api/authRemote.ts`, `src/features/auth/authSlice.ts`, `src/pages/RegisterPage.tsx`, `src/pages/VerifyEmailPage.tsx`.
12. Existing tests: auth service, auth cookies, auth remote, auth slice, register page contracts, CSRF/security tests.
13. Missing tests: full registration -> verify -> onboarding -> reload E2E matrix.
14. Acceptance: P0 Auth criteria above pass on all target browsers/devices.

### Onboarding / Profile

STATUS: PARTIAL

1. Current: multi-step onboarding, profile cloud action save, women-health branch, finish retry/back behavior.
2. Works: answers can be collected and saved through cloud when backend path is healthy.
3. Keep: backend-confirmed success only, preserved draft on failed save, no fake completion.
4. Visual incomplete: assistant overlay can cover fields; women/family branches are not consistently discoverable.
5. Misleading UI: user can be told enough info exists while profile-state save fails.
6. Divergence: onboarding must feel magical and adaptive, not a technical questionnaire.
7. Missing: complete lifecycle branch for female/pregnancy/postpartum/baby/partner choices.
8. Broken chains: finish save -> profile-state -> dashboard can fail.
9. Duplicate logic: default bootstrap values in registration and profile defaults risk mismatched profile truth.
10. Architecture risk: onboarding state, profile state, and assistant personalization are split.
11. Files: `src/pages/onboarding/*`, `src/features/profile/*`, `src/features/auth/authSlice.ts`, `server/controllers/state.controller.mjs`.
12. Existing tests: onboarding flow contracts, profile cloud action tests, profile state tests.
13. Missing tests: female account end-to-end, skip/continue flow, Safari profile finish.
14. Acceptance: every selected path saves to cloud, reloads, and unlocks correct modules without repeated language/setup prompts.

### Navigation / Responsive Shell / Dashboard

STATUS: NEEDS_REFACTOR

1. Current: app routes, protected layouts, desktop navigation, mobile bottom nav, global assistant layer, dashboard.
2. Works: navigation opens main sections and mobile bottom nav exists.
3. Keep: route guards, responsive shell, mobile bottom nav concept.
4. Visual incomplete: landing/dashboard/coach/profile do not yet share the final AI cockpit blueprint.
5. Misleading UI: route aliases imply scanner/photo modules, but some actions still require searching inside pages.
6. Divergence: MASTER SPEC wants one living AI surface with assistant-led flows.
7. Missing: complete desktop/tablet/mobile blueprint parity.
8. Broken chains: global assistant can cover core controls.
9. Duplicate logic: dashboard cards duplicate assistant/progress summaries.
10. Architecture risk: per-page custom layouts make pixel-level consistency hard.
11. Files: `src/App.tsx`, `src/app/layouts/AppLayout.tsx`, `src/app/navigation/appNavigation.ts`, `src/pages/DashboardPage.tsx`, `src/widgets/GlobalAssistantLayer.tsx`.
12. Existing tests: layout/navigation/assistant layer tests.
13. Missing tests: visual regression and mobile viewport E2E.
14. Acceptance: all primary routes are reachable, assistant never blocks inputs, shell matches fixed blueprint across desktop/tablet/mobile.

### Food / Diary / Search / Barcode / Photo Analysis / Manual Products / Water

STATUS: PARTIAL

1. Current: food command center, barcode scanner, product search, photo meal assistant, manual product submissions, water tracker.
2. Works: real backend product lookup, scan result cards, editable photo drafts, cloud meal/water persistence.
3. Keep: canonical backend-confirmed add flow, honest review states, no hard-coded photo result templates.
4. Visual incomplete: product nutrition facts are not uniformly rich for every product/source.
5. Misleading UI: scanner/photo buttons must open the exact tool immediately, not bury it in tabs.
6. Divergence: MASTER SPEC requires understandable product tables, additives, vitamins/minerals, and no broken language everywhere.
7. Missing: universal food/product normalization quality gate and full product details for poor catalog entries.
8. Broken chains: OpenFoodFacts/catalog data may lack iodine/vitamins/additives and UI may not explain missing source data.
9. Duplicate logic: product cards, nutrition facts, scanner cards, and photo draft summaries can diverge.
10. Architecture risk: catalog enrichment and UI presentation must be centralized.
11. Files: `src/features/meal/*`, `src/features/water/*`, `server/routes/state.routes.mjs`, `server/services/photoAnalysisService.mjs`, `server/services/product*`, `server/storage/*`.
12. Existing tests: product search/card/facts, barcode layout, photo draft contracts, water cloud/save/model tests.
13. Missing tests: real product fixtures across categories, additive coloring, micronutrient display, scan -> add -> reload E2E.
14. Acceptance: scanner/photo/search/manual all produce the same backend-confirmed product/meal record and readable nutrition table.

### Recipes / Recipe Detail / Fridge

STATUS: PARTIAL

1. Current: recipe surfaces, recipe cards, fridge state, recipe suggestion copy.
2. Works: recipes can be shown and some fridge state is preserved.
3. Keep: recipe/fridge domain separation from meal logging.
4. Visual incomplete: detail view and cooking flow are not production-complete.
5. Misleading UI: fridge suggests value beyond current recommendation depth.
6. Divergence: MASTER SPEC expects recipes as active assistant tools, not static cards.
7. Missing: recipe detail, ingredients, cooking steps, nutrition calculation, save/cook/add-to-diary cycle.
8. Broken chains: fridge ingredients do not yet reliably drive recipe recommendations and diary entries.
9. Duplicate logic: recipe macros can diverge from meal macros.
10. Architecture risk: recipe builder needs one ingredient/nutrition engine.
11. Files: `src/pages/RecipesPage.tsx`, `src/features/recipe/*`, `src/features/fridge/*`, `server/routes/state.routes.mjs`.
12. Existing tests: recipe/fridge state and contracts where present.
13. Missing tests: recipe detail E2E, fridge -> recommendation -> add meal.
14. Acceptance: user can open recipe, inspect ingredients/macros, cook/add/save it, and see cloud persistence after reload.

### AI Runtime / AI Tools / AI Memory / Assistant UI

STATUS: NEEDS_REFACTOR

1. Current: AI routes, assistant message endpoint, provider order, backend tools, assistant runtime card, global assistant layer, companion UI, and one canonical JSON-backed `assistantWorkerTools` manifest for the assistant toolbelt.
2. Works: assistant can answer, use some tools, show quick actions, avoid fake saved actions in several flows, and reuse the same 12-tool worker belt in the landing assistant scene, dashboard command dock, `/coach` command center, global layer, ecosystem pulse, profile customization, companion shop, and Telegram help output.
3. Keep: backend tool contracts, provider fallback idea, markdown assistant responses, no medical certainty, and the canonical assistant toolbelt in `src/features/assistant/assistantWorkerTools.json`.
4. Visual incomplete: assistant is not yet the living worker from the fixed reference across the entire product.
5. Misleading UI: character shop/tool claims exceed fully proven backend actions.
6. Divergence: MASTER SPEC says assistant is the product worker, not a static widget.
7. Missing: universal tool execution, durable memory UI, consistent character state machine, and receipt UI across every assistant surface.
8. Broken chains: some assistant actions navigate to UI instead of completing confirmed backend work.
9. Duplicate logic: assistant cards still repeat some roles, but the visual/toolbelt duplication between landing, dashboard, `/coach`, global layer, ecosystem pulse, profile customization, shop, and Telegram help has been removed.
10. Architecture risk: the shared action receipt contract now exists, but features can still become separate scripted surfaces if new tools bypass it.
11. Files: `server/routes/ai.routes.mjs`, `server/agent/*`, `src/features/assistant/*`, `src/widgets/GlobalAssistantLayer.tsx`, `src/features/profile/CompanionShopCard.tsx`, `src/features/profile/AssistantCustomizationCard.tsx`.
12. Existing tests: assistant runtime/context/memory/presence/global layer/discovery cards, action receipt parser/service tests, plus canonical assistant worker toolbelt contract tests covering landing, `/coach`, pulse, profile customization, shop, and Telegram help.
13. Missing tests: assistant action receipt E2E across browser + Telegram, full Telegram/site action parity, visual state machine.
14. Acceptance: assistant can understand context, execute supported tools through backend, show saving/success/failure receipts, and present one consistent character across product.

### Telegram

STATUS: PARTIAL

1. Current: Telegram connection, localized commands, reminders, water/meal/task/med commands, photo intake classifier, help text generated from the shared assistant worker toolbelt, and assistant action receipt consumption for confirmed water/status callbacks.
2. Works: bot menus and commands exist; language-aware buttons exist; food/photo/BP/medication classification foundations exist; `/help` no longer maintains a separate capability list from the site assistant; water callbacks no longer show success unless the assistant action is backend-confirmed.
3. Keep: Telegram as retention layer, not main app; backend-owned actions; localized button generation.
4. Visual incomplete: animated/sticker assistant personality is not fully implemented.
5. Misleading UI: if Telegram says it can process every photo, non-food save flows must be complete.
6. Divergence: MASTER SPEC wants same assistant as website worker.
7. Missing: confirmed save flows for BP photos, prescriptions, medication schedules, birthday/event reminders, generated chart reports.
8. Broken chains: Telegram photo classification can stop at draft/manual review without writing confirmed health records.
9. Duplicate logic: site assistant and Telegram assistant still have separate action surfaces, but no longer duplicate the assistant capability/toolbelt list.
10. Architecture risk: Telegram consumes the shared receipt shape for current agent actions, but new photo/health/event tools still need to be routed through the same contract.
11. Files: `server/services/telegramService.mjs`, `server/services/telegramPhotoIntakeService.mjs`, `server/routes/telegram.routes.mjs`, `server/agent/agent.tools.mjs`.
12. Existing tests: telegram service, medication reminders, telegram photo intake tests, shared assistant worker manifest coverage for Telegram help, and failed receipt handling for Telegram water callbacks.
13. Missing tests: Telegram photo -> health save -> graph, event reminder creation, partner/family message permissions, and receipt parity for every assistant tool.
14. Acceptance: Telegram can receive text/photo, classify intent, ask for confirmation, save through backend, and reflect the result on the site.

### Organizer / Tasks / Reminders / Calendar / Birthdays / Shopping Lists

STATUS: PARTIAL

1. Current: reminder routes, reminder commands, task-like Telegram actions, medication reminder foundations.
2. Works: simple reminders and some medication scheduling flows exist.
3. Keep: reminders as backend-owned retention actions.
4. Visual incomplete: no complete organizer product center.
5. Misleading UI: assistant may imply flexible scheduling that is not fully persisted.
6. Divergence: MASTER SPEC requires universal life reminders, birthdays, calendars, shopping lists.
7. Missing: calendar, birthday module, shared shopping list, event-relative reminders after meals/windows.
8. Broken chains: natural language reminder -> structured schedule -> confirmation -> Telegram/site notification is incomplete.
9. Duplicate logic: reminders/tasks/meds appear in assistant and Telegram separately.
10. Architecture risk: needs one task/reminder model with recurrence, windows, and triggers.
11. Files: `server/routes/reminder.routes.mjs`, `server/storage/reminder*`, `server/services/telegramService.mjs`, `server/agent/agent.tools.mjs`, `src/features/reminders/*`.
12. Existing tests: reminder routes/storage, medication reminder tests.
13. Missing tests: birthday, meal-relative medication, calendar recurrence, shopping list collaboration.
14. Acceptance: user can create any supported reminder/task from site or Telegram, receive it, edit it, and see it after reload.

### Health / Blood Pressure / Measurements / Tests / Analyses

STATUS: PARTIAL

1. Current: weight/progress measurements, BP photo classification, health-oriented assistant/tool language.
2. Works: weight and water/progress records exist; BP can be detected from images in Telegram intake foundation.
3. Keep: safety disclaimers and no diagnosis rule.
4. Visual incomplete: health center is not a complete daily module.
5. Misleading UI: health charts/cards can imply data exists when no confirmed record was saved.
6. Divergence: MASTER SPEC requires pressure, measurements, analyses, trends, safe assistant explanations.
7. Missing: BP ledger/chart, lab result storage, medication/report graph exports.
8. Broken chains: photo of pressure device -> extracted values -> confirmed save -> graph is incomplete.
9. Duplicate logic: measurements spread across progress/profile/assistant.
10. Architecture risk: health records need a typed backend model and permission policy.
11. Files: `src/pages/ProgressPage.tsx`, `src/features/progress/*`, `server/services/telegramPhotoIntakeService.mjs`, `server/storage/*`.
12. Existing tests: progress, weight, BP normalization/photo-intake where present.
13. Missing tests: health record persistence, graph generation, safety copy.
14. Acceptance: user can log, import, view, chart, and export health measurements with backend-confirmed records.

### Women's Health / Cycle / Trying To Conceive / Pregnancy / Postpartum

STATUS: PARTIAL

1. Current: women-health onboarding/page, pregnancy week/day, due/conception estimates, family prediction fields, safety disclaimers.
2. Works: form fields and calculations exist; docs define target lifecycle.
3. Keep: safety copy, week/day granularity, non-medical probability framing.
4. Visual incomplete: module is not automatically central for female users after registration.
5. Misleading UI: selecting female/pregnant can still leave no obvious product access.
6. Divergence: MASTER SPEC requires cycle, TTC, pregnancy, postpartum, breastfeeding, baby modes as lifecycle states.
7. Missing: full weekly pregnancy content, appointments/tests checklist, food safety prompts, postpartum/breastfeeding mode transitions.
8. Broken chains: onboarding women-health answer -> profile -> navigation/dashboard/partner visibility is not fully proven.
9. Duplicate logic: women-health state lives across onboarding/profile/docs/page.
10. Architecture risk: lifecycle mode needs to drive goals, AI prompts, Telegram, nutrition, and partner permissions.
11. Files: `src/pages/onboarding/OnboardingWomenHealthPage.tsx`, `src/pages/WomenHealthPage.tsx`, `src/features/womenHealth/*`, `docs/FAMILY_WELLNESS_ECOSYSTEM.md`.
12. Existing tests: women health domain/contracts, onboarding women flow tests.
13. Missing tests: female account E2E, pregnancy dashboard, postpartum transition, partner parity.
14. Acceptance: female lifecycle state changes the whole product safely and visibly after reload.

### Family / Partner / Invite Link / QR / Permissions

STATUS: PARTIAL

1. Current: partner invite routes, pregnancy partner endpoint, docs for QR/link/email/Telegram.
2. Works: invite foundation exists.
3. Keep: limited partner view and backend source-of-truth permissions.
4. Visual incomplete: partner dashboard and email invite UX are incomplete.
5. Misleading UI: invitation options can appear more complete than actual permissioned product.
6. Divergence: MASTER SPEC requires partner sees pregnancy/family progress without full private data.
7. Missing: email invite, partner onboarding, permission editor, family goals, shared reminders.
8. Broken chains: wife invite -> partner registration/login -> linked profile -> limited synced view needs E2E proof.
9. Duplicate logic: invite concepts in docs/routes/UI may differ.
10. Architecture risk: family permissions must be first-class before more sharing.
11. Files: `server/routes/partner.routes.mjs`, `src/pages/PartnerInvitePage.tsx`, `src/features/family/*`, `docs/FAMILY_WELLNESS_ECOSYSTEM.md`.
12. Existing tests: partner invite page/contracts.
13. Missing tests: email invite, QR scan, existing-user join, new-user registration join, permission boundaries.
14. Acceptance: partner can join via QR/link/email, see allowed pregnancy/family data, and never see private data outside permission.

### Progress / XP / Levels / Achievements / Coins

STATUS: PARTIAL

1. Current: progress page, weight/water/body/trends, companion progression, achievements/coins-like UI.
2. Works: some metrics render and cloud progress exists.
3. Keep: overall progress card concept and water glass visualization.
4. Visual incomplete: progress is not yet all counted parameters with clear legend everywhere.
5. Misleading UI: XP/coins/shop imply economy not fully backed.
6. Divergence: MASTER SPEC wants family/product-wide gamification.
7. Missing: complete rules engine, ledgers, achievement unlocks, family goals, premium shop tie-in.
8. Broken chains: actions across modules do not consistently award XP/achievements.
9. Duplicate logic: companion/profile/progress all calculate parts.
10. Architecture risk: rewards must be centralized before premium/skins.
11. Files: `src/pages/ProgressPage.tsx`, `src/features/progress/*`, `src/features/companion/*`, `src/features/profile/CompanionShopCard.tsx`.
12. Existing tests: progress and companion tests.
13. Missing tests: reward ledger, level thresholds, coin transactions, achievement unlock E2E.
14. Acceptance: every eligible action creates one backend-confirmed progress/reward event and survives reload.

### Community / Friends / Chat / Posts / Recipes / Likes / Saved / Moderation

STATUS: PARTIAL

1. Current: community route/state, some recipes/social concepts, admin moderation for food submissions.
2. Works: basic community state exists.
3. Keep: moderation-first approach for user-generated food/products.
4. Visual incomplete: community is not a full social product.
5. Misleading UI: friends/posts/chat may look available beyond their actual backend.
6. Divergence: MASTER SPEC expects posts, recipes, likes, saved, friends, moderation.
7. Missing: real friend graph, chat, posts feed, like/save moderation pipeline.
8. Broken chains: community actions do not all have backend-confirmed persistence.
9. Duplicate logic: saved items exist in food and community separately.
10. Architecture risk: community needs moderation and abuse controls before expansion.
11. Files: `src/pages/CommunityPage.tsx`, `src/features/community/*`, `server/controllers/admin.controller.mjs`, `server/routes/admin.routes.mjs`.
12. Existing tests: community sync and admin moderation tests.
13. Missing tests: post creation, likes, saved, friend requests, moderation queue.
14. Acceptance: user-generated content is persisted, moderated, and recoverable with role-safe admin tools.

### Characters / Classic Assistant / Character Shop / Skins / Free-Premium

STATUS: NEEDS_REFACTOR

1. Current: companion customization cards, skin shop concepts, free robot/premium animal/fantasy references, global assistant visuals, and shared assistant capability/toolbelt text from the assistant manifest.
2. Works: selectable assistant UI exists in profile; global assistant exists; landing and profile shop capabilities now use the same canonical worker toolbelt as the global assistant.
3. Keep: one assistant brain with multiple skins; cosmetics only, no pay-to-win; no local copy of assistant tools inside the shop.
4. Visual incomplete: default assistant and shop reference are not applied everywhere.
5. Misleading UI: paid/premium labels without billing/unlock backend.
6. Divergence: MASTER SPEC expects the assistant to feel alive and project-wide, not a profile-only decoration.
7. Missing: actual skin inventory, unlock rules, store, equip persistence, animation state machine.
8. Broken chains: chosen assistant style may not consistently change all assistant appearances.
9. Duplicate logic: static hero assistant, dashboard cards, profile customization, and Telegram still render/describe the assistant differently.
10. Architecture risk: must consolidate around one character renderer/state machine and backend-confirmed skin state.
11. Files: `src/features/profile/CompanionShopCard.tsx`, `src/features/profile/AssistantCustomizationCard.tsx`, `src/widgets/GlobalAssistantLayer.tsx`, `src/features/companion/*`, `src/styles/*`.
12. Existing tests: assistant manifest, companion shop, global assistant layer, and contract tests preventing a second local shop toolbelt.
13. Missing tests: equip -> all pages reflect skin, premium lock, animation state transitions.
14. Acceptance: one default robot appears consistently, can move/react without blocking content, and shop states are backend-confirmed.

### Billing Readiness

STATUS: MISSING

1. Current: premium language and skin labels exist.
2. Works: no complete billing flow found.
3. Keep: cosmetics-only principle.
4. Visual incomplete: premium UI is placeholder.
5. Misleading UI: upgrade/premium without checkout/subscription can confuse users.
6. Divergence: MASTER SPEC allows premium skins; production needs billing contracts.
7. Missing: provider, plans, entitlement backend, webhook, receipts, refund/cancel states.
8. Broken chains: premium skin -> entitlement -> equip is not real.
9. Duplicate logic: premium labels in UI without central entitlement.
10. Architecture risk: adding billing late can conflict with character shop.
11. Files: `src/features/profile/CompanionShopCard.tsx`, `package.json`.
12. Existing tests: none found for billing.
13. Missing tests: checkout, webhook, entitlement, premium lock.
14. Acceptance: no paid UI ships as active until backend entitlements and payment provider are complete.

### Profile / Settings / Notifications / Integrations / Admin Center

STATUS: PARTIAL

1. Current: profile tabs, assistant settings, notification buttons, Telegram integration, admin user/stat routes.
2. Works: profile data displays, some settings save, admin can inspect/manage users.
3. Keep: role separation and backend admin routes.
4. Visual incomplete: normal user profile still shows too much technical/admin-like info in places.
5. Misleading UI: integration/notification states may not show exact backend reason.
6. Divergence: MASTER SPEC wants simple user settings and powerful admin center.
7. Missing: full admin analytics, online users, last session, created date, integration health, notification center.
8. Broken chains: profile-state failures can leave settings unsaved.
9. Duplicate logic: profile info appears in dashboard/profile/admin.
10. Architecture risk: admin needs dedicated operational models, not only user cards.
11. Files: `src/pages/ProfilePage.tsx`, `src/pages/AdminPage.tsx`, `src/features/profile/*`, `server/routes/admin.routes.mjs`, `server/controllers/admin.controller.mjs`.
12. Existing tests: admin controller/routes, profile cloud tests.
13. Missing tests: admin user lifecycle, online/session metadata, notification permission flows.
14. Acceptance: user settings are simple and safe; admin has full operational context without exposing admin complexity to users.

### Localization / Accessibility / Motion / System States / Offline Handling

STATUS: PARTIAL

1. Current: multiple languages, localized Telegram buttons, motion libraries, offline/PWA handling, loading/error states.
2. Works: language switching and many localized strings exist.
3. Keep: localization-first approach and honest failed states.
4. Visual incomplete: broken keys/mixed language have appeared in screenshots.
5. Misleading UI: false offline or generic unavailable messages can hide real backend causes.
6. Divergence: MASTER SPEC requires polished, magical, accessible states.
7. Missing: complete key coverage, focus trap/focus restore, reduced motion, visual regression.
8. Broken chains: aria-hidden/focus warnings and WebGL/Three warnings have appeared in DevTools.
9. Duplicate logic: language strings and assistant copy are scattered.
10. Architecture risk: motion/assistant overlays can harm accessibility and mobile UX.
11. Files: `src/i18n/*`, `src/app/layouts/*`, `src/widgets/GlobalAssistantLayer.tsx`, `src/serviceWorker*`, `src/styles/*`.
12. Existing tests: localization contracts, service worker/offline/error recovery tests, assistant layer tests.
13. Missing tests: clean-console E2E, keyboard navigation, screen reader/focus checks.
14. Acceptance: no broken keys, no focus warnings, no blocking overlays, safe reduced-motion behavior, actionable offline states.

### Observability / Security / Tests / E2E / DevTools Cleanliness

STATUS: PARTIAL for observability/security/tests, MISSING for E2E, BROKEN for DevTools cleanliness

1. Current: Sentry/PostHog/client error route, security headers, CSRF tests, many unit/contract tests.
2. Works: backend has structured error handling and many tests protect domain contracts.
3. Keep: audit scripts, security headers, CSRF guard, client error reporting.
4. Visual incomplete: production errors are not always diagnosable from UI.
5. Misleading UI: generic 503/failed save without request ID makes users think nothing was fixed.
6. Divergence: MASTER SPEC demands production quality, not only passing unit tests.
7. Missing: browser E2E, clean-console gate, release smoke matrix.
8. Broken chains: user has repeatedly seen console 401/409/500/503, aria-hidden, WebGL/Three warnings.
9. Duplicate logic: live audit scripts and tests are not one release gate.
10. Architecture risk: regressions will keep resurfacing without E2E.
11. Files: `server/index.mjs`, `server/scripts/*`, `vitest.config.ts`, `src/**/*.test.*`, `server/**/*.test.*`.
12. Existing tests: broad unit/contract/security/domain suite.
13. Missing tests: Playwright/WebKit/Chrome/Firefox mobile viewport and auth journey tests.
14. Acceptance: release cannot pass if critical routes throw console errors, auth E2E fails, or backend returns unclassified 5xx.

## Critical P0 / P1 Issues

### P0-1: Auth / Onboarding Persistence Is Not Cross-Browser Proven

Affected modules: Auth, Registration, Session, Onboarding, Profile  
Affected files: `server/routes/auth.routes.mjs`, `server/services/authService.mjs`, `server/runtime/authCookies.mjs`, `src/shared/api/authRemote.ts`, `src/features/auth/authSlice.ts`, `src/pages/RegisterPage.tsx`, `src/pages/onboarding/OnboardingFinishPage.tsx`

Root cause risk: profile-state save/session restore has multiple moving parts: HttpOnly cross-site cookies, CORS credentials, CSRF origin checks, refresh rotation, local draft preservation, and profile-state conflict handling.

User impact: a real user can register, verify email, answer onboarding, then fail at the last step or lose session on reload.

Safest fix strategy: add diagnostic request IDs and browser E2E first, then fix the exact failing branch.

### P1-1: Product Still Feels Like Feature Warehouse

Affected modules: Dashboard, Assistant UI, Characters, Food, Women Health, Progress  
Root cause risk: multiple independent screens render different versions of the assistant and product promise.

User impact: user sees features but does not feel one living AI worker.

Safest fix strategy: consolidate assistant renderer/manifest and apply the fixed blueprint gradually per route.

### P1-2: Telegram Worker Promise Exceeds Confirmed Actions

Affected modules: Telegram, AI Tools, Health, Organizer  
Root cause risk: classifier exists, but non-food confirmation/save/report chains are incomplete.

User impact: user sends photo/text expecting the assistant to do work, but gets draft or unsupported behavior.

Safest fix strategy: one action receipt contract shared by site and Telegram.

### P1-3: Women / Family Lifecycle Is Not Product-Wide Yet

Affected modules: Women Health, Pregnancy, Partner, Family, Nutrition, Telegram  
Root cause risk: women-health data exists but does not drive dashboard, assistant, partner, nutrition, and Telegram everywhere.

User impact: female/pregnant account does not clearly unlock expected pregnancy/family experience.

Safest fix strategy: central lifecycle mode contract, then route/dashboard/assistant/partner projections from it.

### P1-4: No True Browser E2E / DevTools Clean Gate

Affected modules: Release, Tests, DevTools cleanliness, Auth, Mobile  
Root cause risk: unit tests catch contracts but not real browser cookies, overlays, focus, Safari/WebKit behavior, or console errors.

User impact: regressions reappear after deploy.

Safest fix strategy: add smoke E2E before large refactors.

## Architecture Risks

1. Feature warehouse risk: many screens exist, but not all are connected to one assistant-led operating model.
2. Profile-state coupling risk: auth completion, onboarding, profile, and assistant personalization depend on one fragile save chain.
3. Assistant duplication risk: website assistant, Telegram assistant, profile companion, hero robot, and global overlay can diverge.
4. Catalog normalization risk: product nutrition/additives/vitamins can vary by source and produce inconsistent UI.
5. Lifecycle drift risk: women/family modes can become separate mini-apps instead of one account lifecycle.
6. Rewards/store risk: skins, coins, premium, achievements, and levels need one backend ledger before monetization.
7. E2E gap risk: browser/device bugs will continue without a release-blocking journey test.

## Implementation Phases

### Phase 0: P0 Auth / Session / Onboarding Gate

- Add production-safe diagnostics for profile-state and auth save failures.
- Add cross-browser E2E for registration, verification, onboarding finish, reload, login restore.
- Fix exact 500/503/409/session root causes.
- Do not continue UI expansion until this is green.

### Phase 1: Unified Assistant Shell

- Consolidate assistant renderer/manifest.
- Ensure default robot and chosen skin appear consistently across dashboard, coach, profile, onboarding, landing, and mobile.
- Make assistant non-blocking on all inputs.
- Add action receipt UI: thinking, working, saved, failed, retry.
- Progress: canonical assistant worker toolbelt is now centralized in `assistantManifest.ts` and consumed by the landing assistant scene, dashboard command dock, `/coach` command center, global assistant layer, ecosystem pulse, profile customization, and companion shop. The visual renderer/state machine is still not fully consolidated.

### Phase 2: Food / Scanner / Photo / Product Truth

- Centralize product nutrition display.
- Complete additives/vitamins/minerals/readable language for all product sources.
- Ensure scanner/photo/search/manual all use the canonical backend-confirmed flow.

### Phase 3: Telegram Worker + Organizer + Health Intake

- Use one assistant tool/action contract for site and Telegram.
- Complete photo flows for food, blood pressure, meds, prescriptions, health documents.
- Complete flexible reminders, birthdays, medication schedules, and graph/report generation.

### Phase 4: Women / Pregnancy / Family Lifecycle

- Central lifecycle mode drives dashboard, AI, nutrition goals, Telegram, partner visibility.
- Complete pregnancy weekly content, trimester/month/day, due/conception estimates, partner parity.
- Complete postpartum, breastfeeding, baby mode, family goals, permissions.

### Phase 5: Progress / Community / Admin / Premium

- Centralize XP, achievements, levels, coins.
- Complete community and moderation.
- Complete admin operational dashboard.
- Only then make premium/billing active.

### Phase 6: Release Quality Gate

- Build/lint/test/audit scripts.
- Browser E2E.
- Mobile smoke.
- Scanner/photo smoke.
- Auth restore.
- Clean DevTools gate.

## First Safe Implementation Batch

Batch 1 should be P0 Auth proof and diagnostics only.

### Batch 1A: Production Auth Proof, Not More Feature Work

STATUS: NEXT

Purpose: convert local P0 auth/session/profile fixes into production evidence, or expose the exact remaining root cause with request ids and deployment fingerprint.

Scope:

- Verify production is running the same backend contract as local source.
- Verify public and `www` origins both pass credentialed CORS with `X-Request-Id` allowed and exposed.
- Verify registration delivery uses configured transactional provider chain without fake success.
- Verify email verification creates HttpOnly cookies and restores session.
- Verify onboarding finish saves profile-state once and survives reload/relogin.
- Verify no old user's cached snapshot/state-version can influence the new account.

Out of scope:

- New assistant skins.
- Landing redesign.
- New family/pregnancy screens.
- Food scanner/photo quality improvements.
- GitHub/docs hygiene.

Required commands/evidence after deploy:

- `npm run audit:live`
- `npm run audit:live:auth` with `SMART_NUTRITION_LIVE_SMOKE_EMAIL` and `SMART_NUTRITION_LIVE_SMOKE_PASSWORD`
- Manual deployed browser smoke on Chrome desktop and Safari/iPhone or WebKit-equivalent.
- DevTools/network proof for `PATCH /api/auth/profile-state`: status 2xx, `Access-Control-Expose-Headers` includes `X-Request-Id`, and no 409/500/503 after successful onboarding finish.

Acceptance:

- `/api/health` shows the expected safe deployment fingerprint.
- Register/verify/onboard/reload/relogin passes for a fresh test account.
- Failed registration email delivery shows request id and retry/open-mail state, not password fields plus contradictory success.
- Successful onboarding completion never relies on local draft as canonical truth.
- User is not asked for language again after verified session restore unless they intentionally reset language.
- Auth is still PARTIAL until this evidence exists; it becomes DONE only after the evidence is recorded here.

Current Batch 1 progress:

- DONE: backend error responses now include a public `requestId` and `X-Request-Id` header, with safe inbound request-id reuse for cross-layer debugging.
- DONE: frontend profile sync diagnostics preserve that `requestId` alongside `STATE_SYNC_UNAVAILABLE`, HTTP status, sync stage, and reason code.
- DONE: focused tests cover HTTP error shape, route error mapping, authRemote diagnostics preservation, and profile sync diagnostic messages.
- DONE: `audit:live:auth` now supports an optional safe registration preflight: availability -> register -> resend verification -> owner cleanup -> availability restored.
- DONE: registration live smoke refuses unsafe cleanup unless the registration email is clearly disposable and owner credentials are explicitly provided.
- DONE: credentialed CORS now explicitly allows `X-Request-Id`, so browser-side auth/profile diagnostics can survive preflight instead of failing before the API route.
- DONE: `audit:live:auth` now checks `/api/auth/profile-state` CORS preflight for credentials, `PATCH`, sync headers, and request-id diagnostics before mutating profile state.
- DONE: `audit:live:auth` now runs browser-auth protocol checks before requiring a smoke login, so missing local smoke credentials no longer hide production CORS/preflight regressions.
- DONE: `audit:live:auth` accepts `SMART_NUTRITION_LIVE_BASE_URL` as a safe alias for `SMART_NUTRITION_LIVE_API_URL`.
- DONE: `/api/health` now exposes a safe public deployment fingerprint (`deployment.provider`, optional short `deployment.commit`) so stale Render deploys can be distinguished from code regressions without leaking secrets.
- DONE: `audit:live` now requires the safe Render deployment fingerprint before production can be called verified.
- DONE: credentialed CORS now builds `Access-Control-Allow-Headers` from a safe allowlist, so browser-requested app diagnostics like `X-Request-Id` are supported without echoing arbitrary unsafe headers.
- DONE: credentialed CORS now exposes safe response diagnostics (`X-Request-Id`, `Retry-After`, and rate-limit remaining headers), so frontend DevTools and recovery UI can read the same public request id the backend logs.
- DONE: live audits now separate credentialed CORS preflight from actual credentialed response exposure, so `Access-Control-Expose-Headers` is verified where browser JavaScript really needs it.
- DONE: contract audit now locks the server pipeline order: request id and credentialed CORS must be applied before preflight handling, public/protected routing, auth, rate-limit responses, and route errors.
- DONE: live audit failures now print exact normalized evidence for backend health and CORS/preflight (`status`, `ACAO`, `ACAC`, `ACAM`, `ACAH`, deployment provider/commit), so P0 auth/deploy failures do not require guessing from screenshots.
- DONE: live audit failure diagnostics are now a shared tested module (`server/scripts/liveAuditDiagnostics.mjs` + `server/scripts/liveAuditDiagnostics.test.mjs`) instead of duplicated ad hoc script logic; the test rejects fake `X-Request-Id` substring matches like `X-Request-Id-Deprecated`.
- DONE: public and authenticated live audits now cover both `https://smart-nutrition.club` and `https://www.smart-nutrition.club` as trusted frontend origins, so www/canonical drift cannot hide Safari/iPhone auth failures.
- DONE: authenticated live smoke now verifies the same safe `/api/health.deployment` fingerprint before auth/preflight/session checks, so a stale Render deploy is reported separately from a real auth regression.
- DONE: `audit:live:auth` now verifies auth login sets browser-compatible access and refresh cookies with `HttpOnly`, `Secure`, `SameSite=None`, `Path=/`, and `Max-Age`.
- DONE: `audit:live:auth` now requires authenticated login responses to expose browser-readable `X-Request-Id` diagnostics in addition to credentialed CORS and cookie transport.
- DONE: `audit:live:auth` now requires the critical `PATCH /api/auth/profile-state` save response itself to expose browser-readable `X-Request-Id` diagnostics before the profile/session path can be called verified.
- DONE: frontend unsafe auth/profile requests now attach `X-Request-Id`, refresh requests carry the same diagnostic header class, and header-only server request ids are preserved in profile-state diagnostics.
- DONE: profile cloud action UI now treats `request:<id>` diagnostics as safe public recovery copy, so onboarding/profile save failures can show the exact request id instead of collapsing back to a generic message.
- DONE: Mongo no-transaction fallback now checks cloud snapshot conflicts before writing `profiles`/`meals`, so stale profile-state or snapshot saves cannot partially overwrite canonical domain documents before returning `STATE_CONFLICT`.
- DONE: CORS config now normalizes dashboard-pasted quoted values and literal `\n` fragments before origin parsing, so Render/Vercel env fields like `"https://smart-nutrition.club, https://www.smart-nutrition.club\n"` do not silently drop a public origin.
- DONE: `production-check` now requires both public frontend origins (`https://smart-nutrition.club` and `https://www.smart-nutrition.club`) in production CORS instead of only checking that the allowlist is non-empty.
- DONE: contract audit now locks the exact public CORS-origin production readiness rule and its quoted/newline env regression test.
- DONE: focused verification for this protocol batch passed: `server/lib/http.test.mjs`, `node --check server/scripts/audit-live-authenticated.mjs`, and `node --check server/lib/http.mjs`.
- DONE: focused authRemote verification passed for diagnostic request ids on login/profile writes, refresh diagnostics, and header-only profile-state error preservation.
- DONE: focused profile/onboarding verification passed for preserving `STATE_SYNC_UNAVAILABLE`, HTTP status, sync stage, reason code, and request id while still rejecting raw storage/internal exception text.
- DONE: focused Mongo/profile-state verification passed for conflict-first fallback ordering, auth service profile-state failures, public error mapping, and state service contracts.
- DONE: focused CORS/health/config verification passed for request-id preflight, arbitrary header rejection, safe deployment fingerprint exposure, quoted/newline env normalization, and production public-origin enforcement.
- DONE: registration rollback storage contract now verifies that SQLite enables `PRAGMA foreign_keys = ON`, SQLite/Postgres user-owned tables use `ON DELETE CASCADE`, and Mongo explicitly deletes user-owned auth/state/assistant/product documents, so a failed verification email cannot leave a hidden partial account by storage design.
- DONE: verification-email delivery failures now preserve safe server diagnostics (`provider`, `providerCode`, `attempts`) on `VERIFICATION_DELIVERY_UNAVAILABLE` while still hiding raw provider messages/API details from the user-facing payload.
- DONE: focused P0 registration diagnostics verification passed for auth service delivery details, public route error mapping, and user-deletion rollback contracts.
- DONE: frontend auth API errors now preserve HTTP status, `requestId`, and safe delivery diagnostics through `AuthApiError`, so registration delivery failures can be traced from browser UI to backend/provider logs without exposing secrets.
- DONE: registration delivery-failure UI now keeps the password form hidden after submit and can show the safe `request:<id>` recovery marker beside the failed email state.
- DONE: focused frontend/server P0 diagnostics verification passed for `src/shared/api/auth.test.ts`, `src/shared/api/authRemote.test.ts`, `server/runtime/errorHandler.test.mjs`, `server/services/authService.test.mjs`, and `server/storage/userDeletion.contract.test.mjs`.
- DONE: production build passed after the frontend diagnostic request-id and UI recovery changes.
- DONE: local verification passed for focused tests, contract audit, syntax check, production build, lint, and whitespace diff check.
- DONE: remote state cache is now scoped to the authenticated user id. A session for user B cannot reuse user A or legacy unowned snapshot/meta cache, preventing stale `X-State-Version` from poisoning first profile/onboarding saves after relogin, deleted accounts, Safari restore, refresh-cookie restore, or shared-browser flows.
- DONE: refresh-cookie restore now sets the cache owner before writing any snapshot returned by `/auth/refresh`, so the stale-access-cookie path follows the same user-scoped cache contract as login, email verification, and session restore.
- DONE: focused P0 cache/session verification passed for `src/shared/lib/remoteStateCache.test.ts`, `src/shared/api/authRemote.test.ts`, `src/features/profile/profileCloudSync.test.ts`, `src/features/auth/authSlice.test.ts`, `src/appStartupAuth.contract.test.ts`, and `src/pages/onboardingProfileFlow.contract.test.ts` with 60 passing tests.
- DONE: focused live-audit diagnostics verification passed after refactor for `server/scripts/liveAuditDiagnostics.test.mjs`, `server/routes/health.routes.test.mjs`, and `server/lib/http.test.mjs` with 20 passing tests; this replaces the earlier weak command that named non-existent live audit test files.
- DONE: syntax and contract verification passed after refactor: `node --check` for both live audit scripts plus diagnostics/contracts scripts, and `npm run audit:contracts` with 169 checks.
- BLOCKED: full authenticated live smoke was not run locally because `SMART_NUTRITION_LIVE_SMOKE_EMAIL` and `SMART_NUTRITION_LIVE_SMOKE_PASSWORD` are not present in this shell.
- BROKEN LIVE: 2026-08-22 `npm run audit:live` still proves production Render does not satisfy the local diagnostic contract after the shared diagnostics refactor: `/api/health` returns `deployment=missing commit=missing`, actual credentialed CORS responses expose `ACEH=missing`, and production therefore looks stale or pointed at the wrong backend revision.
- BROKEN LIVE: 2026-08-22 `npm run audit:live:auth` cannot reach authenticated smoke because the same public backend fingerprint/preflight checks fail first for both `https://smart-nutrition.club` and `https://www.smart-nutrition.club`; `/api/auth/profile-state` preflight returns `ACEH=missing`, and smoke credentials are also absent from this shell.
- BLOCKED EXTERNALLY: until the current local backend changes are pushed and Render is redeployed from that exact source state, live Safari/iPhone auth failures cannot be honestly classified as fixed or not fixed. The current evidence says production is stale or not running the diagnostic CORS/health revision.
- NOT DONE: full email-click E2E proof for registration -> verification -> onboarding finish -> reload restore, because public registration correctly does not expose verification tokens.
- NOT DONE: real-device Safari/iPhone proof after deploy. The local root-cause candidate for stale cross-user remote cache is fixed, but production DONE still requires registration -> verification -> onboarding finish -> reload restore on Safari/iPhone or a WebKit-equivalent E2E.
- NOT DONE: live provider proof that Brevo primary and Resend fallback can deliver a real confirmation email after Render env/redeploy; the next 503 payload must be checked for `requestId` and safe delivery diagnostics.

Acceptance for Batch 1:

- One reproducible E2E path exists for registration -> verification -> onboarding finish -> reload restore.
- Profile-state failures return structured codes and request IDs.
- UI shows actionable error and retry without losing answers.
- Chrome/Firefox/WebKit local test matrix is defined and runnable.
- No app feature code is refactored until the failing browser/session branch is known.

Current Batch 2 progress:

- DONE: created one canonical JSON-backed `assistantWorkerTools` manifest for planning, nutrition, water, photo, Telegram, health, activity, family, reminders, chat, analytics, and safety.
- DONE: `LandingPage`, `AiCompanionPage`, `GlobalAssistantLayer`, `EcosystemPulse`, `AssistantCustomizationCard`, and `CompanionShopCard` now consume the same assistant worker toolbelt instead of maintaining separate local copies.
- DONE: the public landing assistant toolbelt now consumes the same assistant worker manifest instead of deriving assistant badges from local feature-rail copy.
- DONE: Telegram `/help` now consumes the same assistant worker toolbelt through `server/services/assistantWorkerManifest.mjs`, so the bot no longer has its own stale capability array.
- DONE: removed dead duplicated shop tool copy so the shop cannot silently drift from the assistant manifest.
- DONE: added contract tests that require landing, `/coach`, profile customization, shop, pulse, and Telegram help to use the canonical worker toolbelt and include photo/Telegram capabilities.
- DONE: added backend action receipts to assistant agent results, including confirmed/failed status, backend source, result type, safe navigation target, and retryability.
- DONE: frontend assistant action parsing and navigation handoff now preserve and prefer the confirmed receipt while keeping old fields as compatibility fallback.
- DONE: Telegram water/status callbacks now consume confirmed action receipts and avoid success reactions/messages when the backend action failed.
- DONE: local verification passed for focused assistant/Telegram tests, lint, production build, and whitespace diff check.
- NOT DONE: full blueprint-level assistant visual redesign across every route.
- NOT DONE: one renderer/state machine for dashboard, landing, coach, profile, onboarding, Telegram, and character shop.
- NOT DONE: backend skin inventory/unlock/premium entitlement contract.
- NOT DONE: receipt UI/state machine across every site assistant surface and every Telegram tool beyond the current confirmed callbacks.

## Do Not Rewrite

These parts are valuable and should be preserved unless a direct root-cause demands change:

- Backend/cloud as source of truth.
- HttpOnly auth cookies and refresh rotation.
- Backend-confirmed meal/water/profile writes.
- Existing no-fake-success onboarding finish behavior.
- Canonical scanner/search/photo/manual food direction.
- Telegram as retention layer.
- Existing unit/contract test base.
- Women-health safety disclaimers.
- Assistant medical safety rules.

## Final Verdict

Smart Nutrition is around a strong technical foundation with many real parts, but it is not yet a unified production product. The next work must not add more isolated features. The correct path is to prove P0 auth, then consolidate the assistant-led product shell, then finish each domain through backend-confirmed data chains and E2E acceptance.
