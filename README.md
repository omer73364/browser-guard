<div align="center">

# 🛡️ Browser Guard

### Take control of how visitors interact with your page ✨

A tiny, **dependency-free** JavaScript library to control copy, selection, right-click, save, print and more, for the whole page or just one area.

![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ESM%20%2B%20CJS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

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
| 🧪  | **DevTools heuristics**   | Optional console detection and anti-debugging       |
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

Guard.disable(); // 👋 turn it all off
```

### 🌐 Classic `<script>` tag

```html
<script src="/vendor/browser-guard/guard.js"></script>
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

<details>
<summary>📂 How to copy the script into your public folder</summary>

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

// 🧹 On teardown
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
// ✅ Native ESM
import Guard, { create } from "./guard.mjs";
const guard = create({ target: "#article" });

// ✅ CommonJS
const Guard = require("browser-guard");
```

- 🌍 Browser script exposes `window.Guard` (AMD works too)
- 🖥️ Importing in SSR is safe. Creating or enabling needs a browser document.
- 📘 TypeScript declarations are included.
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

<details>
<summary>🎨 Selection styling notes</summary>

Selection restrictions are owned CSS rules, so removing them restores the original styling without overwriting inline values. Author styles with greater specificity and `!important` may override them. Avoid overlapping guards with contradictory selection exceptions. Native selection across multiple scopes or shadow roots is not fully controlled.

</details>

## 🧰 API

| Method                           | What it does                                                               |
| -------------------------------- | -------------------------------------------------------------------------- |
| `Guard.create(options?)`         | Returns a new **inactive** independent instance                            |
| `guard.enable()`                 | Restores the saved configuration                                           |
| `guard.enable(options)`          | Updates and applies only the named options                                 |
| `guard.disable()`                | Turns off every feature (config and subscriptions are kept)                |
| `guard.disable('copy')`          | Disables one feature (or pass an array)                                    |
| `guard.status()`                 | Returns a fresh snapshot of active flags and `consoleAction`               |
| `guard.on('violation', handler)` | Subscribes and returns an unsubscribe function                             |
| `guard.destroy()`                | Removes listeners, timers, styles and subscriptions. Final and idempotent. |

🔁 `lock`, `unlock` and `unlockAll` are aliases for enable/disable.

🌍 `Guard.enable()`, `Guard.disable()`, `Guard.on()`, `Guard.status()` use a lazy document-wide instance. `Guard.destroy()` releases it.

✅ Feature flags must be booleans. `onViolation` accepts a function or `null`. `consoleAction` accepts `noop`, `hide` or `redirect`.

## 🔔 Events

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

- 🧊 Event records are frozen, but DOM references stay live.
- 🔕 Every subscription has its own unsubscribe function.
- 📣 `onViolation(type, event)` works alongside subscriptions.
- 🧪 `console_open` means the **size heuristic** triggered, not confirmed DevTools detection.
- 🐞 Anti-debugging doesn't emit events, because a pause request doesn't prove a debugger paused.

## 🌍 Page-Wide Effects

Some browser actions can't be confined to one area:

| Feature        | Behavior                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🖨️ `print`     | Hides only the target in print media. It can't cancel the native print dialog, and exceptions don't apply to printed content.                                                           |
| 💾 `savePage`  | Blocks `Ctrl/Cmd + S` when the target is in scope. Browser-menu saves and downloads can't be stopped.                                                                                   |
| 🧪 `console`   | Blocks common DevTools shortcuts and runs a **window-wide size check** on activation, resize and every 500 ms. `hide` hides the target, and `redirect` sends the page to `about:blank`. |
| 🐞 `antiDebug` | Requests a debugger pause every 1,000 ms. It affects the **whole JS context**, and does nothing without an attached debugger.                                                           |

<details>
<summary>🆘 Stuck in a debugger pause?</summary>

Disable breakpoints and resume, then call `guard.disable('antiDebug')`, or close DevTools and reload. Disabling or destroying an instance stops its timers.

</details>

> 🚧 **Limits:** the size heuristic can give false positives, detached DevTools has no dependable detection signal, and users can bypass controls by changing debugger settings or page scripts. Shadow DOM, iframes, browser chrome and cross-origin documents are not protected.

## 🧱 Framework Examples

Ready-to-use components live in [`examples/`](examples/). Each creates a whole-page instance on mount and cleans up on unmount.

| Framework  | Example                                                 | Lifecycle                                                 |
| ---------- | ------------------------------------------------------- | --------------------------------------------------------- |
| ⚛️ React   | [`ReactArticle.jsx`](examples/ReactArticle.jsx)         | `useEffect` + cleanup (use a client component in Next.js) |
| 💚 Vue     | [`VueArticle.vue`](examples/VueArticle.vue)             | `onMounted` / `onBeforeUnmount`                           |
| 🅰️ Angular | [`AngularArticle.ts`](examples/AngularArticle.ts)       | `afterNextRender` + `DestroyRef`                          |
| 🧡 Svelte  | [`SvelteArticle.svelte`](examples/SvelteArticle.svelte) | `onMount` + cleanup (SvelteKit works too)                 |

Framework dependencies belong to your app, not to this library.

## 🛠️ Development

Requires **Node.js 20+**. Dev dependencies never ship with the browser library.

```bash
npm ci               # 📥 install
npm run build        # 🏗️ generate guard.js and guard.mjs from src/guard-core.js
npm test             # 🧪 unit tests
npm run test:types   # 📘 type tests
npm run check        # ✅ checks

# 🌐 Browser tests (Chromium, Firefox, WebKit)
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

## 📄 License

Released under the **MIT License**. See [`LICENSE`](LICENSE).

<div align="center">

---

Made with 💚 by [@omer73364](https://github.com/omer73364)

</div>
