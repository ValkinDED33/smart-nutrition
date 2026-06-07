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
```

Optional marketing:

```env
SMART_NUTRITION_BREVO_API_KEY=
SMART_NUTRITION_BREVO_LIST_ID=
```

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
- Resend sending domain is verified with DKIM/SPF.
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
10. Add water.
11. Update weight.
12. Open the global assistant.
13. If analytics is enabled, confirm key events appear in PostHog/provider logs.

## Common Failures

- `401 /api/auth/refresh` before login is normal.
- `503` during registration usually means Resend sender/domain/env delivery issue.
- CORS error means the frontend domain is missing in `SMART_NUTRITION_CORS_ORIGINS`.
- "Cloud backend unavailable" usually means `VITE_SMART_NUTRITION_API_BASE_URL` is wrong or missing `/api`.
- Resend delivery unavailable means sender domain, API key, or `SMART_NUTRITION_EMAIL_FROM_ADDRESS` needs checking.
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
- AI provider keys/models/order
