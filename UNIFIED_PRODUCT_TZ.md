# Unified Product Specification

## Product Vision

Build a single product that combines:

- precise nutrition tracking
- adaptive recommendations
- a kind personal AI assistant
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

## Unified Functional Scope

### 1. Identity, Language, and Onboarding

- first-run language selection
- Ukrainian and Polish support
- language switch available anytime
- selected language stored in profile
- assistant and UI both follow the selected language

### 2. User Profile

- name, age, gender, weight, height, activity, goal
- diet style, allergies, exclusions
- language preference
- motivation progress and points
- assistant customization

### 3. Nutrition Tracking

- quick add flow
- saved/recent foods
- barcode scanner
- product search with fuzzy matching
- recipes and reusable meal templates
- inline editing of meal entries

### 4. Analytics

- calories by day, week, month
- macro balance
- weight trend
- deviation and recommendation views

### 5. Motivation Layer

- daily tasks
- points for completed tasks
- visible level/progress
- achievements
- task history
- free weekly day off
- paid monthly day off

### 6. Assistant Layer

- assistant identity and communication style
- future AI chat and contextual coaching
- supportive nudges, not pressure

### 7. Rewards and Customization

- assistant name
- assistant role/addressing style
- communication tone
- future shop-based unlocks for visual and behavioral customization

### 8. Reliability and Sync

- auth and profile persistence
- cloud sync
- cross-tab sync
- backups
- safe confirmations for critical actions

## Delivery Order

### Phase A: Shared Foundation

- language in profile
- first-run language onboarding
- motivation data model
- assistant customization model
- unified persistence and sync

### Phase B: Motivation MVP

- tasks
- points
- achievements
- day-off logic
- profile UI for progress and history

### Phase C: Assistant MVP

- assistant identity and tone
- assistant surface in UI
- contextual recommendation copy

### Phase D: AI Runtime

- real assistant chat
- photo analysis runtime
- richer proactive coaching

### Phase E: Rewards Expansion

- shop
- unlockables
- purchase confirmations
- advanced customization

## Current Start Point

This repository already contains a strong nutrition-tracking base.

The first implementation slice for the unified product should:

- connect language to profile state
- add first-run language selection
- add motivation state, tasks, points, and achievements
- add assistant customization state
- surface the new system in profile UI
