# Smart Nutrition

Smart Nutrition is a nutrition-tracking app focused on fast food logging, adaptive calorie planning, clear analytics, and practical guidance instead of generic dashboard noise.

## Current Product Level

The current codebase is a production-oriented Smart Nutrition system with:

- backend-first registration, login, email verification, password reset, account export, and account deletion
- warm session restore with profile and meal state recovered through the backend/cloud contract
- adaptive calorie targets, target-weight progress, macro targets, and body progress tracking
- meal logging, recipes, templates, saved foods, recent foods, grouped meal history, and micronutrient summaries
- barcode scanning through the backend product lookup contract with Open Food Facts and optional USDA/provider fallback
- product nutrition facts with localized labels, additives, allergens, vitamins, minerals, and explicit catalog status
- photo meal analysis as a review-first flow that must never save unconfirmed AI guesses
- assistant runtime with backend provider fallback, persistent cloud conversation memory, Telegram assistant integration, and local degradation when the cloud is unavailable
- water tracking, reminders, medication/task flows, Telegram retention, community, analytics, admin/moderation surfaces, and 3D companion progression
- Mongo/Postgres/SQLite-capable backend storage selected by environment, with backend/cloud treated as the source of truth in production

## Product direction

The main roadmap for taking this project from MVP to "best possible" nutrition tracker lives here:

- [ROADMAP.md](./ROADMAP.md)
- [PRODUCT_ARCHITECTURE_BLUEPRINT.md](./PRODUCT_ARCHITECTURE_BLUEPRINT.md)

That roadmap covers:

- production auth and cloud sync
- fuzzy search and better product intelligence
- monthly analytics and deviation dashboards
- stronger recommendation engine
- photo logging with confidence and manual correction
- notifications, integrations, and scalability work
- target modular architecture for the expanded nutrition + AI + community product

## Getting started

```bash
npm install
npm run dev
```

Run the backend as well for any realistic auth, sync, assistant, product lookup, scanner, Telegram, or reminder work:

```bash
npm run server:dev
npm run dev
```

To build the frontend and let the Node API serve the built app from `dist`:

```bash
npm run build
npm run start
```

Create a local environment file from the example before production-style runs:

```bash
copy .env.example .env
```

Set at least:

- `SMART_NUTRITION_JWT_SECRET`
- `SMART_NUTRITION_DATABASE_PROVIDER`
- the matching database URL/URI for the selected provider

Keep local `.env` frontend-safe. `npm run server:check` selects production
readiness mode internally, so local builds do not need `NODE_ENV=production` in
`.env`. Deployment hosts such as Render or Docker should still set
`NODE_ENV=production` in their service environment.

Assistant runtime configuration:

- `SMART_NUTRITION_ASSISTANT_API_KEY`
- `SMART_NUTRITION_ASSISTANT_MODEL`
- `SMART_NUTRITION_ASSISTANT_BASE_URL`
- `SMART_NUTRITION_ASSISTANT_API_PATH`

## Docker

The repository now includes a single-container deployment baseline:

```bash
docker compose up --build
```

The container:

- builds the frontend
- serves the built SPA from the Node API process
- exposes the app and API on port `8787`
- persists SQLite data in a named Docker volume

## Vercel frontend + separate backend

Vercel hosts only the static frontend for this project. Registration, login, sync,
password reset, admin tools, and AI endpoints still need the Node backend running
on a public URL.

Set the frontend build variable on Vercel to the public backend API, not loopback URL:

```env
VITE_SMART_NUTRITION_API_BASE_URL=https://smart-nutrition-sk5r.onrender.com/api
```

Set the matching backend variables on the API host:

```env
NODE_ENV=production
SMART_NUTRITION_APP_BASE_URL=https://smart-nutrition.club
SMART_NUTRITION_CORS_ORIGINS=https://smart-nutrition.club,https://www.smart-nutrition.club
SMART_NUTRITION_AUTH_COOKIE_SAME_SITE=None
SMART_NUTRITION_AUTH_COOKIE_SECURE=true
```

Never deploy a frontend build with `VITE_SMART_NUTRITION_API_BASE_URL` pointing
to `loopback URL`; from a deployed site that means the visitor's own computer.

## Scripts

```bash
npm run dev
npm run server:dev
npm run start
npm run lint
npm run build
npm run test
```

## Notes

- The current build does not require any paid API keys for the default local-preview flow.
- Product lookup goes through the backend product contract; browser code must not call external food catalogs directly.
- Product lookup is resilient through backend-owned catalog/provider fallback.
- Photo logging is a review-first flow: uncertain AI output must be corrected or confirmed before saving.
- Assistant Runtime now uses a provider layer with honest fallback: local contextual answers stay available, and a remote AI runtime can be enabled through the backend without rewriting the UI.
- When `SMART_NUTRITION_ASSISTANT_API_KEY` and `SMART_NUTRITION_ASSISTANT_MODEL` are configured, the backend exposes `/api/ai`, stores short multi-turn conversation memory in SQLite, and lets the dashboard resume or reset the cloud conversation safely.
- The assistant backend now supports a provider chain with automatic fallback between Groq, Google AI Studio, OpenRouter, and other OpenAI-compatible runtimes when multiple credentials are configured.
- Public `/api/health` and `/api/ready` expose sanitized liveness/readiness only; detailed provider diagnostics belong behind gated debug/admin surfaces.
- If the backend on `https://smart-nutrition-sk5r.onrender.com` is available, the app prefers remote auth and syncs profile/meal state through dedicated backend endpoints automatically.
- Remote mode now keeps a cached cloud snapshot/meta locally, so session restore and cloud status stay responsive even through short backend interruptions.
- The server now validates environment configuration on startup and refuses weak default JWT secrets in `production`.
- Remote accounts now support `log out all sessions` in addition to current-session logout.
- The Node backend can serve the built frontend directly when `SMART_NUTRITION_SERVE_STATIC=true`.
- Frontend-only storage is not production truth. It is only a local cache/degradation path until backend-confirmed sync is available.
- The backend can use SQLite for local development and MongoDB/Postgres for hosted production, depending on `SMART_NUTRITION_DATABASE_PROVIDER`.
- Server state is not stored only as one snapshot blob: profile and meal data are persisted through normalized backend state contracts and exposed through `/api/profile-state` and `/api/meal-state`.
- Auth now sits behind a provider layer, so backend/cloud auth can replace the local provider without rewriting the pages.
- Assistant runtime now also sits behind a provider layer: local contextual answers stay available, while remote AI can be enabled with persisted cloud memory when configured.
- The roadmap priority is now to move next toward proactive coaching, production-grade photo recognition, and cloud hardening.
