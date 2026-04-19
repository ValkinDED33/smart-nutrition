# Smart Nutrition

Smart Nutrition is a nutrition-tracking app focused on fast food logging, adaptive calorie planning, clear analytics, and practical guidance instead of generic dashboard noise.

## Current product level

The current codebase is a strong frontend MVP with:

- local registration/login with persisted profile data
- adaptive calorie targets and target-weight progress
- calorie, macro, and basic micronutrient tracking
- meal logging, recipes, templates, saved foods, and grouped meal history
- barcode scanning with Open Food Facts and local fallback data
- free photo meal draft mode with mandatory manual review
- dashboard assistant runtime with quick questions, follow-up chips, remote AI fallback, and persistent cloud conversation memory
- weight trend view, daily overviews, and recommendation cards
- avatar presets plus custom avatar upload with automatic resize/compression
- account export and delete-account controls
- optional backend auth and cloud snapshot sync when the local API is running
- device-aware cloud sync with conflict detection for stale multi-device writes
- SQLite-backed local API storage with legacy JSON migration support
- repository/service server structure with normalized profile and meal-state endpoints

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

To run the local API-first auth/data layer as well:

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
- `NODE_ENV`
- `SMART_NUTRITION_DB_PATH` if you do not want the default SQLite location

Optional assistant runtime upgrade:

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
- Open Food Facts works directly from the browser and does not require `.env`.
- Product lookup is Europe-first: local products first, then Open Food Facts.
- Photo logging is now a free draft/review flow rather than paid AI vision recognition.
- Assistant Runtime now uses a provider layer with honest fallback: local contextual answers stay available, and a remote AI runtime can be enabled through the backend without rewriting the UI.
- When `SMART_NUTRITION_ASSISTANT_API_KEY` and `SMART_NUTRITION_ASSISTANT_MODEL` are configured, the backend exposes `/api/ai`, stores short multi-turn conversation memory in SQLite, and lets the dashboard resume or reset the cloud conversation safely.
- The assistant backend now supports a provider chain with automatic fallback between Groq, Google AI Studio, OpenRouter, and other OpenAI-compatible runtimes when multiple credentials are configured.
- `/api/health` now exposes per-provider assistant runtime status, including failure cooldown state for flaky providers.
- If the backend on `http://localhost:8787` is available, the app prefers remote auth and cloud snapshots automatically.
- If the backend on `http://localhost:8787` is available, the app prefers remote auth and syncs profile/meal state through dedicated backend endpoints automatically.
- Remote mode now keeps a cached cloud snapshot/meta locally, so session restore and cloud status stay responsive even through short backend interruptions.
- The server now validates environment configuration on startup and refuses weak default JWT secrets in `production`.
- Remote accounts now support `log out all sessions` in addition to current-session logout.
- The Node backend can serve the built frontend directly when `SMART_NUTRITION_SERVE_STATIC=true`.
- Without the backend, the app falls back to browser-only auth/storage so the MVP still works offline.
- The backend now uses SQLite at `server/data/smart-nutrition.sqlite` and can migrate data from the old `server/data/db.json` format if that file exists locally.
- Server state is no longer stored only as one snapshot blob: profile and meal data are also persisted in normalized SQLite tables and exposed through `/api/profile-state` and `/api/meal-state`.
- Auth now sits behind a provider layer, so backend/cloud auth can replace the local provider without rewriting the pages.
- Assistant runtime now also sits behind a provider layer: local contextual answers stay available, while remote AI can be enabled with persisted cloud memory when configured.
- The roadmap priority is now to move next toward proactive coaching, production-grade photo recognition, and cloud hardening.
