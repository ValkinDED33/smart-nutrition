# Smart Nutrition Quality Gate

This project uses automated quality checks to keep async, architecture, security, and dead-code issues from returning after manual audits.

## Commands

- `npm run quality` runs the full gate: lint, build, tests, dependency audit, cycle audit, dead-code audit, and architecture audit.
- `npm run audit:deps` checks runtime dependencies with `npm audit --omit=dev --audit-level=moderate`.
- `npm run audit:security` checks runtime dependencies with a high severity threshold.
- `npm run audit:cycles` runs Madge against `src` and `server`.
- `npm run audit:dead` runs Knip.
- `npm run audit:architecture` runs dependency-cruiser with `.dependency-cruiser.cjs`.

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
- Knip ignores the legacy unused-file list in `knip.json`. These files include old barrel modules, legacy assistant/data layers, and inactive pages that need product/architecture decisions before deletion.
- Knip ignores unused export/type/duplicate-export reports for `src/**/*.ts`, `src/**/*.tsx`, and `server/**/*.mjs`. Existing public API barrels and shared domain exports need a separate cleanup pass before this can become an error-level dead-export gate.
- Knip ignores `@types/react-redux` and `prettier` as dev dependency baseline items. Remove these ignores once the dependency list is cleaned or formatter scripts are added.

Next cleanup targets:

- Reduce ESLint warning count by validating real `security/detect-object-injection` risks and suppressing safe indexed lookups locally.
- Delete or rewire legacy unused files reported in the first Knip run.
- Narrow Knip `ignoreIssues` from broad layer globs to exact files, then eventually remove it.
