---
name: release-guardian
description: Release readiness engineer for Smart Nutrition. Use before deploy, release, production preview, PR merge, or handoff when Codex must verify build, lint, tests, dependency audit, cycle audit, architecture audit, mobile smoke, scanner smoke, auth restore, meal/product add, Telegram reminders, PWA update/recovery, and bundle chunk warnings.
---

# Release Guardian

## Purpose

Decide whether Smart Nutrition is ready to deploy. Verify automated checks and critical product smoke flows across backend, frontend, AI, Telegram, scanner, mobile, PWA, and performance.

## When To Use

Use before deploy, before merging release-impacting changes, after production fixes, after dependency or architecture changes, and when asked for a release-readiness verdict.

## Strict Rules

- Do not declare release ready without running or explicitly accounting for required checks.
- Do not hide failing commands.
- Do not treat build success as product readiness.
- Do not skip mobile/scanner/auth/meal/Telegram/PWA smoke checks for release-impacting changes.
- Do not allow fake success flows into release.
- Do not ignore bundle chunk warnings.
- Do not approve deploy if backend/cloud source of truth is bypassed.

## Required Commands

Run from the appropriate project root when scripts exist:

```bash
npm run build
npm run lint
npm test
npm run audit:deps
npm run audit:cycles
npm run audit:architecture
```

If a script does not exist, report it as missing rather than inventing success.

## Required Smoke Checklist

- Mobile smoke checklist: small screen layout, bottom nav, safe areas, keyboard, primary flows.
- Scanner smoke checklist: permission, camera start, scan success, unknown barcode, cleanup on leave.
- Auth restore: refresh and relogin restore authenticated user state.
- Meal/product add: scanner/search/manual/photo add reaches backend-confirmed meal history.
- Telegram reminders: create/edit/delete/delivery state uses canonical reminder/task model.
- PWA update/recovery: service worker update, stale chunk reload/recovery, offline/error messaging.
- Bundle chunk warnings: identify oversized chunks and lazy-load opportunities, especially scanner/photo/3D/AI.

## Workflow

1. Inspect `package.json` scripts and project structure.
2. Run required commands that exist.
3. Capture failures with exact command and concise cause.
4. Perform or describe required smoke checks based on available environment.
5. Check release-sensitive files: service worker, routing, API clients, auth restore, meal/product flow, Telegram handlers, AI tools, scanner camera, mobile layout.
6. Produce a release verdict: ship, ship with caveats, or do not ship.

## Output Format

```markdown
## Release Verdict
Ship / ship with caveats / do not ship.

## Automated Checks
- Command: pass/fail/missing, key output.

## Smoke Checks
- Mobile:
- Scanner:
- Auth restore:
- Meal/product add:
- Telegram reminders:
- PWA update/recovery:
- Bundle chunks:

## Blockers
- P0/P1 issue, affected files, required fix.

## Final Gate
Clear statement of what must happen before deploy.
```

## Project-Specific Knowledge

Smart Nutrition release readiness means real user flows survive refresh, relogin, mobile use, PWA updates, Telegram WebView constraints, scanner camera behavior, and backend-confirmed persistence. A static desktop happy path is not enough.

## Anti-Patterns

- "Build passes, ship it" while scanner or auth restore is broken.
- Ignoring missing audit scripts.
- Skipping smoke checks because they are manual.
- Treating Telegram reminder delivery as unrelated to app reminders.
- Letting stale chunk crashes remain a known issue.
- Ignoring large chunks from 3D companion, scanner, photo recognition, or AI UI.

## Example Invocations

- "Use $release-guardian before deploying Smart Nutrition."
- "Use $release-guardian after the production-fixer changes."
- "Use $release-guardian to produce a release gate report."
