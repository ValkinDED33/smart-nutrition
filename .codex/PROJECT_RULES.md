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
14. Do not rush fixes. Slow, verified, root-cause work is mandatory; never ship "quick" UI/code that creates хаос or requires immediate rework.
15. Completion and terminal recovery states must replace the previous input workflow when both shown together would confuse users. For example, after a backend-confirmed registration verification email, password inputs must disappear and the mailbox action becomes the primary UI; if email delivery fails, password inputs must also disappear and the user must get an honest retry/edit recovery panel instead of fake mailbox success.
16. Onboarding completion is one backend-confirmed state-machine action. `Continue` must never secretly complete onboarding, write fake success, or route to profile as a substitute for unfinished personalization.
17. Onboarding conflict recovery must replay the same typed answer patch on the latest backend profile before completion. Female, pregnancy, partner, postpartum, breastfeeding, baby, and family context must not be lost because of a stale auth/profile snapshot.
18. Authenticated users with unfinished onboarding must enter through the explicit continue/finish choice step, not a repeated language/theme start screen.
19. Optional backend capabilities must be honest. Do not expose repository/service methods that return `null` to mean "not supported"; unsupported capabilities must be absent so routes can choose explicit fallback or failure behavior.
20. Female and family-lifecycle features must have a visible user entrypoint when context allows them. Do not hide pregnancy, planning, postpartum, baby preview, or partner-support features only inside a hard-to-discover tab or code path.
21. Combined user/profile saves may report success only when backend persistence returns both confirmed records. Incomplete canonical payloads must be recoverable sync failures, not generic 500s or local UI success.
22. Production transactional email env must be syntactically valid and real-delivery testable. A configured provider with a malformed sender address is a broken release, not a warning.
23. Public landing first viewport must be calm, focused, and non-overlapping. Living AI motion, helper artwork, sliders, accordions, and discovery cards must support the product promise without covering copy, CTAs, proof, or navigation on desktop, mobile, or WebView widths.
24. Do not push tiny partial fixes by default. Work locally in coherent validated batches; push only after a meaningful milestone, a substantial clean checkpoint, or an explicit user request.
25. Unknown storage failures during canonical onboarding/profile completion must become recoverable `STATE_SYNC_UNAVAILABLE` responses, not generic 500s, trapped onboarding, or fake local completion.
26. Web AI, backend AI, and Telegram lifecycle context must read canonical saved profile state. Do not hide pregnancy, planning, postpartum, symptom, baby-preview, or family context because an auth/user gender snapshot is stale.
27. MongoDB profile-state writes must compare the expected cloud version inside the write filter and use a transaction when supported. Separate read-then-write locking is forbidden for canonical profile/snapshot saves.
28. GitHub quality gate must stay aligned with the local release gate. Master/PR checks must not omit bundle, SEO, dead-code, security, architecture, contract, or production config validation.
29. Expired token cleanup must run as startup/scheduled housekeeping, not inside ordinary API request handling.
30. Password reset must save the new password before consuming or deleting reset tokens.

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
- Fixes must be paced for correctness: inspect first, patch narrowly, validate the actual user state, then commit. Speed is not a reason to leave broken composition, duplicated controls, or confusing mixed states.
- Keep a local implementation ledger mentally or in canonical memory during large batches: completed areas, changed contracts, tests added, and remaining risks. Do not push after every small file.

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
- Shipping rushed UI where old form inputs remain visible beside a completed, sent, confirmed, or terminal recovery state.
- Letting onboarding route transitions become canonical completion state or discarding questionnaire answers after a failed final profile save.
- Completing onboarding from a stale profile snapshot that drops women-health or family lifecycle answers.
- Redirecting returning authenticated users into a repeated language/theme setup path when the app already has enough state to show the explicit onboarding choice.
- Advertising an atomic backend capability from a wrapper when the active storage adapter does not implement it.
- Hiding female/family lifecycle features in code-only or tab-only paths without an obvious profile/app entrypoint for eligible users.
- Letting combined profile/user saves continue after a missing user or profile record, then crashing in response shaping or confirming a partial save.
- Letting ordinary storage outages or metadata read failures from `/api/auth/profile-state` escape as `SERVER_ERROR` 500 during onboarding completion.
- Filtering saved women-health or family lifecycle context out of web AI, backend AI, or Telegram prompts only because `user.gender` is stale.
- Checking profile-state version in one Mongo read and then performing an unconditional canonical write that can overwrite another device's update.
- Treating `email.configured=true` as proof that registration emails can be delivered; real delivery requires provider success or the explicit email smoke check.
- Crowding the unauthenticated landing hero with secondary shelves, overlapping companion layers, or decorative motion that makes the product feel chaotic instead of magical.
- Using GitHub/CI as the primary debug loop with many tiny commits and pushes before local build, lint, tests, and contract checks are coherent.
- Weakening CI to a smaller subset than the local quality gate, then treating green GitHub status as production readiness.
- Running expired session/reset/verification token cleanup as a global storage delete scan on every request.
- Consuming a password reset token before the new password is actually persisted.

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
- Can an eligible user actually discover the family/pregnancy/postpartum/baby feature from the visible UI?
- Do web AI, backend AI, and Telegram receive canonical saved family and women-health context even if auth/user snapshot fields are stale?
- Does the Mongo write itself enforce the expected cloud version, or is this only a separate preflight read?
- Does a combined backend save prove both canonical records before any user-facing success?
- If auth/registration email changed, did `npm run email:check` prove either safe configuration or explicit real delivery?
- If landing or assistant visuals changed, did the first viewport stay readable and non-overlapping on desktop and mobile?
- Is this checkpoint coherent enough to push, or should it remain local until the current batch is complete?
- What tests or smoke checks prove the behavior?
- If password recovery changed, can a storage failure leave the reset token usable instead of burning the user's recovery link?
- Did the live production chain prove the same behavior, including stale cache/localStorage failure modes?
