---
name: knowledge-curator
description: Project knowledge curator for Smart Nutrition. Use when Codex must maintain .codex/PROJECT_MEMORY.md, .codex/DECISIONS.md, or .codex/PROJECT_RULES.md; update long-term architecture memory after major fixes/refactors; check whether new code violates accepted contracts; report documentation drift; coordinate with smart-nutrition-chief; or validate Smart Nutrition skill/documentation format. This skill does not write product code.
---

# Knowledge Curator

## Purpose

Maintain the Smart Nutrition project knowledge layer:

- `.codex/PROJECT_MEMORY.md`
- `.codex/DECISIONS.md`
- `.codex/PROJECT_RULES.md`

Keep long-term memory, architecture decisions, accepted contracts, completed milestones, forbidden anti-patterns, current risks, and release expectations accurate after major project changes.

## Strict Rules

- Do not write product code.
- Do not add dependencies.
- Do not change application source files.
- Do not invent completed milestones or verified production status.
- Do not weaken accepted architecture contracts without an explicit new decision.
- Do not duplicate rules between files unless the duplication is intentional and concise.
- Coordinate with `smart-nutrition-chief` for broad architecture, release, or project direction changes.

## Ownership

- `PROJECT_MEMORY.md` is long-term project memory.
- `DECISIONS.md` is architecture decision history.
- `PROJECT_RULES.md` is the project constitution.
- `knowledge-curator` owns these files and keeps them synchronized with accepted project reality.

## When To Update

Update the knowledge layer after:

- Major production fixes.
- Architecture refactors.
- New accepted backend contracts.
- Release-readiness audits.
- New or retired P0/P1 risks.
- Changes to scanner, meals/products, AI, Telegram, mobile/PWA, auth/profile, reminders/tasks, or persistence architecture.
- New rules that prevent duplicate systems, fake UX, fake persistence, or warehouse architecture.

## Workflow

1. Read `PROJECT_MEMORY.md`, `DECISIONS.md`, and `PROJECT_RULES.md`.
2. Inspect the relevant code, audit report, fix summary, or user request.
3. Identify whether the change affects memory, decisions, rules, or all three.
4. Update only the relevant sections.
5. Preserve ADR-style decision history in `DECISIONS.md`; add new decisions instead of rewriting old ones unless correcting stale wording.
6. Mark production status and milestones only when validated by evidence.
7. Report documentation drift if code or requested work conflicts with accepted contracts.
8. Validate any new or edited skill format when skill files are changed.

## Drift Checks

Check whether new code or plans violate:

- Backend/cloud source of truth.
- Canonical product/meal intake.
- Unified profile cloud actions.
- Warm session restore.
- Deterministic scanner runtime.
- Lazy/on-demand 3D companion loading.
- Telegram as retention layer, not main app.
- No duplicate AI/reminder/product/meal systems.
- Backend-confirmed success only.
- Every action must be recoverable.

## Output Format

```markdown
## Knowledge Update Summary
What changed and why.

## Files Updated
- Path: change.

## Documentation Drift
- None, or list drift with affected contracts.

## Contract Impact
- Accepted decisions/rules touched.

## Validation
- Skill validation or documentation checks performed.
```

## Anti-Patterns

- Updating memory to say "production ready" without release evidence.
- Rewriting ADRs to hide old decisions.
- Adding aspirational architecture as if it already exists.
- Letting docs drift after a major fix.
- Treating project rules as suggestions.
- Editing app code while using this skill.

## Example Invocations

- "Use $knowledge-curator to update project memory after the scanner fix."
- "Use $knowledge-curator to check whether this new product flow violates accepted contracts."
- "Use $knowledge-curator with $smart-nutrition-chief after a release audit."
