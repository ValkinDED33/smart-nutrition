---
name: production-fixer
description: Senior production fixer for Smart Nutrition. Use when Codex must implement fixes for audit findings, production blockers, persistence bugs, broken UX flows, AI/Telegram/scanner/mobile regressions, or architecture drift. Always inspect current code first, fix real root causes in priority order, avoid cosmetic-only patches and new dependencies, preserve existing contracts, update tests, and run checks.
---

# Production Fixer

## Purpose

Fix Smart Nutrition production issues with senior engineering discipline. Convert audit findings into narrow, durable changes that preserve architecture and user trust.

## When To Use

Use after a production audit, CI failure, regression report, broken user flow, data persistence bug, scanner/mobile/PWA failure, Telegram reminder issue, AI tool behavior issue, or release-blocking defect.

## Strict Rules

- Inspect current code first.
- Fix the highest-impact real root cause first.
- Do not make cosmetic-only patches for production defects.
- Do not add dependencies unless the existing stack cannot solve the issue safely.
- Preserve existing API contracts unless the contract is the root cause and migration is handled.
- Keep changes narrow and reversible.
- Update or add tests for changed behavior.
- Run relevant checks and report failures honestly.
- Do not create duplicate systems, fake persistence, fake success, or dead UI.
- Do not rewrite broad areas to avoid understanding the current flow.

## Fix Workflow

1. Reproduce or trace the issue from user action to data source.
2. Identify severity and choose the highest-impact fix.
3. Locate canonical owner: frontend component/hook/store, API client, backend route/controller/service, database model/schema, job/Telegram handler, AI tool.
4. Search for existing contracts and duplicate implementations.
5. Patch the canonical path only.
6. Make UI states honest: loading, pending, confirmed, error, offline queued if supported.
7. Add or update tests around the broken contract.
8. Run targeted checks, then broader checks when risk justifies it.
9. Summarize root cause, files changed, verification, and residual risk.

## Output Format

```markdown
## Fix Summary
Root cause and fix in 2-4 sentences.

## Files Changed
- Path: purpose.

## Verification
- Command/check: result.

## Residual Risk
- Any remaining risk or skipped check.
```

## Project-Specific Knowledge

Smart Nutrition has tightly connected flows. A meal/product fix may affect scanner, manual search, photo recognition, AI assistant actions, analytics, and refresh/relogin restore. A reminder fix may affect frontend scheduling UI, backend reminder model, Telegram delivery, and task state. AI must act through backend tools/contracts and must not claim saved actions without confirmation.

## Checks

- Run the narrowest available tests first.
- Prefer existing package scripts; inspect `package.json` before inventing commands.
- For release-impacting changes, consider `npm run build`, `npm run lint`, `npm test`, `npm run audit:deps`, `npm run audit:cycles`, and `npm run audit:architecture` when available.
- Smoke test affected UI flows when a dev server/browser is available.
- For mobile/scanner/PWA changes, verify small viewport behavior and camera/update recovery paths.

## Anti-Patterns

- Patching a symptom in a component while the backend contract remains broken.
- Adding a second local store to make UI pass.
- Catching errors and still showing success.
- Swallowing AI/Telegram action failures.
- Replacing a stable API shape without migration.
- Adding dependencies for simple state, validation, formatting, or fetch behavior already handled in the app.

## Example Invocations

- "Use $production-fixer to fix the P0 fake meal add success."
- "Use $production-fixer to address these production-auditor findings."
- "Use $production-fixer to repair Telegram reminder persistence without creating a second system."
