# Smart Nutrition Project Rules

## Constitution

These rules are mandatory for Smart Nutrition architecture, fixes, audits, and releases. If a requested change violates these rules, stop and route through `smart-nutrition-chief`, `smart-nutrition-brain`, and `knowledge-curator`.

## Strict Rules

1. No duplicate systems.
2. No fake UI success.
3. No local-only canonical persistence.
4. No dead buttons.
5. No second AI brain.
6. No second reminder system.
7. No second product/meal system.
8. No warehouse architecture.
9. Backend-confirmed success only, unless the UI explicitly shows queued/offline state.
10. Every action must be recoverable.
11. Env examples must contain placeholders only, never real-looking provider secrets.
12. Deploy-sensitive fixes are not complete until the live production chain is checked: Git commit on remote, backend endpoint, frontend bundle, CORS, service worker/cache risk, and stale localStorage/base URL risk.
13. Family Wellness must be one lifecycle layer inside the existing account/profile/cloud/AI/Telegram ecosystem, not a second family app or local family store.

## Enforcement

- Search for existing systems before creating new files, stores, routes, services, models, hooks, jobs, or handlers.
- Extend canonical contracts instead of creating parallel paths.
- Treat local state as cache, draft, preference, or temporary UI state unless backend reconciliation is explicit.
- Treat toasts, badges, and optimistic UI as untrusted until backend confirmation exists.
- Every user-facing action must have loading, success, error, and recovery behavior.
- Every saved action must survive refresh/relogin when the domain requires persistence.
- Every release-impacting change must run through validation or report exactly what could not be validated.
- Every new provider/deploy secret must update env example guards before release.
- Every fix that changes frontend/backend contracts must verify production routing, not just local tests: confirm the pushed commit, probe the live backend route, inspect the live frontend bundle for the new contract, and check whether PWA/service-worker cache or saved browser state can mask the change.
- Family, pregnancy, partner, postpartum, breastfeeding, and baby features must extend canonical profile or backend-owned family contracts with scoped permissions.

## Forbidden Anti-Patterns

- Creating `service2`, `newStore`, `fixed`, `final`, `temp`, or similarly unowned architecture files.
- Adding `localStorage` as the real database.
- Showing "saved", "added", "scheduled", or "sent" without backend confirmation.
- Adding another reminder/task model for Telegram.
- Adding another product/meal model for scanner, AI, photo recognition, or recipes.
- Adding another AI memory or assistant runtime disconnected from backend tools.
- Adding a separate pregnancy/baby/family store, Telegram flow, or partner dashboard that bypasses canonical profile cloud state and permission-scoped backend sharing.
- Creating UI controls that do nothing.
- Catching errors and still showing success.
- Committing real-looking API keys or credentials into env templates, docs, project memory, or examples.
- Duplicating sensitive env assignments so the last value silently overrides the safe placeholder.
- Loading scanner, photo recognition, 3D companion, or heavy AI UI on unrelated critical routes.
- Rewriting broad areas when a narrow root-cause fix is possible.
- Declaring a deployed fix complete after local build/tests only, without checking whether production users can still be pinned to stale service-worker assets, cached chunks, or old localStorage API routing.

## Recoverability Standard

Every meaningful user action must support at least one recovery path:

- Confirmed persisted state from backend.
- Retry after error.
- Explicit queued/offline state with reconciliation.
- Restore after refresh/relogin.
- Clear user-visible failure with no false success.

## Review Standard

Before accepting a change, ask:

- What canonical system owns this?
- What backend contract confirms success?
- Does this survive refresh/relogin?
- Does this create a second source of truth?
- Does this work on mobile/PWA/Telegram WebView if relevant?
- What happens when auth expires, network fails, or backend rejects the action?
- Did this introduce a new provider/deploy secret, and is the example guarded against leaks?
- Does this family/pregnancy/partner/baby feature use canonical lifecycle/profile/sharing state with explicit permissions?
- What tests or smoke checks prove the behavior?
- Did the live production chain prove the same behavior, including stale cache/localStorage failure modes?
