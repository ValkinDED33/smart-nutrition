# Transactional email setup

Backend email delivery is used for:

- registration email verification
- password reset links
- partner invitation links

Smart Nutrition uses one canonical transactional email service:

- Brevo is the primary provider when `SMART_NUTRITION_BREVO_API_KEY` is configured.
- Resend is the reserve provider when `SMART_NUTRITION_RESEND_API_KEY` is configured.
- UI success is allowed only after the canonical service returns `ok: true`.

## Local `.env`

Use Brevo as the primary transactional provider:

```env
SMART_NUTRITION_BREVO_API_KEY=...
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@smart-nutrition.club
SMART_NUTRITION_EMAIL_FROM_NAME=Smart Nutrition
```

Optionally keep Resend as reserve:

```env
SMART_NUTRITION_RESEND_API_KEY=re_...
```

`SMART_NUTRITION_EMAIL_FROM_ADDRESS` must be allowed by the active provider account. In production, use a verified domain sender.

## Render

Set the same backend-only variables in Render service environment:

```env
SMART_NUTRITION_BREVO_API_KEY=...
SMART_NUTRITION_RESEND_API_KEY=re_...
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@smart-nutrition.club
SMART_NUTRITION_EMAIL_FROM_NAME=Smart Nutrition
```

Do not put Brevo or Resend keys into Vercel frontend variables or any `VITE_*` variable.

## DNS deliverability checklist

Use the exact records shown in the active provider dashboard for `smart-nutrition.club`.
Do not guess selector names or SPF values from this document, because providers can
generate account-specific records.

Current production sender:

```env
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@smart-nutrition.club
```

Before calling email production-ready, verify:

- Brevo domain status is verified in the Brevo dashboard.
- Resend domain status is verified in the Resend dashboard if Resend reserve is enabled.
- DKIM TXT record exists for the selector shown by the active provider.
- SPF TXT record exists for `smart-nutrition.club` when the active provider requires one.
- DMARC TXT record exists at `_dmarc.smart-nutrition.club`.
- A real registration email lands in inbox or promotions, not spam.

PowerShell DNS checks:

```powershell
Resolve-DnsName smart-nutrition.club -Type TXT
Resolve-DnsName _dmarc.smart-nutrition.club -Type TXT
```

Observed on 2026-07-08: DKIM and DMARC resolved, but no SPF TXT record was
visible at the root domain. A test verification email reached spam on Resend, so DNS
sender alignment and mailbox reputation still need follow-up outside the app code.

## Check

After editing `.env`, run:

```bash
npm run email:check
```

Then restart the backend:

```bash
npm run server:dev
```
