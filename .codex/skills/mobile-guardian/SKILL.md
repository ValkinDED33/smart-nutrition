---
name: mobile-guardian
description: Mobile, PWA, and Telegram WebView specialist for Smart Nutrition. Use when Codex changes or audits responsive UI, Android behavior, small screens, Telegram WebView, scanner camera, safe areas, bottom navigation, viewport/keyboard behavior, service worker update recovery, stale chunk crashes, or mobile performance.
---

# Mobile Guardian

## Purpose

Protect Smart Nutrition on real phones, PWA installs, and Telegram WebView. Desktop success is not enough. Scanner camera, bottom navigation, keyboard behavior, safe areas, and service worker recovery must work on constrained mobile surfaces.

## When To Use

Use for any UI, scanner, camera, navigation, PWA, Telegram WebView, viewport, keyboard, service worker, bundle, or performance change that can affect mobile users.

## Strict Rules

- Treat Android, small screens, and Telegram WebView as first-class.
- Do not let bottom navigation overlap primary actions or forms.
- Do not let camera previews jump, resize unpredictably, or become hidden behind overlays.
- Do not rely on desktop-only hover interactions.
- Do not hide required controls below unsafe areas.
- Do not ignore keyboard viewport resizing.
- Do not ship stale chunk crashes without a recovery path.
- Do not assume PWA update behavior is fine without checking service worker logic.
- Do not use fake scanner success; camera and lookup states must be honest.

## Detection Checklist

- Camera jumping during scanner open, permission prompt, rotation, or route change.
- Layout overflow below 360px width.
- Bottom nav overlap with CTAs, input fields, camera controls, toast banners, or modals.
- Unsafe area issues on iOS/Android display cutouts.
- Keyboard covering chat, login, search, meal notes, or reminder forms.
- Telegram WebView camera permission or viewport mismatch.
- Stale chunk crash after deployment.
- PWA update prompt, reload, or service worker cache failure.
- Large 3D/scanner/photo bundles loading on unrelated screens.

## Workflow

1. Inspect affected routes/components/styles/service worker files.
2. Identify fixed-position elements, viewport units, safe-area usage, scroll containers, and keyboard-sensitive inputs.
3. Trace scanner camera lifecycle: permission, stream start, active scan, cleanup, route leave, error state.
4. Check Telegram WebView assumptions: viewport height, camera support, auth handoff, back button, safe area.
5. Check PWA update logic: registration, update found, stale chunks, cache reset, reload UX.
6. Verify responsive behavior at phone widths, especially 320px, 360px, 390px, and short heights.
7. Run or request browser/device smoke checks when the change is visual or camera-related.

## Output Format

```markdown
## Mobile Verdict
Ready / blocked / risky.

## Findings
- Severity, file, issue, user impact.

## Required Fixes
- Smallest safe fix per issue.

## Smoke Checklist
- Viewports:
- Telegram WebView:
- Scanner camera:
- Keyboard:
- PWA update:
```

## Project-Specific Knowledge

Smart Nutrition mobile users add food, scan barcodes, chat with the assistant, manage reminders, track water, and view analytics while moving quickly. Camera and add flows must be stable and recoverable. Telegram WebView may have different viewport and permission behavior than Chrome. PWA users may keep old chunks after deploy.

## Anti-Patterns

- Using `100vh` blindly where dynamic viewport units or safe-area compensation are needed.
- Fixed bottom nav without content padding.
- Modals that trap scanner controls or hide permission errors.
- Loading the 3D companion, scanner, and photo recognition code on every route.
- Assuming service worker cache errors are rare enough to ignore.
- Desktop-only visual inspection for mobile-critical changes.

## Example Invocations

- "Use $mobile-guardian to audit the scanner on Android and Telegram WebView."
- "Use $mobile-guardian before changing bottom navigation."
- "Use $mobile-guardian to fix PWA stale chunk recovery."
