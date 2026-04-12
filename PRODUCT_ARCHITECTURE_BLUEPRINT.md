# Product Architecture Blueprint

## Goal

Build the product as a reliable, layered system that supports:

- nutrition tracking
- AI-assisted food analysis
- detailed recipe construction
- fridge-based recipe matching
- community recipes and articles
- moderation and admin workflows
- a central assistant UX

The architecture must stay practical:

- clear domain boundaries
- predictable data ownership
- simple mobile-first flows
- production-safe auth and moderation
- room for future AI and integrations without rewriting the app

## Product Principles

1. Core logging stays fast.
   Common food logging should remain the shortest path in the whole product.

2. AI is always controllable.
   Every AI result must be editable, reviewable, and explain its confidence.

3. Community is a separate domain, not mixed into nutrition storage.
   Social content, moderation, and gamification must not pollute meal-tracking logic.

4. Catalog data is versioned and moderated.
   Shared product data must grow safely over time instead of becoming user-generated chaos.

5. Admin power is explicit and auditable.
   Sensitive actions must be permission-checked and logged.

## Target Information Architecture

### Main mobile navigation

- `Home`
- `Scan`
- `Add`
- `Community`
- `Profile`

### Secondary sections

- `Recipe details`
- `Article details`
- `Fridge`
- `Saved items`
- `Notifications`
- `Moderation`
- `Admin`

### Admin-only area

- `Users`
- `Reports`
- `Product submissions`
- `Content moderation`
- `Audit logs`
- `Roles and permissions`

## Target Domain Map

The product should be split into bounded contexts.

### 1. Identity and Access

Owns:

- users
- roles
- sessions
- refresh tokens
- 2FA state
- bans and warnings

Key rules:

- role model: `USER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`
- `SUPER_ADMIN` is seeded manually and cannot be demoted or deleted from UI
- `ADMIN` and `SUPER_ADMIN` require 2FA

### 2. Nutrition Tracking

Owns:

- day entries
- goals
- macro and calorie calculations
- daily and weekly summaries
- recent and favorite foods

Key rules:

- food add flow stays independent from community content
- nutrition totals come from stored product or recipe snapshots, not mutable live joins

### 3. Product Catalog

Owns:

- shared product database
- barcode lookup
- local/manual product submissions
- moderation states for products
- product version history

Key rules:

- shared product lifecycle: `pending`, `approved`, `rejected`
- `pending` products are visible only to the author and moderators
- `approved` products become globally searchable
- product edits create new versions

### 4. AI Analysis

Owns:

- photo analysis requests
- raw AI result
- corrected user result
- confidence
- accuracy/error history

Key rules:

- save both AI output and user-corrected output
- error metrics are part of analytics, not only transient UI state

### 5. Recipe Engine

Owns:

- structured recipes
- ingredient states
- preparation methods
- step graph
- serving and final-weight calculation

Key rules:

- recipe entity must support ingredient-level cooking metadata
- recipe nutrition is calculated from ingredient snapshots plus weight transformation

### 6. Fridge

Owns:

- household ingredient list
- fridge-based recipe matching
- missing ingredients list

Key rules:

- fridge data is user-owned
- recipe match percentage is computed separately from recipe publication

### 7. Community

Owns:

- recipe publications
- article publications
- likes
- saves
- feeds

Key rules:

- publication record wraps content metadata and moderation state
- recipe entity and recipe publication are different objects

### 8. Moderation

Owns:

- reports
- moderation queue
- warnings
- temporary bans
- permanent bans
- product review queue

Key rules:

- moderation must work across posts, articles, recipes, products, and users
- warning and ban actions are logged in audit storage

### 9. Gamification

Owns:

- points ledger
- levels
- unlockables
- reputation

Key rules:

- points are event-based, not direct mutable totals without history
- user trust can later influence product-submission limits

### 10. Notifications

Owns:

- in-app notifications
- email queue
- notification preferences
- moderation notifications

### 11. Integrations

Owns:

- Open Food Facts adapter
- Google Fit adapter
- Apple Health adapter
- future provider adapters

## Frontend Target Structure

The current frontend should evolve toward this shape:

```text
src/
  app/
    providers/
    router/
    store/
  pages/
    home/
    scan/
    add/
    community/
    profile/
    moderation/
    admin/
  features/
    auth/
    assistant/
    nutrition/
    catalog/
    recipes/
    ai-analysis/
    fridge/
    community/
    moderation/
    gamification/
    notifications/
  entities/
    user/
    product/
    recipe/
    article/
    report/
  shared/
    api/
    ui/
    lib/
    config/
    types/
```

### Frontend rules

- Pages compose features, but business logic lives in feature or entity layers.
- API calls should be grouped by domain, not by a single giant auth/state client.
- Assistant UI should be a shared shell surface that consumes domain events.
- Admin UI must be isolated from user flows.

## Backend Target Structure

The current backend is strong enough to evolve from, but it should move away from a single large route file and storage file.

```text
server/
  app/
    createServer.mjs
    middleware/
    routing/
  modules/
    auth/
      routes.mjs
      service.mjs
      repository.mjs
      policy.mjs
    access/
    users/
    foods/
    recipes/
    ai/
    fridge/
    posts/
    articles/
    reports/
    moderation/
    gamification/
    notifications/
    integrations/
  infrastructure/
    db/
    storage/
    search/
    mail/
    media/
    jobs/
  lib/
    errors/
    validation/
    security/
```

### Backend rules

- Every module owns its routes, service, repository, validation, and permission rules.
- Cross-domain writes go through services, never directly through route handlers.
- Audit logging is a shared infrastructure concern.
- Product provider integrations stay behind adapters.

## Data Model Layers

### Identity and access

- `users`
- `roles`
- `user_roles`
- `sessions`
- `refresh_sessions`
- `two_factor_methods`
- `warnings`
- `bans`
- `audit_logs`

### Nutrition and profile

- `profiles`
- `weight_history`
- `nutrition_goals`
- `meal_entries`
- `meal_entry_items`
- `favorite_products`
- `recent_products`
- `assistant_preferences`
- `notification_preferences`

### Product catalog

- `products`
- `product_barcodes`
- `product_versions`
- `product_submissions`
- `product_submission_reviews`
- `product_reports`

### Recipes

- `recipes`
- `recipe_versions`
- `recipe_ingredients`
- `recipe_steps`
- `recipe_step_ingredients`
- `recipe_publications`

### AI analysis

- `ai_food_analyses`
- `ai_food_analysis_items`
- `ai_food_analysis_corrections`
- `ai_accuracy_events`

### Fridge

- `fridge_items`
- `shopping_suggestions`

### Community

- `posts`
- `articles`
- `content_images`
- `content_tags`
- `likes`
- `saved_items`

### Moderation

- `reports`
- `report_targets`
- `moderation_actions`
- `content_flags`

### Gamification

- `points_ledger`
- `levels`
- `unlocks`
- `user_unlocks`
- `user_reputation`

### Notifications

- `notifications`
- `notification_deliveries`

## Product Entity Notes

### Product

Must support:

- `name`
- `brand`
- `barcode`
- `category`
- `photo`
- `nutrients_per_100g`
- moderation status
- version history

### Meal entry item

Must support:

- `name`
- `weight`
- `state`
- `size`
- `type`

### Recipe ingredient

Must support:

- `name`
- `weight`
- `state`
- `type`
- `brand`
- preparation metadata

### Recipe step

Must support:

- `stepNumber`
- `description`
- ingredient references
- operations such as add, remove, update

## API Surface by Domain

### Auth and access

- `/auth`
- `/auth/refresh`
- `/auth/2fa`
- `/auth/logout`
- `/auth/logout-all`

### Foods and catalog

- `/foods/search`
- `/foods/barcode/:barcode`
- `/foods`
- `/foods/submissions`
- `/foods/submissions/:id/review`

### Recipes

- `/recipes`
- `/recipes/:id`
- `/recipes/:id/publish`

### AI

- `/ai/food-analysis`
- `/ai/food-analysis/:id/correction`

### Fridge

- `/fridge`
- `/fridge/matches`

### Community

- `/posts`
- `/articles`
- `/likes`
- `/saves`

### Moderation

- `/reports`
- `/moderation/actions`

### Admin

- `/admin/users`
- `/admin/roles`
- `/admin/logs`
- `/admin/products`

## Reliability and Security Rules

Non-negotiable:

- JWT access and refresh tokens
- password hashing with `bcrypt`
- request rate limits
- role-based authorization
- 2FA for `ADMIN` and `SUPER_ADMIN`
- audit log for admin and moderation actions
- soft-delete or status transitions for community content
- version history for shared product edits
- no silent AI save without user confirmation

## UX System Rules

- Main user jobs must fit the 5 bottom-nav structure.
- The assistant is a supporting shell component, not a blocking chatbot wall.
- Every expensive or uncertain operation shows progress, status, and confidence.
- Community screens must not slow down Add/Scan flows.
- Admin screens must never leak into normal user navigation.

## Recommended Delivery Order

### Phase 0. Architecture baseline

- freeze target architecture
- split backend into domain modules
- define permissions and audit contract
- define normalized database expansion plan

### Phase 1. Identity and access

- add roles
- add permission guards
- add 2FA
- add audit log
- add ban and warning model

### Phase 2. Shared product catalog

- shared products table
- product submissions
- moderation workflow
- approved and pending visibility rules
- duplicate detection

### Phase 3. Core nutrition upgrade

- richer food item model
- improved add flow
- inline editing
- stable favorites and repeat flows

### Phase 4. Recipe engine upgrade

- detailed ingredients
- cooking metadata
- serving and final-weight calculations
- recipe versioning

### Phase 5. AI analysis persistence

- persist AI result
- persist corrected result
- accuracy metrics
- reuse corrected data in analytics

### Phase 6. Fridge

- fridge inventory
- recipe match engine
- missing ingredients output

### Phase 7. Community and articles

- feed
- publish flow
- likes and saves
- duplicate checks

### Phase 8. Moderation and admin

- reports
- review queues
- admin pages
- warning and ban actions

### Phase 9. Notifications and integrations

- in-app plus email notifications
- moderation notifications
- Google Fit and Apple Health adapters

## First Implementation Slice

The smartest next slice is not UI polish. It is the platform foundation needed by every later block.

Build next:

1. role and permission model
2. audit log infrastructure
3. shared product catalog schema with moderation states
4. modular route structure for `foods`, `reports`, and `admin`
5. frontend navigation expansion plan for `Community` and `Admin`

This gives the project a clean spine before adding the wider startup scope.

## Definition of Done for the New Scope

The architecture is aligned when:

- every product block maps to a clear domain module
- every admin action is permission-checked and auditable
- the nutrition core remains the fastest user flow
- user content and shared catalog data are moderated safely
- AI output is saved with confidence and correction history
- the app can expand without turning the main codebase into a monolith
