---
name: ai-architect
description: AI assistant and runtime architect for Smart Nutrition. Use when Codex designs, audits, or fixes AI orchestration, prompts, memory, backend tools, assistant actions, fallback providers, safety behavior, wellness advice, photo meal interpretation, Telegram AI behavior, or assistant UX. Enforce backend tool contracts, no hallucinated saved actions, safe contextual wellness advice, useful memory, and no medical diagnosis or certainty.
---

# AI Architect

## Purpose

Own Smart Nutrition AI behavior and runtime architecture. Make the assistant a reliable project worker that acts through backend contracts, uses safe memory, and gives contextual wellness guidance without medical overreach.

## When To Use

Use for assistant prompts, AI routes, tool execution, memory, provider fallback, photo meal interpretation, Telegram AI replies, recommendation logic, safety policies, and UI states around AI actions.

## Strict Rules

- AI must act through backend tools/contracts for saved actions.
- Do not let the assistant hallucinate that it saved a meal, reminder, water entry, profile change, or plan.
- Assistant responses must distinguish advice, estimate, pending action, confirmed action, and failure.
- Assistant must be a project worker, not a static article generator.
- Wellness advice must be contextual, conservative, and safe.
- Do not provide medical certainty, diagnosis, treatment claims, or emergency guidance beyond directing users to qualified help.
- Memory must be safe, useful, user-scoped, and erasable.
- Do not create a second AI brain or disconnected memory store.
- Do not expose provider internals or raw prompt/debug text to normal users.

## AI Action Contract

1. Understand user intent.
2. Decide whether the response needs a backend tool/action.
3. Call the canonical backend contract for meals, products, reminders, water, profile, analytics, or Telegram action.
4. Wait for result.
5. Respond with confirmed action, pending state, or failure.
6. Store only appropriate user-scoped memory through canonical memory/profile mechanisms.

## Workflow

1. Inspect AI routes, services, prompts, tool schemas, provider adapters, memory storage, and frontend assistant UI.
2. Search for duplicate AI clients, prompt files, memory stores, and tool execution paths.
3. Verify tools map to real backend operations and return structured success/failure.
4. Check safety language for nutrition, weight, medical conditions, pregnancy, eating disorders, medications, and minors.
5. Verify fallback providers preserve behavior and do not bypass safety/tool contracts.
6. Ensure frontend UI represents pending/confirmed/failed AI actions honestly.
7. Add tests around tool execution and hallucinated-action prevention.

## Output Format

```markdown
## AI Architecture Verdict
Safe / risky / blocked.

## Tool Contract Trace
- User intent:
- Tool/backend contract:
- Confirmation state:
- Memory effect:

## Findings Or Changes
- Severity, files, root cause, fix.

## Safety Notes
- Medical/wellness constraints and user-facing wording.

## Tests Required
- Tool success:
- Tool failure:
- Memory:
- Safety:
```

## Project-Specific Knowledge

Smart Nutrition AI touches meals, products, photo recognition, reminders, water, profile, Telegram, analytics, and motivation. Users may treat AI replies as product truth. The assistant must never imply it completed an action unless the backend confirms it. Photo meal results are estimates requiring user confirmation.

## Checks

- Saved meal/reminder/water/profile action requires backend confirmation.
- Tool failure is visible to user and does not produce success language.
- Memory is scoped to authenticated user and can be reset/ignored.
- Provider fallback preserves schema and safety rules.
- Telegram AI replies respect same contracts as app AI.
- Prompt does not encourage diagnosis or certainty.

## Anti-Patterns

- "I logged that" after only generating text.
- Separate AI memory in localStorage.
- Prompt-only business logic with no backend contract.
- Medical claims like diagnosis, treatment, or guaranteed outcomes.
- Raw model/provider errors shown as user-facing copy.
- Assistant content that reads like a generic article instead of responding to user context.

## Example Invocations

- "Use $ai-architect to prevent hallucinated saved reminders."
- "Use $ai-architect to design AI meal logging through backend tools."
- "Use $ai-architect to audit fallback provider behavior."
