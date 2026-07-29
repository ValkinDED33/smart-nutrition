# Family Wellness Ecosystem

Smart Nutrition is not only a calorie counter. Family Wellness is the long-term product layer that lets one cloud profile move through personal wellness, planning, pregnancy, partner support, postpartum recovery, breastfeeding, baby care, and shared family habits without creating duplicate apps or duplicate data systems.

## Product Goal

Create a family AI wellness ecosystem that supports:

- Personal daily nutrition and hydration.
- Couple planning.
- Pregnancy.
- Partner support.
- Postpartum recovery.
- Breastfeeding context.
- Baby and early-child routines.
- Family habits, goals, and AI discoveries.

The experience must feel like entering a living assistant space, not opening another calculator screen.

## Canonical Architecture

Family Wellness is a lifecycle layer inside the existing Smart Nutrition ecosystem:

```text
Smart Nutrition account
  -> canonical auth user
  -> canonical cloud profile state
  -> lifecycle mode
  -> scoped AI context
  -> scoped Telegram messages
  -> scoped family sharing permissions
```

Allowed lifecycle modes:

- `personal`
- `couple`
- `trying_to_conceive`
- `pregnant`
- `partner`
- `postpartum`
- `breastfeeding`
- `baby`
- `family`

The existing `womenHealth` profile state remains the canonical owner for pregnancy, planning, postpartum, symptom, and baby-preview context. New lifecycle fields must extend canonical profile cloud state or a backend-owned family state contract; they must not create a second local family store.

## Source Of Truth

Backend/cloud is the source of truth.

Allowed frontend local state:

- Pre-auth onboarding draft before account creation.
- UI-only form draft.
- Cache with explicit cloud reconciliation.

Forbidden frontend local state:

- Canonical pregnancy state.
- Canonical baby state.
- Canonical family goals.
- Canonical partner links.
- Canonical AI memory.
- Canonical reminders.

Every persisted action must have `saving`, `confirmed`, `failed`, and `retry` behavior.

## Existing Foundation

The current project already has:

- `womenHealth` profile state.
- Pregnancy week, due date, last-period date, doctor-confirmed flag, notes, and symptom history.
- Baby-preview fields for eye color, zodiac, Chinese zodiac, and probability/disclaimer UI.
- Backend-confirmed partner invite flow through QR/link/code.
- Limited pregnancy sharing contract for partners.
- Pregnancy supplement reminder type.
- AI prompt safety for pregnancy, medication, symptoms, and medical uncertainty.
- Profile cloud actions for women-health saves.

Family Wellness must build on those systems.

## Pregnancy Mode

When lifecycle mode is `pregnant`, the product adapts:

- Nutrition targets.
- Hydration targets.
- Supplement/reminder language.
- AI context and safety.
- Product risk explanations.
- Daily discovery cards.
- Partner sharing summary.

Pregnancy screen should show:

- Pregnancy week.
- Trimester.
- Baby size.
- Baby estimated height/weight when backed by an approved educational table.
- What is happening now.
- What may be happening for the mother.
- Gentle tasks for this week.
- Common checkups to discuss with a clinician.
- Food and supplement safety notes.

All pregnancy content is educational and must include clinician-bound safety for medical questions.

## Food Safety Contract

Pregnancy-related food warnings must explain risk without panic or diagnosis.

Examples:

- Raw fish and raw meat.
- Unpasteurized milk products.
- Alcohol.
- Excess caffeine.
- Liver and high-vitamin-A foods.
- Mold-ripened cheeses when unsafe by local guidance.
- High-mercury fish.

The scanner, product card, photo meal assistant, AI chat, and Telegram assistant must use the same backend/product safety interpretation when this becomes persisted behavior.

## Partner Mode

Partner Mode is a scoped family view, not full account synchronization.

Partner invite methods:

- QR code.
- Link.
- Code.
- Future email.
- Future Telegram handoff.

Partner can see only permission-scoped family context, initially:

- Pregnancy week.
- Due-date range when shared.
- Baby size/milestone.
- Gentle support tips.
- Family goals visible to the link permission.

Partner must not see:

- Full meal diary unless explicitly introduced by a future permission.
- Full weight history unless explicitly introduced by a future permission.
- Private notes unless explicitly shared.
- Auth/session/security data.

## Postpartum Mode

After birth, the assistant may offer a cloud-confirmed transition:

```text
Congratulations.
Would you like to archive pregnancy mode and start postpartum or baby mode?
```

The pregnancy timeline is archived, not deleted. The new mode can track:

- Recovery context.
- Hydration and meals.
- Rest.
- Mood notes with safety escalation.
- Partner support prompts.
- Baby care handoff.

## Breastfeeding Mode

Breastfeeding context adjusts recommendations conservatively:

- Water.
- Calories.
- Protein.
- Omega-3.
- Calcium.
- Iodine.
- Magnesium.
- Vitamin D.

The assistant must not prescribe supplement doses. It can explain why nutrients matter and recommend clinician guidance for individualized needs.

## Baby Mode

Baby Mode should track:

- Baby age.
- Growth measurements.
- Feeding.
- Sleep.
- Diapers.
- Walks.
- Development milestones.

Baby data must be backend-owned and permission-scoped. Parent accounts may share selected baby context, but Smart Nutrition must not turn this into a separate baby app with separate auth or local truth.

## Family Goals

Family goals are shared achievements backed by cloud state.

Examples:

- 100 family walks.
- 30 family dinners.
- 14 days without sweet soda.
- 50 home-cooked meals.
- First postpartum month.
- Preparation for birth.

Family goal progress must be calculated from canonical events where possible and must not be fake celebratory UI.

## AI Behavior

The assistant must act as a project worker:

- Uses profile lifecycle context.
- Uses pregnancy/baby/family context only when available and permission-scoped.
- Explains, supports, and motivates without judgment.
- Never diagnoses.
- Never replaces a clinician.
- Never claims a saved action without backend confirmation.
- Keeps family memory useful, scoped, and erasable.

Example behavior:

```text
Question: Can I eat sushi?
Context: pregnant, week 22, allergies, profile goals.
Answer: explain raw-fish risk, suggest safer cooked options, mention clinician guidance for personal restrictions.
```

## Telegram Behavior

Telegram is a retention and assistant surface, not a separate family app.

Telegram messages must:

- Use the connected profile language.
- Use canonical reminders and AI contracts.
- Respect partner/family permissions.
- Avoid diagnosis and medical certainty.

Examples:

- Pregnancy week starts today.
- Vitamin D reminder after clinician-confirmed routine.
- Partner support suggestion.
- Family goal progress.

## Implementation Roadmap

1. Canonical lifecycle model.
2. Pregnancy screen upgrade.
3. Partner scoped dashboard.
4. Food safety interpretation shared by product/photo/scanner/AI.
5. Family goals backend contract.
6. Postpartum transition flow.
7. Breastfeeding context.
8. Baby mode backend contract.
9. Telegram family assistant messages.
10. AI Discovery Cards for family insights.

## Non-Negotiable Rules

- No duplicate family app.
- No second profile state.
- No local-only family persistence.
- No fake pregnancy, baby, or family success.
- No medical diagnosis.
- No hidden full-account sharing between partners.
- No separate Telegram family truth.
- No dead family buttons.
- No decorative probability claims without clear disclaimer.

## Release Validation

Family Wellness changes require:

- Profile cloud action tests.
- Backend storage tests.
- Partner permission tests.
- AI safety tests.
- Telegram language/permission tests when Telegram copy changes.
- Mobile smoke for onboarding/profile/family screens.
- `npm run release:gate`.
