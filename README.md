<div align="center">

# 🛡️ Browser Guard

### Take control of how visitors interact with your page ✨

A tiny, **dependency-free** JavaScript library to control copy, selection, right-click, save, print and more, for the whole page or just one area.

![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ESM%20%2B%20CJS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

[🌐 Playground](https://omer73364.github.io/browser-guard/) · [📚 Documentation](https://omer73364.github.io/browser-guard/docs.html) · [📦 npm](https://www.npmjs.com/package/browser-guard)

</div>

---

## ✨ Features

|     | Feature                   | What it does                                        |
| --- | ------------------------- | --------------------------------------------------- |
| 📋  | **Copy control**          | Block copying of page content                       |
| 🖱️  | **Selection control**     | Disable text selection                              |
| 🚫  | **Right-click control**   | Block the context menu                              |
| 💾  | **Save shortcut**         | Block `Ctrl/Cmd + S`                                |
| 🖨️  | **Print control**         | Hide content in print media                         |
| 🧪  | **DevTools heuristics**   | Optional size heuristics and debugger pause requests       |
| 🎯  | **Scoped areas**          | Protect the whole page or only `#article`           |
| ✍️  | **Editing exceptions**    | Inputs, textareas and `contenteditable` stay usable |
| 🧩  | **Independent instances** | Each guard has its own config and cleanup           |
| 🔔  | **Event subscriptions**   | Get notified on every violation                     |
| 🧹  | **Clean lifecycle**       | `destroy()` removes everything it added             |
| 📦  | **Zero setup**            | No build step needed to load the browser script     |

## 🚀 Quick Start

### 📥 Install

```bash
npm install browser-guard
```

### ⚡ Protect the whole page

```js
import Guard from "browser-guard";

Guard.enable({
  copy: true,
  select: true,
  rightClick: true,
  savePage: true,
  print: true,
  console: false,
  antiDebug: false,
  consoleAction: "noop",
  onViolation: (type) => console.log("Guard:", type),
});
```

### 🌐 Classic `<script>` tag

```html
<script src="https://cdn.jsdelivr.net/npm/browser-guard@1.0.1/guard.js"></script>
<script>
  Guard.enable({
    copy: true,
    select: true,
    rightClick: true,
    savePage: true,
    print: true,
  });
</script>
```

Load the version-pinned script **after** your page content. No installation or bundler is needed for this approach.

<details>
<summary>📂 Optional: serve the installed script yourself</summary>

```bash
mkdir -p public/vendor/browser-guard
cp node_modules/browser-guard/guard.js public/vendor/browser-guard/guard.js
```

Serve `public/` and load the script **after** your content.

</details>

> 💡 Forms and explicitly allowed elements stay usable. DevTools heuristics and anti-debugging are **opt-in**.

> ⚠️ **Heads up:** these are _interaction controls_, not guaranteed security or DRM.

## 🎯 Scoped Instances

Protect only one part of the page:

```js
const guard = Guard.create({ target: "#article", print: false });
guard.enable();

// When permanently removing this controller
guard.destroy();
```

- Leave out `target` to control the whole document.
- `create()` makes an **inactive** instance, and `enable()` applies it.
- Defaults: `copy`, `select`, `rightClick`, `savePage`, `print` are **on**. `console` and `antiDebug` are **off**.
- Each instance has its own config, listeners, subscriptions, styles and timers.
- Destroying one instance never disables another.
- If guards overlap, an event blocked by **either** one stays blocked.

## 📦 Imports

```js
// ESM in a browser bundle
import Guard, { create } from "browser-guard";
const guard = create({ target: "#article" });

```

```js
// CommonJS in a browser bundle
const Guard = require("browser-guard");
```

- 🌍 Browser script exposes `window.Guard` (AMD works too)
- 🖥️ Importing in SSR is safe. Creating or enabling needs a browser document.
- 📘 TypeScript declarations are included. Import types such as `Options`, `CreateOptions`, `Feature`, `Status` and `ViolationEvent` from `browser-guard/types`.
- 📂 For native browser modules, import the distributed `guard.mjs` file by URL; bare package names require a bundler or import map.
- ☝️ Use **one** entry point per app. Mixing ESM and the browser script creates separate registries.

## 🧩 Scope & Exceptions

`target` accepts a **selector**, an **element**, or `document` (default). A missing target or invalid selector throws.

`allow` takes CSS selectors that stay exempt from restrictions. The defaults are:

```js
[
  "input",
  "textarea",
  "select",
  '[contenteditable]:not([contenteditable="false"])',
  "[data-guard-allow]",
];
```

```js
const guard = Guard.create({
  target: document.querySelector("#article"),
  allow: ["input", "textarea", "[data-guard-allow]", ".copyable"],
});
guard.enable();
```

- ✅ Matched elements **and their descendants** are exempt, including ones added later.
- ♻️ A custom `allow` array **replaces** the defaults. Use `[]` for no exceptions.
- 🔒 Targets and exceptions are fixed for the lifetime of an instance.
- 🖨️ Exceptions apply to copy, selection, context-menu and keyboard controls, but not print hiding or window-wide effects.

<details>
<summary>🎨 Selection styling notes</summary>

Selection restrictions are owned CSS rules, so removing them restores the original styling without overwriting inline values. Author styles with greater specificity and `!important` may override them. Avoid overlapping guards with contradictory selection exceptions. Native selection across multiple scopes or shadow roots is not fully controlled.

</details>

## ⚙️ Configuration

Every option is optional. `Guard.create(options)` saves configuration but starts inactive. `Guard.enable(options)` activates only the flags you pass; `Guard.enable()` restores all saved defaults. Feature defaults are saved settings, not active state before enabling.

| Parameter | Type / default | What it controls |
| --- | --- | --- |
| `copy` | `boolean` · `true` | Cancel copy events in scope. |
| `select` | `boolean` · `true` | Discourage selection with CSS and selection-event handling. |
| `rightClick` | `boolean` · `true` | Cancel context-menu events in scope. |
| `savePage` | `boolean` · `true` | Intercept Ctrl+S / Command+S when the page receives the shortcut. |
| `print` | `boolean` · `true` | Hide the target in print media; the print dialog still opens. |
| `console` | `boolean` · `false` | Enable window-size heuristics and DevTools shortcut interception. |
| `antiDebug` | `boolean` · `false` | Request a debugger pause every second. |
| `consoleAction` | `'noop'` (default), `'hide'`, `'redirect'` | On a size-heuristic trigger: only notify, hide the target, or navigate the whole page to `about:blank`. Used with `console`. |
| `onViolation` | `(type, event) => void` or `null` · `null` | Receive the violation name and detailed event. Set `null` to remove this callback; independent subscriptions remain. |
| `target` | CSS selector, `Element`, or `Document` · `document` | **Create only.** Choose an existing element from the current document, or the whole document. |
| `allow` | `string[]` · editing fields and `[data-guard-allow]` | **Create only.** Replace the default exception selectors; `[]` removes exceptions. |

Unknown options, non-boolean feature flags, invalid callbacks/actions, invalid selectors and missing targets throw. Invalid updates are validated before configuration changes. `target` and `allow` cannot be changed through `enable()`.

---

## 🧰 API

Use these methods on an independent `guard` instance. Except for `create()`, the same methods are also available on the global `Guard` controller.

| Method | Parameters and behavior | Returns |
| --- | --- | --- |
| `Guard.create(options?)` | Accepts the configuration above; creates an inactive independent controller. | `GuardInstance` |
| `guard.enable(options?)` | With options: save and apply only named feature flags; omitted active flags stay unchanged. Without options: restore all saved flags. | `Status` |
| `guard.disable(features?)` | Omit the argument to pause all features, or pass one feature name / an array of feature names. Preserves saved settings and subscriptions. | `Status` |
| `guard.status()` | Read a fresh snapshot of current active flags and `consoleAction`, not saved settings. | `Status` |
| `guard.on('violation', listener)` | The event name must be `'violation'`; the listener receives a `ViolationEvent`. | Unsubscribe function |
| `guard.destroy()` | Permanently disable the instance and clear its callbacks, subscriptions, styles and timers. Repeated calls are safe. | `void` |
| `guard.lock(options?)` | Alias for `enable(options)`. | `Status` |
| `guard.unlock(features?)` | Alias for `disable(features)`. | `Status` |
| `guard.unlockAll()` | Alias for `disable()` with no argument. | `Status` |

`features` accepts `copy`, `select`, `rightClick`, `savePage`, `print`, `console` or `antiDebug`. Unknown names throw. Each unsubscribe function returns `true` when it removes its subscription, then `false` on later calls.

### 🧹 Pause versus permanent cleanup

```js
const guard = Guard.create({ copy: true, print: false });
guard.enable();                 // Activate the saved configuration.
guard.disable("copy");         // Pause one feature.
guard.disable(["select", "rightClick"]); // Or pause several.
guard.disable();                // Pause everything; keep saved settings.
guard.enable();                 // Restore the saved configuration.

// When this controller is no longer needed:
guard.destroy();
```

Use **`disable()` for pausing** and **`destroy()` on component unmount**. After an independent instance is destroyed, `enable()`, `disable()` and `on()` throw; `status()` remains readable. Create a new instance to start again.

The global methods use a lazy document-wide controller. `Guard.status()` reports all features off before initialization. `Guard.destroy()` disposes of the global controller **and resets it**, so a later `Guard.enable()` can create a fresh one.

<details>
<summary>🔄 Partial updates versus restoring saved configuration</summary>

```js
const guard = Guard.create({ copy: true, print: false });
guard.enable({ copy: true }); // Activates only copy on this inactive instance.
guard.enable();              // Activates all saved defaults; print stays off.
guard.enable({ copy: false }); // Changes the saved copy flag to false.
guard.disable();             // Pauses without changing saved flags.
guard.enable();              // Restores saved flags, including copy: false.
```

To activate a full configuration on a new independent instance, pass it to `create(options)`, then call `enable()`.

</details>

---

## 🔔 Events

```js
const guard = Guard.create({ copy: true, select: false });
const unsubscribe = guard.on("violation", (event) => {
  console.log(event.type, event.feature, event.target);
});
guard.enable();

// Later, stop listening without changing protection:
// unsubscribe();
// On permanent teardown: guard.destroy();
```


```ts
interface ViolationEvent {
  readonly type:
    | "copy"
    | "select"
    | "right_click"
    | "save_page"
    | "print"
    | "console_open"
    | "console_shortcut";
  readonly feature:
    | "copy"
    | "select"
    | "rightClick"
    | "savePage"
    | "print"
    | "console"
    | "antiDebug";
  readonly target: Element;
  readonly timestamp: number; // Date.now()
  readonly originalEvent: Event | null;
  readonly defaultPrevented: boolean;
}
```

| Field | Meaning |
| --- | --- |
| `type` | Violation name from the union above. |
| `feature` | Feature responsible for the event. |
| `target` | Affected element; window-triggered events fall back to the scope root. |
| `timestamp` | Unix time in milliseconds, from `Date.now()`. |
| `originalEvent` | Original DOM event, or `null` for heuristic notifications. |
| `defaultPrevented` | Whether the original event was canceled. This is not proof that a browser action was prevented. |

- 🧊 Event records are frozen, but DOM references stay live.
- 🔕 Every subscription has its own unsubscribe function.
- 📣 `onViolation(type, event)` works alongside subscriptions.
- 🧪 `console_open` means the **size heuristic** triggered, not confirmed DevTools detection.
- 🐞 Anti-debugging doesn't emit events, because a pause request doesn't prove a debugger paused.
- 📣 All listeners run before the first thrown listener error is propagated.

## 🌍 Page-Wide Effects

Some browser actions can't be confined to one area:

| Feature        | Behavior                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🖨️ `print`     | Hides only the target in print media. It can't cancel the native print dialog, and exceptions don't apply to printed content.                                                           |
| 💾 `savePage`  | Blocks `Ctrl/Cmd + S` when the target is in scope. Browser-menu saves and downloads can't be stopped.                                                                                   |
| 🧪 `console`   | Blocks common DevTools shortcuts and runs a **window-wide size check** on activation, resize and every 500 ms. `hide` hides the target, and `redirect` sends the page to `about:blank`. |
| 🐞 `antiDebug` | Requests a debugger pause every 1,000 ms. It affects the **whole JS context**, and does nothing without an attached debugger.                                                           |

<details>
<summary>🏗️ Preserve anti-debugging in production bundles</summary>

Minifiers can remove `debugger` statements. If you use `antiDebug`, configure your production build to retain them. A stripped build now throws a clear error before changing any settings, rather than reporting an active feature that cannot pause.

For **Vite 8 / Rolldown** (covered by the integration tests):

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        minify: { compress: { dropDebugger: false } }
      }
    }
  }
});
```

Other minifiers use different names, such as Terser's `compress.drop_debugger: false`. Keep `antiDebug` off if you do not need debugger pauses. The published standalone `guard.js` and `guard.mjs` builds retain the statement unless another build step removes it. No dynamic `eval` or `Function` constructor is used.

</details>

<details>
<summary>🆘 Stuck in a debugger pause?</summary>

Disable breakpoints and resume, then call `guard.disable('antiDebug')`, or close DevTools and reload. Disabling or destroying an instance stops its timers.

</details>

> 🚧 **Limits:** the size heuristic can give false positives, detached DevTools has no dependable detection signal, and users can bypass controls by changing debugger settings or page scripts. Shadow DOM, iframes, browser chrome and cross-origin documents are not protected.

## 🧱 Framework Examples

Ready-to-use components live in [`examples/`](examples/). Each creates a whole-page instance after mounting and calls **`guard.destroy()` on unmount**. Imports are safe during server rendering; create and activate protection inside a browser lifecycle hook.

| Framework  | Example                                                 | Lifecycle                                                 |
| ---------- | ------------------------------------------------------- | --------------------------------------------------------- |
| ⚛️ React   | [`ReactArticle.jsx`](examples/ReactArticle.jsx)         | `useEffect` + cleanup (use a client component in Next.js) |
| 💚 Vue     | [`VueArticle.vue`](examples/VueArticle.vue)             | `onMounted` / `onBeforeUnmount`                           |
| 🅰️ Angular | [`AngularArticle.ts`](examples/AngularArticle.ts)       | `afterNextRender` + `DestroyRef`                          |
| 🧡 Svelte  | [`SvelteArticle.svelte`](examples/SvelteArticle.svelte) | `onMount` + cleanup (SvelteKit works too)                 |

Framework dependencies belong to your app, not to this library. Real integration apps, the pinned compatibility matrix and reproducible commands are documented in [`TESTING.md`](https://github.com/omer73364/browser-guard/blob/main/TESTING.md).

```bash
npm run test:integration:prepare
npm run test:integration
```

The suite includes production builds, framework mounting and destruction, server rendering, React/Vue/Svelte hydration, and React development Strict Mode across Chromium, Firefox and WebKit. See the testing report for coverage limits.

## 🛠️ Development

Requires **Node.js 20+**. Dev dependencies never ship with the browser library.

```bash
npm ci               # Install development dependencies
npm run build        # Generate guard.js and guard.mjs from src/guard-core.js
npm test             # Unit tests
npm run test:types   # Type checks
npm run check        # JavaScript syntax checks

# Browser tests (Chromium, Firefox, WebKit)
PLAYWRIGHT_BROWSERS_PATH=./node_modules/.cache/ms-playwright npx playwright install chromium firefox webkit
npm run test:browser
```

- 🐧 On Linux, Playwright may need OS libraries. Use its `install-deps` setup if needed.
- 🧪 Browser tests cover scoped events, allowed editing, selection CSS, print CSS, keyboard handling and cleanup.
- 🍎 WebKit coverage isn't a certification of every Safari version. Native print dialogs and real DevTools layouts need manual testing.
- 📦 `npm pack --dry-run` lists the distributable files.

### 👀 Try the demo

```bash
npm run dev
```

Then open `http://127.0.0.1:8765/` (or open `index.html` directly). Keep the terminal running while you preview.

### 🌐 Build the website

```bash
npm run build:site
```

Publish only `dist/`. See [`PUBLISHING.md`](PUBLISHING.md) for npm release and website deployment notes. The npm package contains the library builds, type declarations, README, license and framework examples; the website is deployed separately.

## 📄 License

Released under the **MIT License**. See [`LICENSE`](LICENSE).

<div align="center">

---

Made with 💚 by [@omer73364](https://github.com/omer73364)

</div>
