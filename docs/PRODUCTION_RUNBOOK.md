# Smart Nutrition Production Runbook

Operational checklist for deploying and verifying Smart Nutrition in production.

## Public URLs

- Frontend: `https://www.smart-nutrition.club/`
- Backend: `https://smart-nutrition-sk5r.onrender.com`
- Health: `https://smart-nutrition-sk5r.onrender.com/api/health`
- Ready: `https://smart-nutrition-sk5r.onrender.com/api/ready`
- Debug startup: `https://smart-nutrition-sk5r.onrender.com/api/debug/startup`

## Vercel Env

Required:

```env
VITE_SMART_NUTRITION_API_BASE_URL=https://smart-nutrition-sk5r.onrender.com/api
```

Optional:

```env
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=
```

Firebase variables are optional and should be set only when Firebase features are enabled.

## Render Env

Required:

```env
SMART_NUTRITION_MONGO_URI=
SMART_NUTRITION_JWT_SECRET=
SMART_NUTRITION_APP_BASE_URL=https://smart-nutrition.club
SMART_NUTRITION_CORS_ORIGINS=https://smart-nutrition.club,https://www.smart-nutrition.club
SMART_NUTRITION_AUTH_COOKIE_SAME_SITE=None
SMART_NUTRITION_AUTH_COOKIE_SECURE=true
SMART_NUTRITION_RESEND_API_KEY=
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@smart-nutrition.club
SMART_NUTRITION_EMAIL_FROM_NAME=Smart Nutrition
SMART_NUTRITION_SUPER_ADMIN_EMAIL=owner@example.com
```

`SMART_NUTRITION_SUPER_ADMIN_EMAIL` is the owner bootstrap. On backend start,
the matching existing user is promoted to `OWNER`; if the account is created later
and no owner exists yet, registration bootstraps it as `OWNER`.

For the live project, set this Render variable to the real owner account email,
then redeploy Render so the startup promotion runs. Do not commit the personal
owner email to the repository.

Optional marketing:

```env
SMART_NUTRITION_BREVO_API_KEY=
SMART_NUTRITION_BREVO_LIST_ID=
```

Optional Telegram assistant:

```env
SMART_NUTRITION_TELEGRAM_BOT_TOKEN=
SMART_NUTRITION_TELEGRAM_BOT_USERNAME=@SmartNutritionAssistBot
SMART_NUTRITION_TELEGRAM_CONNECT_TOKEN_TTL_MS=1800000
```

Telegram is optional. If it is not configured, registration, auth, sync, and assistant UI must keep working.

Medication reminders are delivered by the backend Telegram worker. For time-critical reminders, keep the Render service awake with a paid always-on instance or an external uptime monitor. If Render sleeps, reminders are sent only after the backend wakes again.

Optional Render keepalive for test/free-tier deployments:

```env
SMART_NUTRITION_KEEPALIVE_ENABLED=true
SMART_NUTRITION_KEEPALIVE_URL=https://smart-nutrition-sk5r.onrender.com/api/health
SMART_NUTRITION_KEEPALIVE_INTERVAL_MS=600000
SMART_NUTRITION_KEEPALIVE_TIMEOUT_MS=8000
```

This internal keepalive can keep an already awake free Render instance warm by pinging `/api/health` every 10 minutes. It is not a replacement for a paid always-on instance or an external monitor, because it cannot run while the instance is already asleep.

Optional online product lookup:

```env
SMART_NUTRITION_OPEN_FOOD_FACTS_ENABLED=true
SMART_NUTRITION_USDA_API_KEY=
SMART_NUTRITION_PRODUCT_LOOKUP_TIMEOUT_MS=3500
```

OpenFoodFacts works without an API key. USDA FoodData Central needs `SMART_NUTRITION_USDA_API_KEY`. `SMART_NUTRITION_GOOGLE_API_KEY` is for Google AI/Gemini in this project, not a nutrition database key.

Optional AI providers:

```env
SMART_NUTRITION_OPENROUTER_API_KEY=
SMART_NUTRITION_OPENROUTER_MODEL=
SMART_NUTRITION_GROQ_API_KEY=
SMART_NUTRITION_GROQ_MODEL=
SMART_NUTRITION_GOOGLE_API_KEY=
SMART_NUTRITION_GOOGLE_MODEL=
SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER=
```

Note: cookie env names are `SMART_NUTRITION_AUTH_COOKIE_SAME_SITE` and `SMART_NUTRITION_AUTH_COOKIE_SECURE`.

## DNS

- `smart-nutrition.club` points to Vercel.
- `www.smart-nutrition.club` points to Vercel.
- Resend sending domain must be verified with the DKIM/SPF records shown in the Resend dashboard.
- `noreply@smart-nutrition.club` is the current production sender.
- As of 2026-07-08, live DNS showed DKIM and DMARC records, but no root SPF TXT record; one verification email landed in spam. Treat deliverability as a DNS/reputation follow-up, not an app-code bug.
- Brevo domain is verified if Brevo marketing sync is enabled.

## Deploy

Vercel:

1. Push to the production branch or redeploy the latest deployment.
2. Use **Clear build cache** after dependency, Vite config, or env-related build issues.

Render:

1. Update env first when needed.
2. Manual deploy latest commit after env changes.
3. Use **Clear build cache** only when dependency/build artifacts look stale.

## Smoke Test

Run after every production deploy:

1. Open `https://www.smart-nutrition.club/`.
2. Check `/api/health` returns `ok: true`.
3. Check `/api/ready` returns `ready: true`.
4. Register a new user.
5. Confirm verification email arrives from Resend.
6. Verify email and confirm session is created.
7. Log in again after logout.
8. Complete onboarding and confirm assistant name/avatar persist.
9. Add a meal.
10. Search for a common product and confirm `/api/products/search` returns online products from the backend response.
11. Add water.
12. Update weight.
13. Open the global assistant.
14. Open profile account settings and connect Telegram if the Telegram env is enabled.
15. Confirm the Telegram bot opens and `/start` connects the account.
16. In Telegram, check `/help`, `/today`, `/water`, and `/nutrition`.
17. Create a medication reminder with `/addmed Вітамін D 1 капсула щодня о 09:00`.
18. Check `/meds` shows the active medication reminder.
19. Send free text `Я випив 300 мл води` and confirm the assistant agent adds water.
20. Send free text `Що по воді?` and confirm the bot returns hydration status.
21. Confirm disconnect works from the profile.
22. If analytics is enabled, confirm key events appear in PostHog/provider logs.

## Auth Smoke Test

Run this when auth, onboarding, email, sessions, or profile sync changes:

1. Register a new account with a fresh email.
2. Confirm the registration page shows the pending "check your email" state.
3. Receive the Resend verification email.
4. Open the verification link and confirm it creates a session.
5. Complete onboarding, including assistant name and avatar.
6. Reload the app and confirm onboarding does not reopen.
7. Log out.
8. Log in with the verified account and confirm onboarding does not repeat.
9. Confirm assistant name/avatar still appear in profile and global assistant UI.
10. Request a password reset.
11. Open the reset link, set a new password, and confirm redirect to login.
12. Log in with the new password.
13. Confirm the reset flow did not change onboarding/profile state.

## Common Failures

- `401 /api/auth/refresh` before login is normal.
- `503` during registration usually means Resend sender/domain/env delivery issue.
- CORS error means the frontend domain is missing in `SMART_NUTRITION_CORS_ORIGINS`.
- "Cloud service is temporarily unavailable" usually means `VITE_SMART_NUTRITION_API_BASE_URL` is wrong or missing `/api`.
- Empty product search usually means external lookup is disabled, OpenFoodFacts is unreachable, or USDA key/timeout needs checking.
- Resend delivery unavailable means sender domain, API key, or `SMART_NUTRITION_EMAIL_FROM_ADDRESS` needs checking.
- Telegram disabled in profile means `SMART_NUTRITION_TELEGRAM_BOT_TOKEN` or `SMART_NUTRITION_TELEGRAM_BOT_USERNAME` is missing on Render.
- Telegram link expired means the user should press **Connect Telegram** again in profile.
- If `/api/health` shows `telegram.polling=false`, check `telegram.starting`, `telegram.retryScheduled`, and `telegram.lastStartError`. A `409 Conflict` usually means the same bot token is running somewhere else or an old webhook/poller is still active.
- Medication reminders arriving late usually means the Render instance slept, Telegram polling stopped, or the bot token was rotated without redeploying.
- If `/api/health` shows `keepAlive.enabled=true` but `keepAlive.running=false`, verify `SMART_NUTRITION_KEEPALIVE_URL` and redeploy Render. If `keepAlive.lastError` is set, check the returned status code and timeout.
- `/api/ready` failing in production usually means storage, cache, static build, or required email config is not ready.
- Brevo failures should not block registration verification; check logs and Brevo env/domain/list setup.

## Rollback

Vercel:

1. Open project deployments.
2. Promote the previous healthy deployment.
3. Recheck frontend and smoke test.

Render:

1. Redeploy the previous known-good commit.
2. Restore previous env values if the incident came from configuration.
3. Recheck `/api/health`, `/api/ready`, registration verification, and login.

Env rollback checklist:

- `VITE_SMART_NUTRITION_API_BASE_URL`
- `SMART_NUTRITION_MONGO_URI`
- `SMART_NUTRITION_JWT_SECRET`
- `SMART_NUTRITION_APP_BASE_URL`
- `SMART_NUTRITION_CORS_ORIGINS`
- cookie SameSite/Secure env
- Resend API key and sender
- Brevo API key/list id
- Telegram bot token/username
- owner bootstrap email
- keepalive env
- product lookup env
- AI provider keys/models/order
