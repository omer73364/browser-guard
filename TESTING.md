# Browser Guard integration validation

Validation date: 2026-11-05.

## What is tested

The integration suite packs the local library as an npm tarball, installs that tarball into a separate private project, and compiles the **packaged framework examples**. It does not replace the framework lifecycle hooks with mocks. No framework dependency is added to the shipped library.

| App | Pinned framework | Coverage |
| --- | --- | --- |
| Plain JavaScript | Browser ESM | Whole-document mounting and teardown |
| React | 19.3.1 / React DOM 19.3.1 | Production mount/unmount, server render and hydration; separate development Strict Mode build |
| Vue | 3.5.44 | Production mount/unmount, server render and hydration |
| Angular | 22.2.4 | AOT compilation, Angular linker, standalone components, signals, `afterNextRender`, `DestroyRef`, server rendering |
| Svelte | 5.57.3 | Production compile, `onMount` cleanup, server render and hydration |

Vite 8.3.5 builds the apps. Angular examples are checked with TypeScript 6.0.2 and strict template checking. The fixture project pins its own Node 22.23.4 binary for framework compilation; the library's Node requirement remains unchanged.

The browser matrix is Chromium, Firefox and WebKit through Playwright. These are the installed Playwright engines, not a certification of every Chrome, Edge, Firefox, Safari, OS or mobile version.

### Browser scenarios

- Whole-page controls protect content outside the framework component.
- Native copy, context-menu and save shortcuts are intercepted.
- Inputs, textareas, select elements, contenteditable and `data-guard-allow` remain usable.
- Selection and print CSS apply and are removed correctly.
- Partial updates, pause/resume, status and aliases preserve the documented configuration behavior.
- Invalid updates do not partially change configuration.
- Subscriptions unsubscribe independently; permanent destruction is idempotent and final.
- Twenty mount/unmount cycles per app/browser leave no guard styles, scope attributes, active controllers or duplicated violation events.
- DevTools heuristic hiding restores the original page visibility. All intervals are cleared on unmount.
- Redirect responses perform a real navigation to `about:blank` under a controlled size-heuristic signal.
- DevTools shortcuts respect editable exceptions and stop being intercepted when disabled.
- An attached Chromium debugger really pauses on the optional anti-debug timer, then stops pausing when disabled. This uses CDP and intentionally does not run on Firefox/WebKit.

Heuristic tests deliberately control window dimensions. They test the response to a signal, not the accuracy of DevTools detection in the wild.

## Results

- 150 integration cases were defined: 148 applicable checks completed successfully across Chromium, Firefox and WebKit; the two non-Chromium CDP debugger cases are intentionally skipped.
- One case in the final full integration run failed while WebKit was creating a new page (`Target page, context or browser has been closed`). It passed when rerun separately. An earlier exploratory run also had an intermittent WebKit page-creation failure; both occurred before app setup.
- All four framework server-rendering builds passed. React/Vue/Svelte hydrated clients and React development Strict Mode passed the browser matrix.
- Existing library/website browser regression suite: 42 passed.
- Library unit tests (14), declaration checks and JavaScript syntax checks passed.
- The test preparation command was rerun successfully; it builds the packed artifact rather than linking editable library source into an app.

These results describe the final checked-in runtime. The minifier safeguard is an unreleased change; npm 1.0.1 does not contain it.

## Reproduce

From the repository root:

```sh
npm ci
npm run test:integration:prepare
npm run test:integration
```

Preparation needs network access on first use. It packs the current library, installs the separate fixture dependencies, compiles the Angular examples, renders four server entries, produces client builds and creates the React development build. The fixture lockfile pins the build dependencies. Generated tarballs, HTML, build output and node_modules are ignored.

The browser runner starts a loopback-only static server on port 8771 and stops it afterwards. It serves only generated fixture output, never the project root. Install the configured Playwright browsers if they are missing:

```sh
PLAYWRIGHT_BROWSERS_PATH=./node_modules/.cache/ms-playwright npx playwright install chromium firefox webkit
```

Linux may also require Playwright system libraries. Run existing library and website checks separately:

```sh
npm test
npm run test:types
npm run check
npm run test:browser -- --workers 1
```

## Scope and remaining limits

This validates integration with the pinned framework releases. It does not claim compatibility with all historical framework versions, Next.js/Nuxt/SvelteKit routing and streaming, or Angular client hydration. React/Vue/Svelte hydration is tested directly with their framework APIs.

Native print dialogs, physical printers, browser menu actions, detached DevTools UI and mobile browsers remain manual checks. A Chromium debugger connection proves that debugger statements execute, not that DevTools can be reliably detected or prevented. These controls remain bypassable and are not access control or DRM.

The fixture dependency audit reports a low-severity `deepmerge` advisory through the Svelte build plugin, with no upstream fix available at validation time. That code is test/build tooling and is not included in the zero-dependency library runtime.

## Findings

The initial Angular fixture build needed the Angular linker for partially compiled framework dependencies and an explicit allowed localhost host for server rendering. Both are corrected in the retained test setup. The production minifier also removed the optional anti-debugger statement. The library now detects a stripped pause function and rejects `antiDebug` before changing configuration. The main fixture preserves debugger statements through Rolldown; a second build deliberately uses default minification to test the error. A real Chromium debugger test confirms the preserved build pauses and stops correctly. No dynamic code generation was introduced.
