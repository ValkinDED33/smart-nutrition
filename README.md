# Smart Nutrition

Frontend meal planner built with React, TypeScript, Redux Toolkit and Vite.

## What the app does

- local registration/login with a persisted profile
- calorie and macro tracking
- meal builder with saved products, templates and recipes
- barcode lookup via Open Food Facts and local fallback products
- Ukrainian and Polish UI

## Getting started

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Notes

- Open Food Facts works directly from the browser and does not require `.env`.
- Product lookup is Europe-first: local products first, then Open Food Facts.
- Auth in this project is still local/demo-oriented and uses browser storage.
