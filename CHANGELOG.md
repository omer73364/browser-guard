# Changelog

## Unreleased

- Add real JavaScript, React, Vue, Angular and Svelte integration apps, production and server rendering builds, hydration and Strict Mode checks.
- Detect minifiers that erase anti-debugger statements and reject `antiDebug` atomically instead of silently reporting it active. Document the required production minifier setting.
- Add regression coverage for stripped and preserved builds, actual Chromium debugger pauses, timer cleanup, native browser interactions and repeated framework teardown.

## 1.0.1 — 2026-10-30

- Correct React, Vue, Angular and Svelte examples to call `destroy()` on unmount; keep `disable()` for reusable pause/resume flows.
- Expand the README with every configuration option, method, alias, return value and event field, plus CDN installation and lifecycle guidance.
- Add GitHub repository, issue tracker and public documentation metadata to the npm package.
- Update website examples, syntax highlighting and favicon.

The runtime API and behavior are unchanged from 1.0.0. Generated build banners now identify 1.0.1.

Validation: library tests, TypeScript declarations, JavaScript syntax checks and browser tests. Framework examples have not yet been validated in complete React, Vue, Angular or Svelte applications.

## 1.0.0 — 2026-10-30

Initial npm release with whole-page and scoped interaction controls, editing exceptions, event subscriptions, lifecycle methods and TypeScript declarations.
