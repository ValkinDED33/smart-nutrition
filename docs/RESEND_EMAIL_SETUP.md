# Resend email setup

Backend email delivery is used for:

- registration email verification
- password reset links

## Local `.env`

Paste your key from https://resend.com/api-keys:

```env
SMART_NUTRITION_RESEND_API_KEY=re_...
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@smart-nutrition.club
SMART_NUTRITION_EMAIL_FROM_NAME=Smart Nutrition
```

`SMART_NUTRITION_EMAIL_FROM_ADDRESS` must be allowed by your Resend account. In production, use a verified domain sender.

## Render

Set the same backend-only variables in Render service environment:

```env
SMART_NUTRITION_RESEND_API_KEY=re_...
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@smart-nutrition.club
SMART_NUTRITION_EMAIL_FROM_NAME=Smart Nutrition
```

Do not put the Resend key into Vercel frontend variables or any `VITE_*` variable.

## DNS deliverability checklist

Use the exact records shown in the Resend dashboard for `smart-nutrition.club`.
Do not guess selector names or SPF values from this document, because Resend can
generate account-specific records.

Current production sender:

```env
SMART_NUTRITION_EMAIL_FROM_ADDRESS=noreply@smart-nutrition.club
```

Before calling email production-ready, verify:

- Resend domain status is verified in the Resend dashboard.
- DKIM TXT record exists for the selector shown by Resend.
- SPF TXT record exists for `smart-nutrition.club` when Resend requires one.
- DMARC TXT record exists at `_dmarc.smart-nutrition.club`.
- A real registration email lands in inbox or promotions, not spam.

PowerShell DNS checks:

```powershell
Resolve-DnsName smart-nutrition.club -Type TXT
Resolve-DnsName _dmarc.smart-nutrition.club -Type TXT
Resolve-DnsName resend._domainkey.smart-nutrition.club -Type TXT
```

Observed on 2026-07-08: DKIM and DMARC resolved, but no SPF TXT record was
visible at the root domain. A test verification email reached spam, so DNS
sender alignment and mailbox reputation still need follow-up outside the app
code.

## Check

After editing `.env`, run:

```bash
npm run email:check
```

Then restart the backend:

```bash
npm run server:dev
```
