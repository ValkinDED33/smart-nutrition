# Smart Nutrition Quality Gate

This project uses local automated quality checks to keep async, architecture, security, dependency, SEO, bundle, contract, and dead-code issues from returning after manual audits.

## Commands

- `npm run quality` runs the full local gate: lint, build, bundle audit, SEO audit, tests, dependency audit, security audit, cycle audit, dead-code audit, architecture audit, and Smart Nutrition contract audit.
- `npm run release:gate` runs `quality` plus production configuration validation through `server:check`.
- `npm run audit:deps` checks the project production dependency contract.
- `npm run audit:security` checks runtime dependencies with a high severity threshold.
- `npm run audit:bundle` verifies startup bundle constraints and lazy-loaded heavy surfaces.
- `npm run audit:seo` verifies public search discovery files and metadata.
- `npm run audit:cycles` runs Madge against `src` and `server`.
- `npm run audit:dead` runs Knip.
- `npm run audit:architecture` runs dependency-cruiser with `.dependency-cruiser.cjs`.
- `npm run audit:contracts` verifies Smart Nutrition product, architecture, source-of-truth, repository cleanliness, and UX contracts.

GitHub workflow automation is intentionally not part of the tracked repository. Release readiness must stay available through the local npm scripts above; `.github/` remains ignored unless the owner explicitly re-accepts it as project source.

## ESLint Layer

ESLint keeps the existing TypeScript and React Hooks checks and adds warning-level rules for:

- unused imports
- promise chains without catch/return
- nested or callback-based promises
- common security smells
- duplicate strings and identical functions
- import cycles

These start as warnings so the gate can land without a broad refactor. Promote specific rules to errors after the warning count is under control.

## Architecture Rules

Dependency-cruiser blocks:

- circular dependencies
- `src/domain` importing React, MUI, framer-motion, app, pages, widgets, or feature UI
- `src/shared` importing pages or widgets
- `src/companion` importing assistant code or app store
- assistant engine/features importing companion UI/store
- server importing frontend `src`
- widgets importing pages

Pages may compose features, widgets, and shared UI. Widgets may compose features and shared UI.

## Baselines

No broad dead-code or architecture baseline should be added silently. If Knip or dependency-cruiser reports legacy findings that cannot be fixed in the same task, document the ignored paths here with the reason and a cleanup owner/date.

Current baseline:

- ESLint has warning-level security/sonar findings enabled. The first run reported object-indexing and duplicate-string warnings across existing code. They are intentionally warnings so the gate can land without a broad refactor.
- Knip no longer carries a legacy unused-file list. `knip.json` keeps only `vite-env.d.ts` in `ignoreFiles` because Vite ambient declarations are not imported directly.
- Knip ignores unused export/type/duplicate-export reports for `src/**/*.ts`, `src/**/*.tsx`, and `server/**/*.mjs`. Existing public API barrels and shared domain exports need a separate cleanup pass before this can become an error-level dead-export gate.
- Knip has no dependency ignore baseline. Unused dependencies should be removed instead of hidden.

Next cleanup targets:

- Reduce ESLint warning count by validating real `security/detect-object-injection` risks and suppressing safe indexed lookups locally.
- Narrow Knip `ignoreIssues` from broad layer globs to exact files, then eventually remove it.
