# Smart Nutrition Best-in-Class Roadmap

This document translates the product vision into an implementation plan for the current codebase.

## Product promise

Smart Nutrition should:

- track food intake with high practical accuracy
- reduce manual input as much as possible
- provide actionable recommendations, not generic advice
- help users cut, maintain, or gain weight with minimal friction
- feel faster and simpler than competing nutrition trackers

## Current baseline

The current project already has a strong MVP foundation:

- local profile with adaptive calorie targets
- meal logging, templates, recipes, barcode scanning, saved products
- calorie and macro tracking
- weekly insights, meal history, and recommendation cards
- target weight, weight progress scale, and weight trend chart
- custom avatar upload with automatic resizing/compression
- micronutrient summary and grouped daily meal overview

Main blockers that still prevent a "best possible" product:

- remote auth and cloud sync exist, but still need production hardening and observability
- fuzzy search exists, but product intelligence still needs broader restaurant/home-dish knowledge
- photo logging is still a draft/manual-review flow, not production recognition
- reminders and habit nudges exist, but orchestration is still lightweight
- assistant runtime now supports remote AI and memory, but proactive coaching and cloud hardening are still missing
- external integrations such as Google Fit / Apple Health are still missing

## Requirement matrix

| Area | Current state | Gap to target | Priority |
| --- | --- | --- | --- |
| User profile | Basic profile, target weight, adaptive calories | Add allergies, diet style, exclusions, dynamic preference engine | P1 |
| Adaptive planning | Partial | Needs automatic recalculation from actual trend without manual check-ins only | P1 |
| Core food logging | Good MVP | Inline edit-anything flow, fewer taps, restaurant and homemade dish shortcuts | P1 |
| Calories and macros | Good | Needs stronger validation and easier correction UX | P1 |
| Micronutrients | Partial | Needs richer daily/weekly micronutrient reporting and deficiency flags | P1 |
| Product search | Good MVP | Expand restaurant coverage, home dish taxonomy, and richer ranking logic | P1 |
| Barcode scanning | Good MVP | Offline cache, better EU coverage, source confidence, faster retry UX | P1 |
| Recipes and meal plans | Partial | Real goal-based plans, recipe import, plan recommendations | P2 |
| Analytics | Partial | Month view, deviation analysis, cleaner charts, progress dashboards | P1 |
| Recommendations | Basic rules-based | Goal-aware scoring engine with specific corrective suggestions | P1 |
| Photo logging | Draft/manual-review flow | Production-grade recognition, confidence score, editable estimate, portion correction | P2 |
| Notifications | Basic reminders and nudges | Rich orchestration, better preference logic, and smarter timing | P2 |
| Security and account data | Production baseline | Hardening, stronger auth paths, audit-safe storage, observability | P0 |
| Sync | Cloud sync MVP | Real-time consistency hardening, better conflict handling, stronger resilience | P0 |
| Assistant runtime | Local runtime plus remote AI fallback and persisted cloud memory | Stronger proactive coaching, richer nudges, and production telemetry | P0 |
| Integrations | Missing | Apple Health, Google Fit, wearable activity import, API connectors | P2 |
| Scalability | Missing | API-first backend, observability, queue jobs, caching, rate limiting | P0 |

## Delivery phases

## Phase 0: Production foundation

Goal: move from local demo-style architecture to a real product base.

Deliver:

- backend API with JWT or OAuth auth
- database for users, meals, products, recipes, weight logs, preferences
- account deletion and data export/delete flow
- cloud sync and session restore across devices
- product service layer for Open Food Facts and future external providers
- secure image upload/storage pipeline for avatars and future meal photos

Success criteria:

- user can sign in from multiple devices and see the same data
- no critical product data depends on browser localStorage only
- demo/test account path is gone from production UX

## Phase 1: Best-in-class tracking core

Goal: make daily food logging dramatically faster and smarter.

Deliver:

- fuzzy search with typo tolerance and synonyms
- favorite foods and one-tap repeat everywhere
- editable meal entries in place
- daily, weekly, and monthly analytics with clean charts
- deviation cards for calories, macros, and micronutrients
- preferences and restrictions: allergies, diets, excluded ingredients
- offline-first barcode cache for recent and user-confirmed products

Success criteria:

- adding a common food takes 3 taps or less
- search feels instant for local data and fast for remote data
- users can correct wrong estimates without friction

## Phase 2: Intelligence layer

Goal: add real value beyond logging.

Deliver:

- recommendation engine with concrete corrective actions
- goal-aware meal suggestions
- confidence-based photo logging pipeline
- user-controlled correction flow after AI estimate
- smarter product ranking based on history and intent

Success criteria:

- recommendations explain what to do next, not just what is wrong
- photo logging never hides uncertainty
- users can approve or correct AI output in seconds

## Phase 3: Habits and ecosystem

Goal: make the app part of daily life, not a standalone tracker.

Deliver:

- reminders and habit controls
- workout/activity logging
- Apple Health / Google Fit / wearable integrations
- data import/export tools
- optional community / challenge layer if the product direction still supports it

Success criteria:

- reminders feel helpful, not spammy
- activity data can inform calorie adaptation
- ecosystem features do not slow the core logging UX

## Architecture target

The long-term target should be:

- modular frontend
- API-first backend
- product-service abstraction layer
- image-processing pipeline
- recommendation service
- background jobs for sync, reminders, and analytics
- observability for search latency, scan success rate, and recommendation accuracy

## UX rules that should never be broken

- key actions in 1 to 2 taps whenever possible
- food add flow under 3 interactions for common cases
- every AI guess must be editable
- graphs must stay simple and fast
- no blocking forms for routine logging
- every slow/uncertain action must surface progress or confidence

## Immediate next build order

1. Observability and cloud hardening
2. Production photo recognition pipeline
3. Stronger product intelligence and restaurant/home-dish coverage
4. Richer reminders, nudges, and proactive coaching
5. Google Fit / Apple Health integrations

## Definition of done for the "best possible" target

- users save meaningful time every day
- the app helps users reach goals, not just record data
- accuracy is transparent and editable
- the product is fast on mobile and desktop
- the system is secure, synced, and extensible
