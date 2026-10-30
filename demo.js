"use strict";
(() => {
  const features = ['copy', 'select', 'rightClick', 'savePage', 'print', 'console', 'antiDebug'];
  const presets = {
    reading: { copy: true, select: false, rightClick: false, savePage: true, print: true, console: false, antiDebug: false },
    strict: { copy: true, select: true, rightClick: true, savePage: true, print: true, console: false, antiDebug: false },
    off: Object.fromEntries(features.map(key => [key, false]))
  };
  const labels = { copy: 'Copy', select: 'Text selection', rightClick: 'Context menu', savePage: 'Save shortcut', print: 'Print', console: 'DevTools heuristic', antiDebug: 'Anti-debugging' };
  const $ = selector => document.querySelector(selector);
  const toggles = Object.fromEntries(features.map(key => [key, $('#' + key + 'Toggle')]));
  const guard = Guard.create({ target: '#protected-content' });
  let settings = { ...presets.reading }, paused = false, preset = 'reading', format = 'esm', sequence = 0, toastTimer;
  const log = $('#eventLog');
  const introCode = "Guard.enable({\n  copy: true,\n  select: true,\n  rightClick: true,\n  savePage: true,\n  print: true,\n  console: false,\n  antiDebug: false,\n  consoleAction: 'noop',\n  onViolation: (type) => console.log('Guard:', type)\n});\n\n// Later, pause protection:\n// Guard.disable();";
  const integrations = {
  "esm": "import Guard from 'browser-guard';\n\nGuard.enable({\n  copy: true,\n  select: true,\n  rightClick: true,\n  savePage: true,\n  print: true,\n  console: false,\n  antiDebug: false,\n  consoleAction: 'noop',\n  onViolation: (type) => console.log('Guard:', type)\n});\n\n// Turn off all controls.\n// Guard.disable();",
  "react": "import { useEffect } from 'react';\nimport Guard from 'browser-guard';\n\nexport default function Article() {\n  useEffect(() => {\n    const guard = Guard.create();\n    guard.enable({\n      copy: true,\n      select: true,\n      rightClick: true,\n      savePage: true,\n      print: true,\n      console: false,\n      antiDebug: false,\n      consoleAction: 'noop',\n      onViolation: (type) => console.log('Guard:', type)\n    });\n    return () => guard.disable();\n  }, []);\n\n  return <article>Your content</article>;\n}",
  "vue": "<script setup>\nimport { onMounted, onBeforeUnmount } from 'vue';\nimport Guard from 'browser-guard';\n\nlet guard;\n\nonMounted(() => {\n  guard = Guard.create();\n  guard.enable({\n    copy: true,\n    select: true,\n    rightClick: true,\n    savePage: true,\n    print: true,\n    console: false,\n    antiDebug: false,\n    consoleAction: 'noop',\n    onViolation: (type) => console.log('Guard:', type)\n  });\n});\nonBeforeUnmount(() => guard?.disable());\n</script>\n\n<template>\n  <article>Your content</article>\n</template>",
  "angular": "import {\n  Component, DestroyRef,\n  afterNextRender, inject\n} from '@angular/core';\nimport Guard from 'browser-guard';\n\n@Component({\n  selector: 'app-guarded-article',\n  standalone: true,\n  template: '<article>Your content</article>'\n})\nexport class GuardedArticle {\n  constructor() {\n    const cleanup = inject(DestroyRef);\n\n    afterNextRender(() => {\n      const guard = Guard.create();\n      guard.enable({\n        copy: true,\n        select: true,\n        rightClick: true,\n        savePage: true,\n        print: true,\n        console: false,\n        antiDebug: false,\n        consoleAction: 'noop',\n        onViolation: (type) => console.log('Guard:', type)\n      });\n      cleanup.onDestroy(() => guard.disable());\n    });\n  }\n}",
  "svelte": "<script>\n  import { onMount } from 'svelte';\n  import Guard from 'browser-guard';\n\n  onMount(() => {\n    const guard = Guard.create();\n    guard.enable({\n      copy: true,\n      select: true,\n      rightClick: true,\n      savePage: true,\n      print: true,\n      console: false,\n      antiDebug: false,\n      consoleAction: 'noop',\n      onViolation: (type) => console.log('Guard:', type)\n    });\n    return () => guard.disable();\n  });\n</script>\n\n<article>Your content</article>",
  "cjs": "const Guard = require('browser-guard');\n\n// Run after the browser DOM is ready.\nGuard.enable({\n  copy: true,\n  select: true,\n  rightClick: true,\n  savePage: true,\n  print: true,\n  console: false,\n  antiDebug: false,\n  consoleAction: 'noop',\n  onViolation: (type) => console.log('Guard:', type)\n});\n\n// Guard.disable();",
  "script": "<script src=\"https://cdn.jsdelivr.net/npm/browser-guard@1.0.0/guard.js\"></script>\n<script>\n  Guard.enable({\n    copy: true,\n    select: true,\n    rightClick: true,\n    savePage: true,\n    print: true,\n    console: false,\n    antiDebug: false,\n    consoleAction: 'noop',\n    onViolation: (type) => console.log('Guard:', type)\n  });\n\n  // Turn off all controls.\n  // Guard.disable();\n</script>"
};
  const frameworkNotes = {
  "esm": "Import the installed package in your browser application.",
  "react": "useEffect creates the instance after mount and disables it on cleanup. Works with React Strict Mode; in Next.js, use a client component.",
  "vue": "Create the instance in onMounted; release it before the component unmounts.",
  "angular": "afterNextRender runs in the browser. DestroyRef disables the controls when the component is destroyed.",
  "svelte": "onMount runs in the browser. Its returned function disables the controls on unmount. Works with Svelte and SvelteKit.",
  "cjs": "Use this in a CommonJS-compatible browser bundle, after mounting the target.",
  "script": "Use the version-pinned CDN script after your content. No bundler required."
};
  function toast(message) {
    const element = $('#toast');
    element.textContent = message; element.hidden = false;
    window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { element.hidden = true; }, 3500);
  }
  function addLog(type, message, system = false) {
    log.querySelector('.empty-log')?.remove();
    const row = document.createElement('div'); row.className = 'event-row';
    const time = document.createElement('time'); time.dateTime = new Date().toISOString();
    time.textContent = new Date().toLocaleTimeString([], { hour12: false });
    const tag = document.createElement('span'); tag.className = 'event-tag' + (system ? ' system' : ''); tag.textContent = type;
    const content = document.createElement('span'); content.textContent = message;
    row.append(time, tag, content); log.append(row);
    while (log.children.length > 50) log.firstElementChild.remove();
    $('#eventCount').textContent = String(++sequence).padStart(2, '0'); log.scrollTop = log.scrollHeight;
  }
  const unsubscribe = guard.on('violation', event => {
    const message = event.type === 'console_open' ? 'Window-size heuristic triggered; not confirmed DevTools detection.'
      : event.type === 'console_shortcut' ? 'Shortcut intercepted in scope; this is not proof that DevTools opened.'
      : event.type === 'print' ? 'Print CSS hides the preview. The browser print dialog remains available.'
      : labels[event.feature] + ' blocked in #' + (event.target.id || 'protected-content') + '.';
    addLog(event.type, message);
  });
  function render() {
    const active = Object.values(guard.status()).filter(value => value === true).length;
    $('#activeCount').textContent = paused ? 'paused' : active + ' active';
    $('#stateSignal').classList.toggle('paused', paused || active === 0);
    for (const key of features) { toggles[key].checked = settings[key]; toggles[key].disabled = paused; }
    $('#consoleAction').disabled = paused || !settings.console;
    $('#pause').textContent = paused ? '▷  Resume controls' : 'Ⅱ  Pause controls';
    $('#pause').setAttribute('aria-pressed', String(paused));
    document.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === preset)));
  }
  function apply() {
    if (paused) guard.disable();
    else guard.enable({ ...settings, consoleAction: $('#consoleAction').value });
    render();
  }
  for (const key of features) toggles[key].addEventListener('change', () => {
    settings[key] = toggles[key].checked; preset = null; apply();
    addLog('config', labels[key] + (settings[key] ? ' enabled.' : ' disabled.'), true);
    if (key === 'antiDebug' && settings[key]) {
      $('#testResult').textContent = 'Anti-debugging requests a pause every second. If paused: disable breakpoints and resume before switching it off.';
      toast('Anti-debugging enabled. Debugger pauses affect the whole page.');
    }
  });
  $('#consoleAction').addEventListener('change', () => { apply(); addLog('config', 'DevTools response: ' + $('#consoleAction').selectedOptions[0].textContent + '.', true); });
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    preset = button.dataset.preset; settings = { ...presets[preset] }; paused = false; apply();
    addLog('preset', button.textContent + ' configuration applied.', true);
  }));
  $('#pause').addEventListener('click', () => {
    paused = !paused; apply(); addLog('lifecycle', paused ? 'Controls paused. Configuration saved for resuming.' : 'Saved controls resumed.', true);
  });
  $('#reset').addEventListener('click', () => {
    preset = 'reading'; settings = { ...presets.reading }; paused = false; $('#consoleAction').value = 'noop'; apply();
    $('#testResult').textContent = 'Copy and save tests simulate events; they don’t change your clipboard or open a save dialog.';
    addLog('reset', 'Reading preset restored. Advanced controls are off.', true); toast('Default configuration restored.');
  });
  $('#clearLog').addEventListener('click', () => {
    sequence = 0; $('#eventCount').textContent = '00'; log.replaceChildren();
    const empty = document.createElement('p'); empty.className = 'empty-log'; empty.textContent = 'Listening for interactions';
    const hint = document.createElement('span'); hint.textContent = 'Try a quick test or interact with the preview above.'; empty.append(hint); log.append(empty);
  });
  function simulatedTest(type) {
    const event = type === 'copy' ? new Event('copy', { bubbles: true, cancelable: true })
      : new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true });
    $('#sampleText').dispatchEvent(event);
    const message = (type === 'copy' ? 'Copy event' : 'Save shortcut') + (event.defaultPrevented ? ' blocked.' : ' allowed.') +
      (type === 'copy' ? ' Simulation only; your clipboard is unchanged.' : ' Simulation only; no save dialog opens.');
    $('#testResult').textContent = message;
    if (!event.defaultPrevented) addLog('allowed', message, true);
  }
  $('#testCopy').addEventListener('click', () => simulatedTest('copy'));
  $('#testSave').addEventListener('click', () => simulatedTest('save'));
  $('#testPrint').addEventListener('click', () => {
    $('#testResult').textContent = guard.status().print ? 'Opening print preview. The guarded article will be hidden.' : 'Opening print preview. The article will be visible.';
    window.print();
  });
  $('#checkDetection').addEventListener('click', () => {
    const width = Math.round(window.outerWidth - window.innerWidth), height = Math.round(window.outerHeight - window.innerHeight);
    addLog('dimensions', 'Width gap: ' + width + 'px. Height gap: ' + height + 'px. Threshold: 160px. This is a heuristic, not proof.', true);
    toast('Dimension check added to the event stream.');
  });
  function configuration() {
    return `const guard = Guard.create({ target: '#protected-content' });\n\nguard.enable({\n` + features.map(key => '  ' + key + ': ' + settings[key]).join(',\n') +
      `,\n  consoleAction: '${$('#consoleAction').value}'\n});\n\nguard.on('violation', event => console.log(event));\n\n// Turn off controls:\n// guard.disable();`;
  }
  async function copy(text) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text); toast('Copied to clipboard.');
    } catch {
      // The fallback stays outside the guarded scope. Report failure honestly.
      const field = document.createElement('textarea'); field.value = text; field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0'; const previous = document.activeElement; document.body.append(field); field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Browser denied clipboard access. */ }
      field.remove(); previous?.focus(); toast(copied ? 'Copied to clipboard.' : 'Clipboard access unavailable. Select and copy the example manually.');
    }
  }
  $('#copyConfig').addEventListener('click', () => copy(configuration()));
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copy(button.dataset.copy === 'intro' ? introCode : button.dataset.copy === 'install' ? $('#installCommand').textContent : integrations[format])));
  document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => {
    format = button.dataset.format; $('#integrationExample').textContent = integrations[format]; window.GuardCodeHighlight?.($('#integrationExample'));
    $('#frameworkNote').textContent = frameworkNotes[format];
    document.querySelectorAll('[data-format]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
  }));
  $('#integrationExample').textContent = integrations[format]; window.GuardCodeHighlight?.($('#integrationExample')); $('#frameworkNote').textContent = frameworkNotes[format]; apply();
  window.addEventListener('pagehide', event => {
    // Keep the instance alive for pages restored from the back-forward cache.
    if (!event.persisted) { unsubscribe(); guard.destroy(); window.clearTimeout(toastTimer); }
  });
})();
