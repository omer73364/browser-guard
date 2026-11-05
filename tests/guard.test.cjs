const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
function setup() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><article id="a"><p id="text">Protected</p><input id="edit"><code data-guard-allow><span id="allowed">Allowed</span></code></article><aside id="b">Other</aside></body></html>', { runScripts: 'outside-only' });
  const { window } = dom; const timers = new Map(); let next = 0;
  window.setInterval = (fn, delay) => { const id = next++; timers.set(id, { fn, delay }); return id; };
  window.clearInterval = id => timers.delete(id);
  Object.defineProperties(window, { outerWidth: { value: 1200, writable: true }, innerWidth: { value: 1200, writable: true }, outerHeight: { value: 900, writable: true }, innerHeight: { value: 900, writable: true } });
  window.eval(fs.readFileSync(require.resolve('../guard.js'), 'utf8'));
  return { Guard: window.Guard, window, document: window.document, timers, tick: () => { for (const { fn } of [...timers.values()]) fn(); } };
}
function send(env, selector, type = 'copy', keys = {}) {
  const event = type === 'keydown' ? new env.window.KeyboardEvent(type, { bubbles: true, cancelable: true, ...keys }) : new env.window.Event(type, { bubbles: true, cancelable: true });
  env.document.querySelector(selector).dispatchEvent(event); return event.defaultPrevented;
}
test('non-browser imports are safe and create gives a clear error', () => {
  const Guard = require('../guard.js'); assert.equal(Guard.status().copy, false);
  assert.throws(() => Guard.create(), /browser document/);
});
test('scoped instances affect only their targets and honor default exceptions', () => {
  const env = setup(); const guard = env.Guard.create({ target: '#a' }); guard.enable();
  assert.equal(send(env, '#text'), true); assert.equal(send(env, '#b'), false);
  assert.equal(send(env, '#edit'), false); assert.equal(send(env, '#allowed'), false);
  assert.equal(send(env, '#edit', 'keydown', { key: 's', ctrlKey: true }), false);
  assert.equal(send(env, '#text', 'keydown', { key: 's', metaKey: true }), true);
});
test('custom exceptions replace defaults, include dynamic descendants, and validate upfront', () => {
  const env = setup(); const guard = env.Guard.create({ target: '#a', allow: ['.free'] }); guard.enable({ copy: true });
  assert.equal(send(env, '#edit'), true);
  env.document.querySelector('#allowed').className = 'free'; assert.equal(send(env, '#allowed'), false);
  const styles = env.document.head.children.length;
  for (const options of [{ target: '#missing' }, { allow: ['['] }, { allow: [null] }, { wat: true }, { copy: 'yes' }]) assert.throws(() => env.Guard.create(options));
  assert.equal(env.document.head.children.length, styles);
});
test('subscriptions receive immutable details, unsubscribe independently, and coexist with callback', () => {
  const env = setup(); const seen = [], callback = [];
  const guard = env.Guard.create({ target: '#a', copy: true, onViolation: (type, detail) => callback.push([type, detail]) });
  guard.enable(); const listener = detail => seen.push(detail);
  const off1 = guard.on('violation', listener); const off2 = guard.on('violation', listener);
  send(env, '#text'); assert.equal(seen.length, 2); assert.equal(callback.length, 1);
  const detail = seen[0]; assert.equal(detail.feature, 'copy'); assert.equal(detail.target.id, 'text');
  assert.equal(detail.defaultPrevented, true); assert.equal(typeof detail.timestamp, 'number'); assert.equal(Object.isFrozen(detail), true);
  off1(); send(env, '#text'); assert.equal(seen.length, 3); off2();
  guard.enable({ onViolation: null }); send(env, '#text'); assert.equal(seen.length, 3); assert.equal(callback.length, 2);
});
test('independent overlapping instances retain controls and owned CSS after one is destroyed', () => {
  const env = setup(); const a = env.Guard.create({ target: '#a' }); const b = env.Guard.create({ target: '#a' });
  a.enable(); b.enable(); assert.equal(env.document.head.querySelectorAll('style').length, 2);
  a.destroy(); assert.equal(send(env, '#text'), true); assert.equal(env.document.head.querySelectorAll('style').length, 1);
  b.destroy(); assert.equal(send(env, '#text'), false); assert.equal(env.document.head.querySelectorAll('style').length, 0);
  assert.equal(env.document.querySelector('#a').hasAttribute('data-browser-guard'), false);
});
test('disable saves configuration, enable restores it, and explicit updates merge only named flags', () => {
  const env = setup(); const guard = env.Guard.create({ copy: true, print: false, console: false });
  guard.enable(); guard.disable(); assert.equal(guard.status().copy, false);
  guard.enable(); assert.equal(guard.status().copy, true); assert.equal(guard.status().print, false);
  guard.enable({ copy: false }); guard.disable(); guard.enable(); assert.equal(guard.status().copy, false);
  assert.throws(() => guard.enable({ print: true, unknown: true })); assert.equal(guard.status().print, false);
  assert.throws(() => guard.disable(['select', 'bad'])); assert.equal(guard.status().select, true);
});
test('destroy is idempotent and final; global convenience controller can be recreated', () => {
  const env = setup(); const guard = env.Guard.create(); guard.enable({ antiDebug: true, console: true });
  assert.equal(env.timers.size, 2); guard.destroy(); guard.destroy(); assert.equal(env.timers.size, 0);
  assert.throws(() => guard.enable(), /destroyed/); assert.throws(() => guard.on('violation', () => {}), /destroyed/);
  env.Guard.enable({ copy: true }); env.Guard.destroy(); env.Guard.enable({ copy: true }); assert.equal(send(env, '#text'), true);
});
test('DevTools shortcuts are scoped and exempt editing fields', () => {
  const env = setup(); const guard = env.Guard.create({ target: '#a' }); guard.enable({ console: true });
  assert.equal(send(env, '#text', 'keydown', { key: 'C', ctrlKey: true, shiftKey: true }), true);
  assert.equal(send(env, '#b', 'keydown', { key: 'F12' }), false);
  assert.equal(send(env, '#edit', 'keydown', { key: 'F12' }), false);
  guard.disable('console'); assert.equal(send(env, '#text', 'keydown', { key: 'F12' }), false);
});
test('hidden targets use shared ownership and restore original inline styles', () => {
  const env = setup(); const el = env.document.querySelector('#a'); el.style.setProperty('display', 'grid', 'important');
  const a = env.Guard.create({ target: el }); const b = env.Guard.create({ target: el });
  env.window.innerWidth = 800;
  a.enable({ console: true, consoleAction: 'hide' }); b.enable({ console: true, consoleAction: 'hide' });
  assert.equal(el.style.display, 'none'); a.destroy(); assert.equal(el.style.display, 'none');
  b.destroy(); assert.equal(el.style.display, 'grid'); assert.equal(el.style.getPropertyPriority('display'), 'important');
});
test('copy selection is checked when the event is delivered to the body', () => {
  const env = setup(); const guard = env.Guard.create({ target: '#a' }); guard.enable({ copy: true });
  const selection = env.document.getSelection(); const range = env.document.createRange();
  range.selectNodeContents(env.document.querySelector('#text')); selection.addRange(range); assert.equal(send(env, 'body'), true);
  selection.removeAllRanges(); range.selectNodeContents(env.document.querySelector('#allowed')); selection.addRange(range); assert.equal(send(env, 'body'), false);
});
test('anti-debug timer is idempotent and queued callbacks do not pause after destroy', () => {
  const env = setup(); const guard = env.Guard.create();
  guard.enable({ antiDebug: true }); guard.enable({ antiDebug: true }); assert.equal(env.timers.size, 1);
  assert.equal([...env.timers.values()][0].delay, 1000);
  const fn = [...env.timers.values()][0].fn; guard.destroy(); fn(); assert.equal(env.timers.size, 0);
});
test('anti-debugging actually reaches a debugger in repeated timer callbacks', () => {
  const inspector = require('node:inspector'); const session = new inspector.Session(); session.connect(); let pauses = 0;
  session.on('Debugger.paused', ({ params }) => { if (params.callFrames[0].functionName === 'pauseDebugger') pauses++; session.post('Debugger.resume'); });
  try {
    session.post('Debugger.enable'); const env = setup(); const guard = env.Guard.create(); guard.enable({ antiDebug: true });
    env.tick(); env.tick(); assert.equal(pauses, 2); guard.destroy(); env.tick(); assert.equal(pauses, 2);
  } finally { session.post('Debugger.disable'); session.disconnect(); }
});
test('CommonJS and ESM entry points expose the same public methods', async () => {
  const cjs = require('../guard.js'); const esm = await import('../guard.mjs');
  assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm.default).sort()); assert.equal(esm.create, esm.default.create);
});

test('stripped debugger builds reject antiDebug atomically instead of reporting false protection', () => {
  const dom = new JSDOM('<!doctype html><html><head></head><body>Test</body></html>', { runScripts: 'outside-only' });
  dom.window.eval(fs.readFileSync(require.resolve('../guard.js'), 'utf8').replace(/\bdebugger;/g, ''));
  const guard = dom.window.Guard.create(); guard.enable({ copy: true });
  const before = guard.status();
  assert.throws(() => guard.enable({ copy: false, antiDebug: true }), /preserves debugger/);
  assert.deepEqual(guard.status(), before);
  assert.throws(() => dom.window.Guard.create({ antiDebug: true }), /preserves debugger/);
  guard.destroy(); dom.window.close();
});
