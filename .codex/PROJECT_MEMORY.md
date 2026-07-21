# Smart Nutrition Project Memory

## Project Vision

Smart Nutrition is an AI wellness ecosystem that helps users log meals, understand nutrition, track hydration, manage reminders, use Telegram for retention, and interact with a helpful assistant across web, PWA, mobile, and Telegram WebView surfaces.

The product must feel trustworthy, fast, recoverable, and coherent. Every user action that claims success must map to backend-confirmed state or an explicit queued/offline state. The ecosystem must remain one product, not a collection of parallel experiments.

## Current Production Status

Status: stabilizing with live smoke checks passing; not yet fully certified for production.

The project has a formal Codex governance layer and specialist skill suite. The latest stabilization pass removed a frontend external product lookup bypass, added a canonical reminder repository method with legacy compatibility, tightened photo meal fallback UX copy, hardened production config checks against placeholders, added global Vite stale chunk recovery, redacted a real-looking provider key from env examples with a regression test, synchronized backend-confirmed supplement reminder creation into the visible reminder manager, hardened the 3D companion runtime so mobile/low-power/data-saver sessions stay on 2D, made assistant history reset backend-confirmed instead of local-only, aligned production readiness with MongoDB Atlas as accepted canonical storage, reduced public health/readiness responses to non-sensitive liveness summaries, locked production auth session cookies behind tests for cross-site `SameSite=None; Secure; HttpOnly` behavior, updated frontend backend probing to accept the live sanitized public health payload (`mode=remote-cloud`, `auth=httpOnly-cookie-session`), added backend-owned OpenFoodFacts host fallback for product lookup resilience, aligned committed environment templates with the live `smart-nutrition.club` / `www.smart-nutrition.club` deployment, updated the ignored local `.env` to production-like non-placeholder required settings, clarified owner bootstrap wording so `SMART_NUTRITION_SUPER_ADMIN_EMAIL` is documented as promotion to `OWNER` rather than a separate `SUPER_ADMIN` promise, made `server:check` self-select production mode so local env files do not need `NODE_ENV=production` and do not pollute Vite builds, hardened Redis production config validation so invalid or placeholder Redis URLs cannot be counted as distributed runtime state, added a PWA update fallback reload path so stalled service-worker handoffs do not leave users stuck on an endless updating state, made Telegram connect-link creation a pending/info UI state instead of a confirmed success until backend status reports the account is connected, extended client persistence startup cleanup to remove legacy browser-stored assistant conversation history keys, made the non-secret remote device id durable so cloud conflict ownership survives refresh/relogin, hardened reset-password/verify-email pages so email tokens are captured into runtime state and removed from the browser URL while Vercel-served frontend routes send a strict referrer policy, and collapsed owner role bootstrap into one awaited access-control startup path instead of a hidden auth-service fire-and-forget side effect. Live smoke checks confirm Render readiness, Vercel hydration, UI login, secure cross-site auth cookies, backend product lookup, canonical product meal intake, water restore, reminder create/edit/delete/restore, AI chat reset, Telegram connect link generation, PWA/service worker assets, and mobile protected meal screen rendering. Core automated checks and `server:check` now pass locally; Redis is an explicit multi-instance requirement rather than a blanket single-instance warning.

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
- Hardened bundle audit so it counts `modulepreload` assets as initial payload, caps total startup JavaScript, and blocks scanner, photo compression, markdown, analytics, native bridge, and 3D vendors from being preloaded by `index.html`.
- Added `npm run audit:live` as a safe public live production smoke command for Vercel app HTML/assets, SEO discovery, PWA manifest, Render health/readiness, sanitized diagnostics, and credentialed CORS origin behavior.
- Added `npm run audit:live:auth` as the authenticated production smoke contract for dedicated verified smoke accounts: login cookies, session restore, `/api/state`, water mutation/restore, product intake/delete, reminder create/list/delete, and Telegram status without token exposure.
- Removed direct MongoDB success `console.log` output from storage adapters and protected the behavior with contract audit so database/host startup details stay behind controlled sanitized logging.
- Blocked `SMART_NUTRITION_AI_DEBUG_LOGS=true` in production and protected it with config tests plus contract audit so raw AI provider debug stdout cannot be enabled live.
- Blocked `SMART_NUTRITION_DEBUG_STARTUP_ENABLED=true` in production and gated full startup diagnostics logging behind the debug flag so `/api/debug/startup` and broad config dumps stay development-only.
- Removed stale AI setup documentation that described photo uploads as manual-draft-only, and added a contract audit guard so docs stay aligned with backend vision recognition, honest fallback, profile language, and user-confirmed saving.
- Made Redis readiness instance-aware: single-instance production may use in-memory cache/rate limiting, while `SMART_NUTRITION_RUNTIME_INSTANCE_COUNT>1` requires `SMART_NUTRITION_REDIS_URL` and is protected by tests plus contract audit.
- Made live smoke scripts load ignored local `.env` files so deploy URLs and dedicated smoke-account credentials can be provided locally without committing secrets.
- Added a tracked-files cleanliness contract so Codex/browser profiles, screenshots, remote attachments, logs, caches, build output, and `node_modules` cannot be committed as project source.
- Tightened ignored local backup storage so nested `server/data/backups/**` snapshots stay out of Git, with a contract allowing only `server/data/.gitkeep` under runtime data.
- Expanded backend external product mapping so OpenFoodFacts and USDA preserve the full canonical nutrient profile, including iodine, selenium, copper, fatty acids, cholesterol, sugar types, water, and vitamins when providers supply them.
- Added honest micronutrient guidance for seaweed/algae products: when provider data does not include a numeric iodine value, the product card flags iodine as a likely product signal without inventing a dose.
- Connected the progress overview to counted-domain navigation so water glasses remain visible on the first progress screen and tapping the water domain opens the full water tracker.
- Hardened Telegram reminder command hints so empty `/addmed`, `/addtask`, `/addwater`, `/addhabit`, `/addsupplement`, `/add`, and `/settime` prompts use the connected Smart Nutrition profile language instead of drifting to the Telegram client language.
- Hardened photo meal fallback so failed/unclear vision analysis never fills the draft with template foods or previous user-confirmed corrections; it now stays empty, uses the user's requested language, and asks for a clearer photo or manual ingredient confirmation.
- Localized QR partner invite acceptance and clarified that family access shares only pregnancy context through secure cloud sync, not full account synchronization or visible backend jargon.
- Polished visible Polish account, cloud-sync, Telegram-link, and fridge-save copy so production UI no longer exposes ASCII-only broken language in core status surfaces.
- Aligned Telegram account settings copy with the product architecture: Telegram is presented as the same Smart Nutrition assistant surface, not a separate bot product.
- Replaced raw Telegram main-menu command buttons with profile-language labels and routed label taps back into canonical snapshot/profile/help handlers, keeping Telegram as the same assistant worker surface instead of a command-list bolt-on.
- Routed AI-created medication and task reminders through the canonical typed `createReminderFromUserText` contract first, leaving legacy medication/task reminder methods as compatibility fallback only.
- Reworked visible meal/product/photo copy so regular users see online catalog and cloud-confirmed language instead of backend/API jargon while canonical backend-confirmed behavior remains intact.
- Reworked profile/account/sync copy so regular users see cloud profile, protected session, cloud restore, and temporary service availability language instead of API/access-token/snapshot/server setup details.
- Hardened photo meal recognition against provider hallucination: generic breakfast templates such as yogurt/oats/banana must be rejected even when a vision provider claims high confidence.
- Added an honest unavailable-analysis state to photo meal UX: failed vision analysis now shows a review card with retake guidance and zero selected ingredients instead of leaving the user with only a raw error.
- Promoted barcode scan results in the mobile scanner flow: after a product is resolved, the stopped preview and the first panel both show the scanned product before manual controls or history.
- Hardened community mutations so saved social/profile-community actions return canonical backend `community` state and the frontend refuses to confirm locally computed community state when the backend omits the canonical payload.
- Replaced raw product provider ids in regular nutrition UI with localized source labels, so scanner/product cards/quick meal/library surfaces show human product language instead of `OpenFoodFacts`, `USDA`, or `Manual`.
- Simplified regular account settings: operational runtime chips and backup restore-point lists are role-gated behind admin-center access and are not fetched or rendered for ordinary users.
- Reworked assistant action-failure replies so users see Smart Nutrition cloud-confirmation language while the code still enforces backend-confirmed tool success.
- Routed AI-created meal logging through the canonical backend product-intake contract with `source=recommendation`, assistant sync context, and an explicit `mealAdded` confirmation guard before any success reply.
- Added backend-confirmed AI weight logging: assistant text commands now append to canonical profile `weightHistory`, verify the saved entry after persistence, update assistant memory, and refuse visible success when the profile restore does not confirm the entry.
- Added backend-confirmed AI symptom logging: assistant symptom text now appends to canonical `womenHealth.symptomHistory`, verifies the saved symptom after persistence, updates assistant memory, and replies with safety language instead of diagnosis.
- Surfaced backend-confirmed symptom history in the existing women-health profile card as a care-context journal with localized copy, severity color, source labels, and a non-diagnostic safety note.
- Added backend-backed AI daily summary generation: assistant day-summary requests now read canonical snapshot, meal, water, profile, symptom, weight, and reminder state and reply as an action receipt instead of a generic model guess.
- Added backend-confirmed AI follow-up creation: assistant follow-up requests now become canonical task reminders with explicit local reminder time, confirmed reply copy, scoped memory, and no second reminder system.
- Added backend-confirmed AI favorite product saving: assistant save-favorite requests now search the canonical catalog, upsert into meal `savedProducts`, verify backend restore, and update scoped memory without a second product/favorite system.
- Added backend-backed AI weekly/monthly progress reports: assistant report requests now read canonical snapshot meal, water, profile, symptom, weight, and reminder state and reply as a report receipt instead of model-generated progress fiction.
- Added backend-confirmed AI reusable recipe creation: assistant recipe requests now resolve ingredients through the canonical catalog or snapshot/fridge context, save a canonical meal template, verify backend restore, and avoid pretending that a saved recipe was already logged as eaten.
- Added AI scanner navigation handoff: assistant scanner requests now return a structured `navigation_handoff` receipt to `/meals?mode=barcode`, the frontend validates the internal route before navigating, and the assistant does not pretend a scan/product result exists before the scanner resolves one.
- Added AI photo meal navigation handoff: assistant photo-food requests now return a structured `navigation_handoff` receipt to `/meals?mode=photo`, the frontend validates the internal route before navigating, and the assistant does not pretend recognition or saving happened before the user uploads and reviews a photo.
- Added backend-backed AI daily plan drafts: assistant plan requests now read canonical snapshot meal, water, profile, and reminders, reply with a localized review-only plan, and explicitly avoid saving meals or creating reminders from the draft itself.
- Added safe AI daily-plan item application: confirmed water/review items create canonical typed reminders, while food/protein/photo/scanner items hand off to existing meal entry surfaces without fake meal saves or a second planner.
- Added focused AI food-plan handoff: protein plan items now navigate to `/meals?mode=search&focus=protein`, and the meal builder preselects lunch plus a protein search query instead of dropping users into an empty generic food screen.
- Surfaced backend-confirmed reminder adherence history in the web reminder manager: each reminder now shows taken/done, skipped, snoozed counts, completion rate, and latest action from canonical reminder events.
- Surfaced canonical after-meal medication reminders end to end: text such as "take a pill after lunch" creates a meal-state-backed `after_meal` trigger, `/api/reminders` returns it, and the web reminder manager shows the meal window instead of a blank fixed-time schedule.
- Added a visible My Library overview over existing canonical saved nutrition state: saved products, reusable meal templates, and saved community materials now appear as one hub with counts and quick tab navigation, without a separate local library store.
- Simplified the food logging entry path around the existing `FoodCommandCenter`: barcode, photo, search, saved products, builder, and catalog contribution now route from one primary command surface, while the duplicate mode-selection card was removed.
- Added product correction as a backend-confirmed catalog moderation path: product cards open a prefilled shared-catalog contribution from the scanned/searched product facts instead of locally editing or inventing corrected product state.
- Added typed/browser-voice meal commands inside the existing `FoodCommandCenter`: explicit commands such as "add lunch 200 g rice" are parsed deterministically, matched against the canonical product catalog, checked for compatible product units, and saved only through backend-confirmed product intake.
- Hardened the progress overview into a tested counted-domain model: calories, protein, water, meals, weight goal, and body check-ins are calculated together, water glasses stay visible on the first progress screen, and each domain routes to its detailed section.
- Added web reminder adherence period reports inside the existing reminder manager: 7-day and 30-day summaries read canonical backend reminder events, show completed/skipped/snoozed counts, active reminder coverage, last action, and honest missing-data state without a second reminder/report store.
- Hardened guided registration so final account creation requires backend-confirmed available nickname and email; stale, unchecked, unavailable, or taken availability states route back to the exact field instead of relying on a late register failure.
- Hardened barcode/manual product fallback copy so catalog moderation failure is presented separately from backend-confirmed meal/profile save, with contract coverage preventing local-only save language from returning to the scanner flow.
- Localized water and quick-weight companion reward sync warnings so backend-confirmed hydration/weight saves remain honest while secondary companion-progress failures are shown in the user's selected language.
- Reworked regular cloud recovery/account/premium status copy so ordinary users see product-language cloud service, protected sync, and protected verification wording instead of API/server/backend infrastructure jargon.
- Localized premium plan labels, plan features, current-state labels, and subscription statuses in the profile card so Ukrainian/Polish interfaces no longer show English plan-feature constants or raw subscription enums.
- Reworked the PWA update banner so ordinary users see latest-fixes/stability wording instead of stale-cache/deployment internals.
- Reworked crash and lazy-section recovery copy so ordinary users see safe recovery/stable-screen language instead of cache/file internals.

## Current Architecture

- Frontend: React application with mobile, PWA, scanner, assistant, food, profile, community, analytics, and companion surfaces.
- Backend: Node backend owns canonical business actions and persistence contracts.
- Storage: MongoDB Atlas is the current production canonical backend storage. Postgres remains a supported future migration path, and SQLite remains local/development storage.
- AI: Assistant behavior must run through backend tools/contracts for saved actions and must not invent completion.
- AI/Telegram assistant replies must explain pending or failed saves with product cloud-confirmation language; backend/tool terminology belongs in code, tests, and audits, not visible helper copy.
- AI-created meal entries must use the same backend product-intake contract as scanner/search/manual/photo flows; the assistant may search the catalog, but it must not write meals through a separate direct entry path or claim success without `mealAdded`.
- AI-created favorite product saves must use canonical meal `savedProducts`, verify the saved product after backend restore, and must not create a separate favorite/product library.
- AI-created follow-ups must use the canonical typed task reminder contract with explicit local reminder time; they are proactive assistant work, not a separate reminder engine.
- AI-created weight check-ins must use canonical profile state and verify the saved `weightHistory` entry before reporting success.
- AI-created symptom check-ins must use canonical women-health profile state and verify the saved `symptomHistory` entry before reporting success; symptom replies must be care-context logs, not diagnosis or treatment advice.
- Women-health UI must surface canonical `symptomHistory` from profile state as an observation journal; it must not use local-only symptom persistence or present symptom logs as diagnosis.
- AI-generated day summaries must read canonical backend snapshot/profile/reminder state; they must not invent meal, water, reminder, weight, symptom, or report state.
- AI-generated weekly/monthly progress reports must read canonical backend snapshot/profile/water/reminder state; they are read-only report receipts and must not invent progress, trends, symptoms, reminders, or medical conclusions.
- AI-created recipes must save canonical meal templates and verify backend meal-state restore before visible success; saving a recipe is not the same as logging food into the diary.
- AI scanner opening is a navigation handoff to the existing meal scanner route (`/meals?mode=barcode`), not a second scanner, product lookup, or fake scan success; camera permission and product resolution remain owned by the canonical scanner/product flow.
- AI photo meal opening is a navigation handoff to the existing review-first photo route (`/meals?mode=photo`), not a second photo recognizer, saved meal, or fake recognition result; upload, analysis, editing, and save confirmation remain owned by PhotoMealAssistant and canonical meal persistence.
- AI daily plans are read-only review drafts over backend snapshot and reminder state; applying a selected item must route into existing canonical food, scanner, photo, or reminder flows instead of creating a second planner.
- Telegram: Retention and notification layer that must reuse canonical backend reminder/task contracts.
- Telegram AI: Telegram is an AI companion surface for the same Smart Nutrition assistant runtime as the website; commands/reminders are tools and shortcuts, not a separate bot product or second AI brain.
- Partner sharing: QR invites connect profiles through backend one-time invite contracts and may expose pregnancy timeline context only; visible copy should say secure cloud sync/family access, not backend jargon, and must not imply full account synchronization.
- Localization: visible user-facing copy must feel native in the selected language; do not ship broken transliteration on core account, sync, scanner, product, reminder, or Telegram surfaces.
- Secondary sync warnings after backend-confirmed actions must use profile-language copy and must not weaken the primary cloud-confirmed save contract.
- User-facing nutrition UX may say "online catalog" or "confirmed in the cloud"; it must not expose backend implementation jargon in regular food search, photo meal, library, composer, or diary success states.
- Product source/provider ids are implementation details; regular scanner, product card, composer, and library surfaces must render localized source labels instead of raw provider names.
- My Library must be a visible hub over canonical meal/community state (`savedProducts`, meal `templates`, and saved community posts); it must not introduce a second library persistence model.
- Regular profile/account/sync UX must present clear cloud-profile language; API, access-token, snapshot, provider, and server setup details belong in code, audits, or admin diagnostics, not everyday settings copy.
- Regular recovery/offline/subscription status copy must describe the cloud service and protected sync in product language; API/server/backend terminology belongs in code and admin diagnostics, not ordinary user-facing copy.
- Premium/profile status surfaces must localize visible plan labels, feature labels, and subscription statuses; raw enum values such as `inactive`, `trial`, `active`, or `cancelled` belong in state and tests, not ordinary UI.
- PWA update prompts must explain user benefit and stability in localized product language; cache, deployment, and service-worker internals must stay out of ordinary UI.
- Crash and lazy-section recovery prompts must describe safe screen recovery in localized product language; cache/file internals belong in recovery code and audits, not ordinary UI.
- Regular account/profile settings must show calm user-owned actions first; operational runtime, backup, and diagnostic details belong behind owner/admin/moderator/helper access gates.
- Nutrition: Scanner, search, manual add, photo recognition, recipes, products, and meals must converge on one canonical backend-confirmed intake flow.
- Product facts: backend provider normalization must not drop available micronutrients, fatty acids, sugar types, water, iodine, selenium, copper, or vitamins before the UI can render them.
- Product facts may explain obvious product micronutrient signals, such as iodine in seaweed/algae, only as guidance when the provider has no numeric value; do not calculate or persist fake micronutrient amounts.
- Photo meal recognition must never accept a generic template food set as visual truth; provider confidence alone is not enough when the title and foods match a known template.
- Photo meal UX must show a clear review/retry state for unavailable analysis; it must not imply a saved or recognized result, and it must not leave users guessing after upload.
- Barcode scanner UX must make the resolved product immediately visible after scan; manual barcode controls, history, and fallback panels are secondary after a confirmed product result.
- Scanner manual product fallback may report confirmed meal/profile state and retryable catalog moderation failure, but visible copy must not describe canonical persistence as local-only.
- Progress overview must show all counted domains up front, including water glass slots, and each overview domain should route to its full detail section.
- Progress overview calculations must live in the tested progress overview model; the UI may render the cards, but it must not quietly collapse the product back into a weight-only chart.
- Product Lookup: Frontend calls the backend product contract only; external catalog provider fallback belongs behind the backend.
- Security/CSP: Frontend `connect-src` must not allow direct external food catalog providers for product lookup.
- Scanner security headers: backend-served app responses must allow `camera=(self)` so barcode scanning is not blocked by Permissions Policy.
- Health endpoints: public `/api/health` and `/api/ready` are liveness/readiness contracts only; detailed diagnostics must stay gated behind debug/admin surfaces.
- Frontend remote backend discovery must accept the sanitized public health contract and must not require provider names or detailed diagnostics from public `/api/health`.
- Public frontend deployments must prefer the canonical configured backend URL over stale stored browser API base URLs. LocalStorage may remember a remote base URL as cache/hint only; it must not override the accepted production backend contract.
- Auth cookies: production frontend/backend split deployments must use `SameSite=None; Secure=true` for restore and authenticated API calls.
- Auth session responses must place access/refresh tokens only into HTTP-only cookies and return user/snapshot data in the JSON body without raw tokens.
- Guided registration must show inline backend-confirmed availability for nickname and email and must not submit account creation unless both fields are confirmed available.
- Configured owner promotion belongs to the explicit awaited access-control bootstrap path, not to fire-and-forget service construction side effects.
- Email verification and reset password tokens may be consumed from URL links only long enough to capture them into runtime state; the browser address bar/history entry must be cleaned before user interaction continues.
- Vercel-served frontend routes must keep `Referrer-Policy: strict-origin-when-cross-origin` so auth link query data is not sent cross-origin.
- Reminders: Canonical service/repository/storage language is `reminders`; legacy medication-reminder naming is compatibility only until a planned migration retires it.
- Reminder adherence reporting must use canonical reminder `events` from the existing reminder manager; period reports may summarize 7/30-day rhythm, but they must not create a second reminder analytics store or infer unconfirmed actions.
- Mobile/PWA: Android, small screens, Telegram WebView, service worker recovery, safe areas, camera runtime, and keyboard behavior are first-class architecture concerns.
- Companion: 3D companion must load lazily/on demand and must not damage core performance.

## Active Contracts

- Backend/cloud is the source of truth for canonical user data.
- Production canonical storage may be MongoDB Atlas or Postgres, but it must be backend-owned, configured explicitly, and non-placeholder.
- Product and meal intake must use a canonical backend-confirmed flow.
- Food logging must keep `FoodCommandCenter` as the primary entry surface for search, barcode, photo, saved products, builder, and catalog contribution; new food inputs such as voice or correction must extend that command surface instead of adding another warehouse.
- Typed and browser-voice food commands must resolve inside `FoodCommandCenter`, require a clear product, quantity, and compatible units, and persist only through `addProductIntakeToCloud`; vague speech/text must search or ask for confirmation instead of saving.
- Product correction after scanner/search/photo review must create a prefilled shared-catalog moderation submission through the existing catalog contribution contract; it must not mutate product facts locally or claim the global catalog changed before moderation confirms it.
- AI meal logging must call canonical product intake with `source=recommendation`, preserve assistant execution in sync context, and refuse visible success when canonical `mealAdded` is not confirmed.
- AI weight logging must append to backend profile `weightHistory`, preserve assistant execution in sync context, and refuse visible success when backend profile restore does not contain the saved entry.
- AI symptom logging must append to backend profile `womenHealth.symptomHistory`, preserve assistant execution in sync context, and refuse visible success when backend profile restore does not contain the saved symptom.
- Women-health profile UI must render backend-confirmed symptom history with safety-bound, non-diagnostic language and no local persistence.
- AI day summaries must be backend-backed read actions with an action receipt; generic model text is not enough when the user asks for the real day summary.
- AI progress reports must be backend-backed read actions over canonical snapshot/profile/water/reminder state; generic model text is not enough when the user asks for weekly or monthly progress.
- AI recipe creation must use canonical meal-template persistence and backend restore confirmation; prompt-only recipe ideas must not be shown as saved recipes.
- AI scanner handoff must return a safe internal navigation receipt for `/meals?mode=barcode`; frontend navigation must validate the route and must not create a second scanner surface or claim a product was scanned.
- AI photo meal handoff must return a safe internal navigation receipt for `/meals?mode=photo`; frontend navigation must validate the route and must not create a second photo meal surface, claim recognition happened, or save an unconfirmed photo estimate.
- AI daily plan drafts must read canonical snapshot/reminder state, remain localized, and clearly state that no meal diary entry or reminder was saved.
- AI daily-plan item application must not save meals/templates directly from a draft; food and protein items open the canonical food flow, and water/review items use canonical typed reminders with backend-confirmed success.
- AI food-plan handoffs must preserve user intent in the route and UI focus; a protein plan item should land in a focused food search, not a blank generic meal screen or a fake saved meal.
- Granular meal/product mutations (`/meal-entries`, `/meal-templates`, `/meal-products`, and `/meal/product-intake`) must return canonical backend `meal` state; frontend must not apply locally computed meal state as success for those granular contracts.
- Product search/barcode resolution must not call external catalogs directly from the frontend.
- External product catalog lookup and provider fallback must run behind backend contracts.
- Backend product lookup may use multiple backend-owned provider hosts for resilience, but the frontend must still call only the Smart Nutrition backend contract.
- Frontend CSP must not reopen direct browser access to external food catalog providers.
- SEO discovery is a release contract: public metadata, `robots.txt`, `sitemap.xml`, and `manifest.webmanifest` must remain aligned with `https://smart-nutrition.club`, while protected app screens and token routes must not be promoted as public search pages.
- Profile mutations must use unified cloud actions, not isolated local state.
- Regular account settings must not fetch or display backup restore points, runtime provider/session chips, or diagnostic details unless the profile role can access the admin center.
- Community mutations must use backend-confirmed canonical `community` state; frontend reducers may prepare drafts, but visible success and state replacement must come from the backend response.
- Warm session restore must recover authenticated user state and critical data after refresh/relogin.
- Remote device id is a non-secret client identifier used for sync conflict ownership; it may persist locally, but it must not contain tokens, user data, or authorization state.
- Production readiness checks must reject placeholder secrets, database URLs, and email settings.
- Production readiness checks must reject cross-site cookie settings that break auth restore.
- Auth cookie helpers must keep `SameSite=None`, `Secure`, `HttpOnly`, `Path=/`, and explicit `Max-Age` behavior covered by tests for split frontend/backend deployments.
- Public health/readiness endpoints must not expose operational diagnostics such as provider internals, limits, warnings, request metrics, Telegram polling state, or database names.
- Storage adapters must not print infrastructure success details such as MongoDB database/host directly to stdout; production diagnostics must stay controlled, sanitized, and intentional.
- AI debug stdout logging is forbidden in production; live AI observability must use controlled audit/status/error telemetry instead of raw debug console output.
- Startup debug diagnostics are development-only; production must not register `/api/debug/startup` or print full startup config/provider dumps.
- Runtime topology must be explicit: a single backend instance may use in-memory cache/rate limiting, but multi-instance production must set `SMART_NUTRITION_REDIS_URL`.
- Frontend health probes must validate public liveness shape (`ok`, `mode=remote-cloud`, `auth=httpOnly-cookie-session`, `storage.engine`) instead of depending on removed diagnostic provider fields.
- Product lookup provider resilience belongs in `productLookupService`; do not reintroduce frontend OpenFoodFacts calls to paper over backend provider failures.
- Photo meal documentation must describe backend vision recognition with honest fallback, not the retired manual-draft-only behavior.
- Photo meal fallback must not substitute user history or generic templates for visual recognition. If providers cannot identify visible food, the draft must stay unselected/empty, use the profile/request language, and explain how to retake or manually add ingredients.
- Environment example files must never contain real-looking provider secrets or duplicate sensitive backend assignments.
- Tracked Git files must exclude runtime/generated artifacts such as `.codex/chrome*`, `.codex/cdp*`, `.codex-remote-attachments`, screenshots, caches, logs, `dist`, and `node_modules`.
- Runtime data under `server/data` is never source code; only `server/data/.gitkeep` may be tracked.
- Vite preload/chunk failures must trigger controlled stale-build recovery instead of leaving a white screen.
- Scanner runtime must be deterministic: permission, stream start, scan, cleanup, and errors must be explicit.
- 3D companion must be lazy/on-demand and isolated from core flows.
- 3D companion runtime must stay 2D on mobile, low-power, data-saver, reduced-motion, and unsupported WebGL contexts even if 3D is selected in profile preferences.
- Route-heavy vendors for scanner, photo compression, markdown, analytics, native bridges, and 3D companion must stay behind route-local lazy boundaries and must not appear in initial `index.html` scripts or modulepreload assets.
- Deploy-sensitive readiness must include `npm run audit:live` after deployment or domain/backend/CORS/SEO changes. The live audit may use only public unauthenticated endpoints and must not include secrets, login, protected user data, or fake success.
- Authenticated deploy smoke must use a dedicated verified smoke account via `SMART_NUTRITION_LIVE_SMOKE_EMAIL` and `SMART_NUTRITION_LIVE_SMOKE_PASSWORD`; the npm script loads ignored `.env` for these values, and personal/admin credentials must not be committed, echoed, or required for routine verification.
- Telegram is a retention layer, not the main application or a separate reminder backend.
- Telegram free text must route through the canonical assistant runtime after deterministic backend-confirmed agent actions are checked.
- Telegram reminder command hints, reminder lists, management buttons, callback feedback, and scheduled reminder notifications must use the connected profile language when a profile is available; Telegram client language is only a disconnected fallback.
- Telegram main-menu quick buttons must use the connected profile language and must route to existing canonical handlers instead of creating a second command/router system.
- Telegram connect-link creation must not be reported as confirmed connection; only backend-confirmed status polling can show connected success.
- Web reminder management must surface canonical reminder event history so taken/done, skipped, and snoozed actions are visible in the app, not only inside Telegram callbacks.
- Event-based medication reminders, such as "after lunch", must remain canonical reminder triggers backed by meal-state delivery; API responses and web UI must expose the trigger, meal type, time window, and offset instead of forcing a fake fixed time.
- Reminder persistence should use `updateUserReminders`; `updateUserMedicationReminders` is a legacy compatibility alias that must delegate to the canonical method and must not contain separate write logic.
- Reminder UI surfaces that create or update backend-confirmed reminders must keep the visible reminder manager synchronized with the returned canonical reminder item.
- AI saved actions must call backend tools/contracts and report only confirmed, pending, or failed states.
- AI visible replies must not say an action is saved until the canonical backend tool succeeds, and failure copy should say Smart Nutrition cloud could not confirm the save rather than exposing backend jargon.
- AI-created reminders must prefer the canonical typed reminder contract (`createReminderFromUserText`) and may use legacy medication/task-specific methods only as compatibility fallback.
- AI favorite/saved-product actions must call backend product search plus canonical `savedProducts` persistence and refuse visible success if restore confirmation is missing.
- AI follow-up reminders must route through the canonical task reminder contract, use explicit local reminder time, and must not become a second reminder system.
- AI conversation history reset must be backend-confirmed; local cleanup is hygiene only and cannot report success by itself.
- Legacy browser-stored assistant history is privacy-sensitive migration debt and must be purged on startup, not treated as canonical memory.
- UI success must be backend-confirmed unless clearly marked as queued/offline.
- Every user action must be recoverable through refresh, relogin, retry, or explicit error handling.

## Open Risks

- Duplicate meal/product/reminder/AI/profile systems can appear if new features bypass canonical contracts.
- Scanner, photo meal, and AI meal flows can drift into separate product/meal persistence paths if future changes bypass canonical product intake.
- Local-only state can masquerade as real persistence.
- Stale PWA/service-worker cache or stale localStorage API routing can make production users see old behavior after redeploy unless deploy-sensitive fixes verify the full live chain.
- Local `server:check` passes required checks with the ignored `.env`; Redis is no longer a warning for explicit single-instance runtime, but horizontal scaling requires Redis.
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
- Live smoke automation now covers public deployment wiring, but authenticated product flows, scanner camera, admin access, and Telegram delivery still require targeted smoke evidence when those areas change.
- Authenticated live smoke automation now covers backend-confirmed login/session/state/water/meal/reminder/Telegram status, but it requires external smoke credentials and still does not replace real-device scanner camera or Telegram delivery checks.
- Any local storage usage must be classified as cache, draft, preference, or bug.
- Stored remote API base URLs are cache/hints only and must not outrank the canonical backend on public deployments.
- Reminder database fields still have legacy `medicationReminders` naming in compatibility paths; write behavior now delegates through canonical reminder methods, and field/schema migration should happen deliberately after production safety is proven.
- Env example guard currently covers common provider key shapes; extend it when adding a new provider or deploy platform secret.
- Vite still reports a large lazy `three-core-vendor` chunk; startup preload is guarded by bundle audit, and mobile/low-power runtime is guarded, but desktop 3D bundle size still needs a deeper Three.js strategy if warning-free builds become mandatory.
- Lint passes with existing warnings; warnings should be burned down without broad rewrites.

## Next Highest-Impact Tasks

1. Set `SMART_NUTRITION_SUPER_ADMIN_EMAIL` in Render to the real owner account email, redeploy Render, and verify `/api/admin/users` returns 200 for that account.
2. Configure Redis before any horizontal backend scaling beyond one instance.
3. Review large bundle chunks and lazy-load high-cost scanner, AI, companion, markdown, and vendor paths where safe.
4. Complete reminder naming migration plan from legacy `medicationReminders` to canonical `reminders`.
5. Run real-device mobile/PWA/Telegram WebView smoke checks for safe areas, keyboard, bottom nav, scanner camera permission, stale chunks, and service worker recovery.
6. Trace canonical product/meal intake end-to-end across manual add, photo add, scanner UI camera scan, and refresh/relogin restore.
7. Check email deliverability DNS/reputation so verification messages stop landing in spam.
8. Trace AI tool execution so saved actions and memory changes cannot be hallucinated.
9. Submit and monitor SEO indexing externally after deployment: Search Console, Bing Webmaster, Yandex/Webmaster, and indexed-result appearance for Smart Nutrition brand queries.
10. Run `npm run audit:live` after every Render/Vercel redeploy that changes app URLs, CORS, SEO discovery, PWA assets, public health, or bundle startup behavior.
11. Create/maintain a dedicated verified production smoke account and run `npm run audit:live:auth` with its credentials after auth, state, meal, reminder, Telegram status, or cookie changes.

## Release Checklist

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run audit:deps`
- `npm run audit:cycles`
- `npm run audit:architecture`
- `npm run audit:seo`
- `npm run audit:live` after deploy or deploy-sensitive configuration changes.
- `npm run audit:live:auth` with a dedicated verified smoke account after auth/state/meal/reminder/Telegram contract changes.
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
