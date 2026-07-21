# Smart Nutrition Final Product Gap Audit

Last reviewed: 2026-06-22

This document is the finish-line audit for turning Smart Nutrition from a large
feature set into a coherent production product. It focuses on gaps that still
matter for real users, not cosmetic code style.

## Executive Verdict

Smart Nutrition is no longer a basic calorie tracker. The project already has a
serious production foundation:

- Remote auth with httpOnly cookie session, email verification, password reset,
  cloud state restore, and onboarding persistence.
- Security headers, rate limits, retrying transactional email, Brevo optional
  marketing sync, health diagnostics, and production runbook.
- Quality gate with lint, build, tests, npm audit, circular dependency audit,
  dead-code audit, and dependency-cruiser architecture checks.
- Food logging with online backend catalog search, OpenFoodFacts and optional
  USDA lookup, saved/recent products, barcode scanner, photo meal assistant,
  quick meal composer, manual product submission, moderation, and admin tooling.
- Assistant system with manifest, context, prompt context, presence, emotion,
  global layer, runtime, backend provider fallback, memory repository, and a
  practical agent layer.
- Telegram integration with account linking, agent chat, and medication
  reminders.
- Companion progression with XP, levels, achievements, inventory/catalog, and
  visible progress UI.

The biggest remaining risk is not "missing features". The risk is that powerful
features still live as separate cards, sections, or hidden flows. Competitors win
because the first 10 seconds of the user journey are extremely direct: scan,
photo, voice, text, barcode, save. Smart Nutrition has the pieces, but the next
work must compress them into one fast daily flow controlled by the assistant.

## Competitive Baseline

Public product references used for this audit:

- Women-health competitors position around cycle, ovulation, pregnancy,
  symptoms, fertility, and personalized insights.
- MyFitnessPal emphasizes barcode scan, meal scan, voice logging, custom goals,
  weight, water, workouts, and fasting.
- FatSecret emphasizes a large food database, barcode scanner, photo/image food
  recognition, food diary, exercise diary, recipes, community, and reports.
- Lifesum emphasizes multimodal meal logging: photo, voice, text, and barcode,
  plus meal plans and diets.

Smart Nutrition should not try to be only a clone of these apps. The strongest
position is:

> AI wellness operating system: nutrition, hydration, medication reminders,
> pregnancy-aware support, companion progression, Telegram, and proactive
> assistant actions.

## What Exists Now

### Food and Product Catalog

Relevant areas:

- `src/pages/MealBuilderPage.tsx`
- `src/features/meal/ProductSearch.tsx`
- `src/features/meal/QuickMealComposer.tsx`
- `src/features/meal/BarcodeScanner.tsx`
- `src/features/meal/PhotoMealAssistant.tsx`
- `src/features/platform/CatalogContributionCard.tsx`
- `server/services/productLookupService.mjs`
- `server/services/platformService.mjs`
- `server/storage/mongo.mjs`

Current state:

- Backend catalog exists.
- User product submissions exist.
- Moderation queue exists.
- Duplicate candidates exist.
- Product search falls back to external providers when the catalog is sparse.
- OpenFoodFacts works without an API key.
- USDA is supported when configured.
- Barcode scanner exists.
- Photo meal assistant exists.
- Quick composer exists.
- Saved/recent products exist.

Gap:

- The UX is still a set of tools, not a single "food command center".
- Voice/text/photo/barcode/manual are not unified into one entry surface.
- User-added products go to the shared backend catalog, but the lifecycle is not
  visible enough in the daily path.

### Assistant and Agent

Relevant areas:

- `src/features/assistant/*`
- `src/assistant/engine/*`
- `server/agent/*`
- `server/services/ai/*`
- `server/repositories/assistantMemoryRepository.mjs`

Current state:

- Assistant has context, prompt context, presence, emotion, global layer, and
  runtime.
- Backend provider routing and fallback exist.
- Agent loop exists.
- Current safe agent intents include water logging, product search, meal logging
  through canonical product intake, weight logging through confirmed profile
  state, symptom logging through confirmed women-health profile state,
  medication/task/typed reminders, day status, water status, and nutrition
  status.

Gap:

- Agent now completes safe catalog-backed food search and meal logging, plus
  backend-confirmed weight, symptom check-ins, and daily summaries, but it still
  needs more practical tools around planning and reporting.
- Missing practical tools: `create_recipe`, `save_favorite`, `generate_report`,
  `open_scanner`, `request_photo_meal_analysis`, and `create_follow_up`.

### Telegram and Medication Reminders

Relevant areas:

- `server/services/telegramService.mjs`
- `server/services/telegramMedicationReminders.mjs`
- `server/services/medicationReminderService.mjs`
- `server/routes/telegram.routes.mjs`

Current state:

- Telegram bot is configured.
- `/start` linking now uses Telegram-safe compact payloads.
- Account linking logs payload receipt, verification, linked user, and database
  update.
- Success reply is `Telegram connected ✅`.
- Medication reminders can be created from natural text.
- Reminders send buttons: taken, snooze, skipped, delete.
- Dose actions are stored in reminder event history.

Gap:

- There is no full web UI for medication schedule and adherence history yet.
- There is no caregiver/family sharing mode yet.
- Medication tracking should stay a reminder/logging feature, not medical
  prescription advice.

### Women Health

Relevant areas:

- `src/domain/profile/womenHealth.ts`
- `src/pages/onboarding/OnboardingWomenHealthPage.tsx`
- `src/features/profile/*`

Current state:

- Women health visibility is gated by female gender.
- Modes exist: none, trying to conceive, pregnant, postpartum.
- Pregnancy week, due date, last period date, doctor confirmation, and notes are
  modeled.

Gap:

- It is a profile/onboarding context, not a full daily module.
- Missing: cycle calendar, symptom tracker, pregnancy week content, medication
  safety prompts, appointments, lab checklist, exportable report, partner/caregiver
  support, and privacy controls for sensitive events.

### Companion

Relevant areas:

- `src/companion/*`
- `src/features/companion/*`
- `src/features/profile/CompanionShopCard.tsx`
- `src/features/assistant-3d/*`

Current state:

- XP, coins, levels, achievements, inventory, and progress UI exist.
- 3D companion is connected.

Gap:

- The companion is still more "progress display" than "daily relationship".
- Companion should react to real assistant events, medication adherence, food
  logging, hydration, and weekly consistency.
- 3D vendor bundle is still heavy and must stay lazy-loaded.

## Top Critical Problems

### 1. Food Logging Is Too Fragmented

Severity: Critical

FILE:
`src/pages/MealBuilderPage.tsx`, `src/features/meal/ProductSearch.tsx`,
`src/features/meal/QuickMealComposer.tsx`, `src/features/meal/BarcodeScanner.tsx`,
`src/features/meal/PhotoMealAssistant.tsx`

PROBLEM:
Food logging is split across multiple visible tools instead of one command
surface.

WHY IT IS A PROBLEM:
Top calorie apps reduce the first action to one obvious entry point. Users do
not care whether the app uses text, barcode, photo, saved products, or external
catalog internally.

RISK:
Mobile users perceive the app as complicated, and powerful tools feel hidden or
like separate "warehouses".

RECOMMENDED FIX:
Create `FoodCommandCenter` as the primary mobile-first entry point. It should
route text, barcode, photo, saved products, recent products, and manual fallback
through one flow.

EXAMPLE CODE:

```ts
type FoodCommandMode = "text" | "barcode" | "photo" | "recent" | "manual";

type FoodCommandResult =
  | { type: "product"; productId: string; grams: number }
  | { type: "meal_draft"; items: Array<{ name: string; grams: number }> }
  | { type: "catalog_submission"; submissionId: string };
```

### 2. Agent Tool Coverage Is Too Small

Severity: Critical

FILE:
`server/agent/agent.intents.mjs`, `server/agent/agent.tools.mjs`,
`server/agent/agent.service.mjs`

PROBLEM:
The agent can log water, search products, add meals through canonical product
intake, log weight through confirmed profile state, log symptoms through
confirmed women-health profile state, and create reminders, but it cannot yet
complete the surrounding planning/reporting loop.

WHY IT IS A PROBLEM:
The assistant is positioned as a worker. A worker must act, not only explain.

RISK:
Users will try natural commands like "сделай отчёт за неделю" or "сохрани это
как любимое" and the assistant will fall back to text advice instead of updating
the product.

RECOMMENDED FIX:
Add safe tools for `create_recipe`, `save_favorite`, weekly/monthly
`generate_report`, and follow-up actions.

EXAMPLE CODE:

```js
const agentTools = {
  addWater,
  addMeal,
  searchProduct,
  createMedicationReminder,
  logWeight,
  logSymptom,
  getDayStatus,
};
```

### 3. Online Catalog Exists, But Needs a Visible Trust Lifecycle

Severity: High

FILE:
`server/services/platformService.mjs`,
`src/features/platform/CatalogContributionCard.tsx`,
`src/features/platform/AdminCenterCard.tsx`

PROBLEM:
The shared backend catalog, submissions, moderation, and duplicates exist, but
the user does not clearly see product trust state in daily logging.

WHY IT IS A PROBLEM:
Nutrition apps live or die by database trust. Users need to understand whether a
product is verified, user-submitted, external, or manually estimated.

RISK:
Incorrect food data can spread silently, or users may think the database is
empty when an external lookup times out.

RECOMMENDED FIX:
Show source and confidence consistently: `verified`, `community`, `external`,
`manual`, `photo_estimate`. Add moderation status in "My submissions".

EXAMPLE CODE:

```ts
type ProductTrustState =
  | "verified"
  | "community_pending"
  | "community_approved"
  | "external"
  | "manual"
  | "photo_estimate";
```

### 4. Medication Reminders Need a Web Control Center

Severity: High

FILE:
`server/services/medicationReminderService.mjs`,
`server/services/telegramMedicationReminders.mjs`

PROBLEM:
Telegram medication reminders work, but the web app does not yet expose a full
schedule and adherence view.

WHY IT IS A PROBLEM:
Medication reminders are now a critical real-life use case. Users need to see,
edit, pause, delete, and audit reminders outside Telegram.

RISK:
Users may create reminders but lose confidence if they cannot inspect them in
the app.

RECOMMENDED FIX:
Create `MedicationRemindersPage` or a profile section with active reminders,
next run, history, taken/skipped rate, and safety disclaimer.

EXAMPLE CODE:

```ts
type MedicationReminderView = {
  id: string;
  title: string;
  dose: string;
  times: string[];
  nextRunAt: string | null;
  adherence7d: number;
};
```

### 5. Women Health Is Modeled But Not a Product Module

Severity: High

FILE:
`src/domain/profile/womenHealth.ts`,
`src/pages/onboarding/OnboardingWomenHealthPage.tsx`

PROBLEM:
Female-only modes exist, but the app does not yet provide dedicated
women-health daily workflows.

WHY IT IS A PROBLEM:
Pregnancy, conception, postpartum, and cycle support are high-trust contexts.
They require explicit UX, privacy, and reporting.

RISK:
The app can collect sensitive context without giving enough visible value back.

RECOMMENDED FIX:
Build `WomenHealth` as a separate product domain: cycle/symptom log, pregnancy
week, doctor-confirmed flag, reminders, appointments, reports, and privacy mode.

EXAMPLE CODE:

```ts
type WomenHealthEvent =
  | { type: "symptom_logged"; symptomId: string; severity: number }
  | { type: "pregnancy_week_updated"; week: number }
  | { type: "appointment_added"; date: string; title: string };
```

### 6. Mobile Reliability Is a Product Risk

Severity: High

FILE:
`src/features/meal/BarcodeScanner.tsx`, `src/features/meal/QuickMealComposer.tsx`,
`src/widgets/GlobalAssistantLayer.tsx`, route guards, app hydration flow

PROBLEM:
Multiple user screenshots showed mobile issues: hidden scanner, bottom nav
overlap, inputs blocked by assistant avatar, "something went wrong" after
language/refresh, and delayed restore after cold backend.

WHY IT IS A PROBLEM:
Most real usage will happen on mobile while the user is eating, shopping, or
taking medication.

RISK:
Users churn after one broken mobile session.

RECOMMENDED FIX:
Add a mobile smoke suite and harden all bottom-fixed UI with safe-area spacing,
route-level error recovery, and scanner availability tests.

EXAMPLE CODE:

```ts
const bottomSafeSpace = "calc(env(safe-area-inset-bottom, 0px) + 92px)";
```

### 7. 3D Companion Bundle Is Still Heavy

Severity: Medium

FILE:
`vite.config.ts`, `src/features/assistant-3d/*`, `src/pages/AiCompanionPage.tsx`

PROBLEM:
`three-vendor` remains around 1 MB after build.

WHY IT IS A PROBLEM:
Users should not pay the 3D cost on first load or unrelated routes.

RISK:
Cold starts and mobile load times stay worse than necessary.

RECOMMENDED FIX:
Keep all 3D companion rendering behind dynamic imports and intersection/route
based loading. Use 2D fallback until the 3D bundle is needed.

EXAMPLE CODE:

```tsx
const CompanionCanvas = lazy(() => import("@features/assistant-3d/CompanionCanvas"));
```

### 8. Favorites and "My Stuff" Are Not Central Enough

Severity: Medium

FILE:
`src/pages/RecipesPage.tsx`, `src/features/meal/ProductSearch.tsx`,
`src/features/meal/TemplateVault.tsx`

PROBLEM:
Saved recipes/products/templates exist in places, but there is no obvious "My"
hub for saved recipes, favorite products, articles, meal templates, and recent
actions.

WHY IT IS A PROBLEM:
Retention depends on returning to personal shortcuts.

RISK:
The user repeats the same search work every day.

RECOMMENDED FIX:
Create `MyLibrary` sections inside Food/Recipes/Profile: saved recipes,
favorites, recent products, own catalog submissions, and articles.

### 9. Observability Is Not Yet Product-Level

Severity: Medium

FILE:
`src/integration/runtime/analytics.ts`, backend metrics, health diagnostics

PROBLEM:
Analytics events exist, but there is no final product funnel dashboard model.

WHY IT IS A PROBLEM:
After launch, you need to know where users fail: registration, verification,
onboarding, first meal, scanner, Telegram connect, first medication reminder.

RISK:
Real user problems stay invisible until users complain.

RECOMMENDED FIX:
Define production funnels and event payloads for first-session activation and
daily retention.

### 10. AI Cost and Provider Routing Need Business Rules

Severity: Medium

FILE:
`server/services/ai/*`, `server/agent/*`

PROBLEM:
Provider fallback exists, but product-level routing rules are still shallow.

WHY IT IS A PROBLEM:
Vision, fast chat, reasoning, and cheap summaries have different cost/latency
needs.

RISK:
Costs grow faster than value once users arrive.

RECOMMENDED FIX:
Route by task: fast chat to low-latency provider, vision to vision model,
daily reports to cheaper summarizer, high-risk nutrition reasoning to stronger
provider with guardrails.

## Top 20 Useful Improvements

1. Build `FoodCommandCenter` as the first screen inside Food.
2. Add agent tools for meal add/search/product lookup.
3. Add web UI for medication reminders and adherence history.
4. Add "My Library" for saved recipes, products, templates, articles, and own
   submissions.
5. Add product trust badges everywhere food data appears.
6. Add product correction/version UI after photo or barcode logging.
7. Add women health dashboard with pregnancy week, symptoms, appointments, and
   reports.
8. Add privacy mode for sensitive health data and analytics exclusion.
9. Add family/caregiver Telegram reminder sharing after explicit consent.
10. Add mobile scanner smoke tests.
11. Add route-level error recovery for mobile refresh/language switch.
12. Add assistant action receipts: "I added 250 ml water", "I saved the product".
13. Add daily proactive plan: morning, midday, evening, night.
14. Add AI usage metrics per provider/task.
15. Add photo meal correction learning: user edits become future hints.
16. Add voice/text meal logging path.
17. Add smart duplicate merge for community catalog products.
18. Add Sentry frontend/backend with release tags.
19. Add route-level code splitting for heavy admin, scanner, photo, and 3D views.
20. Add subscription packaging only after activation metrics are stable.

## Layered Finish Roadmap

### Layer 1: Food Command Center

Goal:
One mobile-first surface for food logging.

Includes:

- Text input with autocomplete.
- Barcode scan button.
- Photo upload/camera button.
- Recent and favorite products.
- Manual fallback.
- Source/trust badges.
- One-tap add.

Done means:
The user can add food in under 10 seconds without scrolling through multiple
sections.

### Layer 2: Agent Tools Expansion

Goal:
The assistant acts as a worker.

Includes:

- Done: `search_product`, `add_meal`, `add_water`,
  `create_medication_reminder`, `create_task_reminder`, typed reminders,
  `log_weight`, `log_symptom`, `generate_day_summary`, and
  `create_follow_up`.
- Remaining: continue expanding higher-value worker tools only through
  backend-confirmed contracts, without adding a second reminder, product, meal,
  or AI system.

Done means:
Telegram and web assistant can update real product, reminder, progress, symptom,
and report state safely, with an action receipt and audit event.

### Layer 3: Product Catalog Lifecycle

Goal:
No empty database feeling.

Includes:

- Backend global catalog.
- External provider fallback.
- User submissions.
- Moderator approval.
- Duplicate merge.
- Product versions.
- Trust badges.
- "My submissions" status.

Done means:
If a product is missing, the user can still add it, save it, and contribute it
to the shared catalog without local-only dead ends.

### Layer 4: Medication Reminder Control Center

Goal:
Medication reminders are trustworthy for real family use.

Includes:

- Web list of reminders.
- Edit/pause/delete.
- Next reminder time.
- Taken/snoozed/skipped history.
- Telegram connection status.
- Safety disclaimer.
- Optional caregiver sharing later.

Done means:
The user can verify what reminders exist without relying only on Telegram chat
history.

### Layer 5: Women Health Module

Goal:
Female/pregnancy flows become real product value, not profile metadata.

Includes:

- Gender-gated visibility.
- Trying-to-conceive mode.
- Pregnancy week mode.
- Doctor-confirmed flag.
- Symptoms and notes.
- Appointment/lab checklist.
- Medication/nutrition reminders.
- Exportable doctor report.
- Strict privacy controls.

Done means:
Women health context changes the app's dashboard, assistant behavior,
reminders, reports, and profile.

### Layer 6: Mobile Stability and Performance

Goal:
The app feels native on phone.

Includes:

- Safe-area bottom spacing.
- No assistant overlap on inputs.
- Scanner availability fallback.
- Route error recovery.
- Language switch without crash page.
- Lazy 3D, photo, barcode, admin, markdown, charts.
- Cold backend fallback with clear retry.

Done means:
Refresh, language switch, scanner, onboarding input, and bottom nav work on real
mobile devices without "something went wrong" loops.

### Layer 7: Observability and Launch Readiness

Goal:
You can see what users actually do.

Includes:

- First-session activation funnel.
- Email verification funnel.
- First meal added funnel.
- Scanner/photo success rate.
- Telegram connect success rate.
- Medication reminder created/taken rate.
- AI cost per task/provider.
- Sentry frontend/backend release tracking.

Done means:
Launch bugs become metrics, not guesses.

## Immediate Next Build Order

1. Food Command Center.
2. Agent meal/product tools.
3. Medication Reminder Control Center.
4. Mobile error recovery and scanner smoke tests.
5. Women Health Module.
6. Performance split for 3D/scanner/photo/admin.
7. Observability funnels.

This order is intentional. Food logging and agent actions are the core daily
value. Medication reminders are a high-trust family use case. Women health is a
large expansion, but it should sit on the same reminder/report/privacy
foundation.

## Production Readiness Estimate

Current foundation readiness: 78%.

Reasoning:

- Infrastructure, tests, security, email, auth, catalog, assistant, Telegram,
  and quality gates are strong.
- Main remaining risk is product cohesion and mobile reliability, not backend
  existence.
- With Layers 1-4 complete, readiness moves closer to 88-90%.
- With Women Health, observability, and performance polish complete, the project
  becomes a credible public beta product.

## Developer Level Estimate

Current codebase level: Strong Middle with Senior-level product ambition.

Why not simply Senior yet:

- The system has many advanced modules, but some are still feature islands.
- A Senior product engineer would compress them into fewer daily workflows and
  enforce product funnels earlier.

Why it is far above junior:

- The backend/runtime/testing/security/assistant/catalog/Telegram foundation is
  already far beyond a normal learning project.
- The right next step is not more random features. It is integration pressure:
  fewer surfaces, stronger flows, clearer ownership.

## Closed In This Patch

Telegram linking was debugged and fixed before this audit was finalized.

Resolved:

- Telegram deep-link payload now uses a compact Telegram-safe token.
- Payload extraction handles `ctx.payload`, `ctx.startPayload`, and raw
  `/start <payload>` messages.
- Verification returns structured details for safe logs.
- Successful linking replies `Telegram connected ✅`.
- Telegram chat id is persisted to the Smart Nutrition account.
- Tests cover compact payload limits, generated start URL, persistence, logs,
  and success reply.
