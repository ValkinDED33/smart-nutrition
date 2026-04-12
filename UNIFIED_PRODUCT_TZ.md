# Unified Product Specification

Updated: 2026-04-12

## Product Vision

Build a single product that combines:

- precise nutrition tracking
- adaptive recommendations
- a kind personal assistant
- motivation, progress, rewards, and customization

The app should help users eat better, stay consistent, and feel supported without pressure.

## Core Product Pillars

1. Nutrition intelligence
   - fast meal logging
   - product search, barcode scan, recipes, analytics
   - adaptive calorie targets and useful recommendations

2. Personal assistant
   - warm, respectful, light-humor tone
   - contextual support and guided motivation
   - language-aware behavior and future AI chat

3. Motivation system
   - tasks, points, progress, achievements
   - strategic day-off system
   - meaningful rewards and customization

4. Smooth UX
   - minimal actions
   - low-friction daily flow
   - clear visuals, no overload

## Status Snapshot

### 1. Identity, Language, and Onboarding

- [x] First-run language selection
- [x] Ukrainian and Polish support
- [x] Language switch available anytime
- [x] Selected language stored in profile
- [x] Final end-to-end localization pass for every newer assistant, motivation, and photo surface

### 2. User Profile

- [x] Name, age, gender, weight, height, activity, goal
- [x] Diet style, allergies, exclusions
- [x] Language preference
- [x] Motivation progress and points
- [x] Assistant customization

### 3. Nutrition Tracking

- [x] Quick add flow
- [x] Saved and recent foods
- [x] Barcode scanner
- [x] Product search with fuzzy matching
- [x] Recipes and reusable meal templates
- [x] Inline editing of meal entries
- [x] Repeat-yesterday flow

### 4. Analytics

- [x] Calories by day, week, and month
- [x] Macro balance
- [x] Weight trend
- [x] Deviation and recommendation views

### 5. Motivation Layer

- [x] Daily tasks
- [x] Points for completed tasks
- [x] Visible level and progress
- [x] Achievements
- [x] Task history
- [x] Free weekly day off
- [x] Paid monthly day off

### 6. Assistant Layer

- [x] Assistant identity and communication style
- [x] Supportive nudges and contextual recommendation copy
- [x] Assistant surface in UI
- [x] Local assistant runtime on the dashboard with quick questions and free-form input
- [x] Real AI chat backend via optional remote provider
- [x] Persistent multi-turn assistant memory with manual reset
- [ ] Proactive coaching engine with scheduled nudges

### 7. Rewards and Customization

- [x] Assistant name
- [x] Assistant role and addressing style
- [x] Communication tone
- [ ] Shop-based unlocks and expanded reward catalog

### 8. Reliability and Sync

- [x] Auth and profile persistence
- [x] Cloud sync
- [x] Cross-tab sync
- [x] Backups, export, and account deletion
- [x] Safe confirmations for critical actions

## Critical Remaining Work

- [ ] Photo recognition upgraded from draft flow to production-grade recognition with confidence and correction
- [ ] External ecosystem integrations such as Google Fit and Apple Health
- [ ] Production observability and hardening for long-running cloud usage
- [ ] Proactive coaching engine with scheduled nudges

## Delivery Status

### Phase A: Shared Foundation

- [x] Language in profile
- [x] First-run language onboarding
- [x] Motivation data model
- [x] Assistant customization model
- [x] Unified persistence and sync

### Phase B: Motivation MVP

- [x] Tasks
- [x] Points
- [x] Achievements
- [x] Day-off logic
- [x] Profile UI for progress and history

### Phase C: Assistant MVP

- [x] Assistant identity and tone
- [x] Assistant surface in UI
- [x] Contextual recommendation copy

### Phase D: Assistant Runtime

- [x] Dashboard assistant runtime surface
- [x] Local intent routing for quick questions and free-form prompts
- [x] Local nutrition coach analysis
- [x] Photo-draft runtime with manual correction flow
- [x] Real assistant chat provider with local fallback
- [x] Persistent conversation memory
- [ ] Rich proactive coaching and nudges

### Phase E: Rewards Expansion

- [ ] Shop
- [ ] Unlockables
- [ ] Purchase confirmations
- [ ] Advanced customization

## Current Next Stage

The next active stage is Proactive Coaching and Cloud Hardening.

Implementation focus for this stage:

- build proactive coaching and scheduled nudges on top of the completed runtime layer
- harden cloud observability and long-running remote assistant operations
- preserve honest UX: local contextual help first, remote AI second
- keep photo flow review-first until production-grade recognition is ready
