# Browser Guard 1

A dependency-free JavaScript library for whole-page browser interaction controls, with optional scoped areas. Includes independent instances, editing exceptions, event subscriptions, lifecycle cleanup, and TypeScript declarations. No runtime installation or build step is needed to load the browser script.

## Quick start: whole-page protection

```js
import Guard from 'browser-guard';

// Enable copy, selection, context-menu, save-shortcut and print controls.
Guard.enable({
  copy: true,
  select: true,
  rightClick: true,
  savePage: true,
  print: true,
  console: false,
  antiDebug: false,
  consoleAction: 'noop',
  onViolation: (type) => console.log('Guard:', type)
});

Guard.disable();
```

For classic script usage, load the browser build and call `Guard.enable()` after the DOM is ready:

```html
<script src="/vendor/browser-guard/guard.js"></script>
<script>Guard.enable({ copy: true, select: true, rightClick: true, savePage: true, print: true });</script>
```

Forms and explicitly allowed elements remain usable. DevTools heuristics and anti-debugging are opt-in. These are interaction controls, not guaranteed security or DRM.

### Optional scoped instances

```js
const guard = Guard.create({ target: '#article', print: false });
guard.enable();
// On teardown:
guard.destroy();
```

Omit `target` to create an independent controller for the whole document. Framework examples use this default and clean up on unmount.

`create()` configures an inactive instance. `enable()` applies the saved configuration. The defaults are `copy`, `select`, `rightClick`, `savePage`, and `print` enabled, with `console` and `antiDebug` disabled. Supply explicit booleans when creating an instance to change its saved defaults.

Each instance has its own configuration, listeners, subscriptions, styles, and timers. Destroying one instance does not disable another. When guards overlap, an event blocked by either remains blocked. A guard's exception does not override a different guard's event restriction. For predictable selection styling, avoid overlapping guards with contradictory selection exceptions; CSS rules on the same elements follow the browser cascade.

## Installation

Install the package in your application:

```sh
npm install browser-guard
```

For classic script usage after installation:

```sh
mkdir -p public/vendor/browser-guard
cp node_modules/browser-guard/guard.js public/vendor/browser-guard/guard.js
```

Serve `public/` and load `<script src="/vendor/browser-guard/guard.js"></script>` after your content.

## Imports

```js
// Native ESM, in browsers or bundlers:
import Guard, { create } from './guard.mjs';
// Installed/local package consumers can import from 'browser-guard'.
const guard = create({ target: '#article' });
```

```js
// CommonJS:
const Guard = require('browser-guard');
```

The package exports separate ESM and CommonJS entry points, with matching TypeScript declarations. Browser script loading exposes `window.Guard`. AMD is supported too. Importing in an SSR environment is safe; creating or activating a controller requires a browser document. Use one entry point per application: mixing ESM and browser-script builds creates separate library ownership registries.

Edit `src/guard-core.js`, then run `npm run build` to generate `guard.js` and `guard.mjs`. Use `guard.js` as the browser script filename.

## Scope and exceptions

`target` accepts a selector, an element from the current document, or `document` (default). A missing target or invalid selector throws. Create the instance after its target exists; destroy it when removing the target. Targets and exceptions are fixed for the lifetime of an instance.

`allow` accepts CSS selectors. By default it includes:

```js
['input', 'textarea', 'select',
 '[contenteditable]:not([contenteditable="false"])', '[data-guard-allow]']
```

Matched elements and their descendants are exempt from copying, selection, context-menu, save-shortcut, and DevTools-shortcut restrictions. Matching is scoped to the controlled target and applies to dynamically inserted descendants too. A custom `allow` array **replaces** the defaults; use `[]` for no exceptions.

```js
const guard = Guard.create({
  target: document.querySelector('#article'),
  allow: ['input', 'textarea', '[data-guard-allow]', '.copyable'],
});
guard.enable();
```

Selection restrictions are owned CSS rules, so removing them restores the page's original styling without overwriting inline values. Author styles with greater specificity and `!important` may override selection styling. Native selection across multiple scopes or shadow roots is not fully controlled. Copy fallback uses the selected range's common ancestor when the browser delivers the event to a focused element outside the scope; ranges crossing scope boundaries are not blocked by this fallback.

## API

| Method | Behavior |
| --- | --- |
| `Guard.create(options?)` | Returns an inactive independent instance. |
| `guard.enable()` | Restores its saved feature configuration. |
| `guard.enable(options)` | Updates and applies only named options; other active flags stay unchanged. Updated flags become part of the saved configuration. |
| `guard.disable()` | Turns off every feature, preserving configuration and subscriptions. |
| `guard.disable('copy')` | Temporarily disables one feature; an array disables several. |
| `guard.status()` | Returns a fresh snapshot of active flags and `consoleAction`. |
| `guard.on('violation', handler)` | Subscribes and returns an unsubscribe function. |
| `guard.destroy()` | Removes listeners, timers, owned styles, subscriptions, and temporary hiding. Idempotent and final; enable/disable/on throw afterward. |

`lock`, `unlock`, and `unlockAll` are convenience aliases for enable/disable. `Guard.enable()`, `Guard.disable()`, `Guard.on()`, and `Guard.status()` operate a lazy document-wide convenience instance. `Guard.destroy()` releases that instance; the next global activation creates a new one.

Feature flags must be booleans. Invalid updates are rejected before any configuration changes. `onViolation` accepts a callback or `null`; `consoleAction` accepts `noop`, `hide`, or `redirect`.

## Events

```ts
interface ViolationEvent {
  readonly type: 'copy' | 'select' | 'right_click' | 'save_page'
    | 'print' | 'console_open' | 'console_shortcut';
  readonly feature: 'copy' | 'select' | 'rightClick' | 'savePage'
    | 'print' | 'console' | 'antiDebug';
  readonly target: Element;
  readonly timestamp: number; // Date.now(), milliseconds since Unix epoch
  readonly originalEvent: Event | null;
  readonly defaultPrevented: boolean;
}
```

Event records are frozen; their DOM references remain live. Each subscription has its own unsubscribe function, even when the same handler is registered twice. `onViolation(type, event)` can be used alongside subscriptions. All handlers are called before the first thrown handler exception is propagated. `console_open` means the size heuristic triggered, not confirmed DevTools detection. Anti-debugging requests do not emit violation events because requesting a pause does not prove that a debugger paused.

## Page-wide effects

Some browser operations cannot be confined to a DOM region:

- `print` hides only the target in print media. Its notification comes from the window's real `beforeprint` event; it cannot cancel the native print dialog. Exceptions do not apply to printed content.
- `savePage` blocks Ctrl/Command+S only when the event/selection target is in scope. It cannot prevent browser-menu saves or downloads.
- `console` blocks common DevTools shortcuts in scope and checks a **window-wide size heuristic** on activation, resize, and every 500 ms. Its `hide` response hides the instance's target (body for the document-wide controller); `redirect` navigates the whole page to `about:blank`. Hidden elements are restored after detection ends or the control is disabled, respecting other instances still hiding the same target.
- `antiDebug` requests a debugger pause every 1,000 ms. Debugger pauses affect the **whole JavaScript execution context**, including when tools are detached. This feature is independent of `console` and `consoleAction`. It is opt-in and has no effect without an attached debugger with pauses enabled. There is no busy loop or dynamic code generation.

While paused, page controls cannot run. Disable debugger breakpoints and resume, then call `guard.disable('antiDebug')` or close DevTools and reload. Disabling or destroying an instance stops its timers; already queued callbacks check active state before requesting a pause.

These controls are not access controls or DRM. Detached DevTools has no dependable general-purpose page detection signal; the size heuristic can produce false positives. Users can bypass controls by changing debugger settings or page scripts. Shadow DOM, iframes, browser chrome, and cross-origin documents are not protected as part of the parent scope.

## Framework examples

Ready-to-use component examples are in `examples/` and on the website. Each creates a whole-page instance after mounting and calls `disable()` during cleanup. `destroy()` is also available for final disposal of instances with subscriptions:

- [React](examples/ReactArticle.jsx): `useEffect` with returned cleanup. In Next.js, use a client component.
- [Vue](examples/VueArticle.vue): `onMounted` and `onBeforeUnmount`.
- [Angular](examples/AngularArticle.ts): `afterNextRender` and `DestroyRef`.
- [Svelte](examples/SvelteArticle.svelte): `onMount` with returned cleanup; also works in SvelteKit.

The components import the locally installed `browser-guard` package. Framework dependencies belong to the consuming application, not to this library.

## Development and validation

Requires Node.js 20+; development dependencies do not ship with the browser library.

```sh
npm ci
npm run build
npm test
npm run test:types
npm run check
# Download the test engines into the project cache:
PLAYWRIGHT_BROWSERS_PATH=./node_modules/.cache/ms-playwright npx playwright install chromium firefox webkit
npm run test:browser
```

On Linux, the browser engines may require OS libraries; Playwright reports missing dependencies when launching. This workspace uses locally extracted libraries in its WebKit browser cache without modifying system packages. On other Linux hosts, use Playwright’s documented `install-deps` setup if needed.

Browser tests run the same cases in Chromium, Firefox, and WebKit: scoped event handling, allowed editing, selection CSS, print CSS, keyboard handling, and lifecycle cleanup. WebKit coverage is not a certification of every Safari version. Native OS print dialogs and actual DevTools layouts need manual testing. Unit tests include an attached Node debugger to verify repeated anti-debug pauses and cleanup.

`npm pack --dry-run` lists the distributable files. The included demo is still available in `index.html`; run `npm run dev` and open `http://127.0.0.1:8765/`, or open the HTML directly. Keep that terminal running while using the local site; closing its server stops the preview. The old `graphify-out/` map predates the current implementation and must be rebuilt before using it for current architecture details.
