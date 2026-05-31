# Resend email setup

Backend email delivery is used for:

- registration email verification
- password reset links

## Local `.env`

Paste your key from https://resend.com/api-keys:

```env
SMART_NUTRITION_RESEND_API_KEY=re_...
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@your-verified-domain.com
SMART_NUTRITION_EMAIL_FROM_NAME=Smart Nutrition
```

`SMART_NUTRITION_EMAIL_FROM_ADDRESS` must be allowed by your Resend account. In production, use a verified domain sender.

## Render

Set the same backend-only variables in Render service environment:

```env
SMART_NUTRITION_RESEND_API_KEY=re_...
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@your-verified-domain.com
SMART_NUTRITION_EMAIL_FROM_NAME=Smart Nutrition
```

Do not put the Resend key into Vercel frontend variables or any `VITE_*` variable.

## Check

After editing `.env`, run:

```bash
npm run email:check
```

Then restart the backend:

```bash
npm run server:dev
```
