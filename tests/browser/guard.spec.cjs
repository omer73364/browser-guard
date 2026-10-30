const { test, expect } = require('@playwright/test');
const path = require('node:path');
test.beforeEach(async ({ page }) => {
  await page.setContent('<!doctype html><article id="a"><p id="text">Protected text</p><input id="input"><code data-guard-allow><span id="allowed">Copy this</span></code></article><aside id="b">Unprotected</aside>');
  await page.addScriptTag({ path: path.resolve(__dirname, '../../guard.js') });
});
test('scoped events, exceptions and subscriptions work in a real DOM', async ({ page }) => {
  const result = await page.evaluate(() => {
    const guard = Guard.create({ target: '#a' }); const log = [];
    const off = guard.on('violation', event => log.push({ type: event.type, id: event.target.id, blocked: event.defaultPrevented })); guard.enable();
    const copy = id => document.querySelector(id).dispatchEvent(new Event('copy', { bubbles: true, cancelable: true }));
    const values = [copy('#text'), copy('#input'), copy('#allowed'), copy('#b')];
    off(); copy('#text'); guard.destroy(); values.push(copy('#text'));
    return { values, log, marks: document.querySelector('#a').hasAttribute('data-browser-guard') };
  });
  expect(result).toEqual({ values: [false, true, true, true, true], log: [{ type: 'copy', id: 'text', blocked: true }], marks: false });
});
test('selection CSS preserves editing, exceptions, and original inline styles', async ({ page }) => {
  const result = await page.evaluate(() => {
    const target = document.querySelector('#a'); target.style.userSelect = 'text';
    const guard = Guard.create({ target }); guard.enable({ select: true });
    const values = ['#text', '#input', '#allowed', '#b'].map(id => getComputedStyle(document.querySelector(id)).userSelect);
    guard.destroy(); return { values, inline: target.style.userSelect, after: getComputedStyle(document.querySelector('#text')).userSelect };
  });
  expect(result.values.slice(0, 3)).toEqual(['none', 'text', 'text']); expect(result.values[3]).not.toBe('none');
  expect(result.inline).toBe('text'); expect(result.after).not.toBe('none');
});
test('multiple scoped guards own their print styles independently', async ({ page }) => {
  await page.evaluate(() => { window.a = Guard.create({ target: '#a' }); window.b = Guard.create({ target: '#b' }); a.enable({ print: true }); b.enable({ print: true }); });
  await page.emulateMedia({ media: 'print' }); await expect(page.locator('#a')).toBeHidden(); await expect(page.locator('#b')).toBeHidden();
  await page.evaluate(() => a.destroy()); await expect(page.locator('#a')).toBeVisible(); await expect(page.locator('#b')).toBeHidden();
  await page.evaluate(() => b.destroy()); await expect(page.locator('#b')).toBeVisible();
});
test('disable/enable restores only the saved configuration', async ({ page }) => {
  const result = await page.evaluate(() => {
    const guard = Guard.create({ target: '#a', copy: true, print: false }); guard.enable(); guard.disable();
    const disabled = guard.status(); guard.enable(); const restored = guard.status(); guard.destroy(); guard.destroy();
    let error; try { guard.enable(); } catch (e) { error = e.message; }
    return { disabled, restored, error };
  });
  expect(result.disabled.copy).toBe(false); expect(result.restored.copy).toBe(true); expect(result.restored.print).toBe(false); expect(result.error).toContain('destroyed');
});
test('keyboard scope respects focused editing fields and teardown', async ({ page }) => {
  await page.evaluate(() => { window.guard = Guard.create({ target: '#a' }); guard.enable({ savePage: true }); window.prevented = []; document.addEventListener('keydown', event => prevented.push(event.defaultPrevented)); });
  await page.locator('#input').focus(); await page.keyboard.press('Control+s');
  await page.locator('#text').click(); // use a focusable protected target for the shortcut
  await page.evaluate(() => { document.querySelector('#text').tabIndex = 0; document.querySelector('#text').focus(); });
  await page.keyboard.press('Control+s'); await page.evaluate(() => guard.destroy()); await page.keyboard.press('Control+s');
  const values = await page.evaluate(() => prevented); expect(values).toContain(true); expect(values.at(-1)).toBe(false);
});
test('native browser ESM import exposes create without creating a global', async ({ page }) => {
  const fs = require('node:fs');
  await page.route('http://guard.test/**', route => {
    if (route.request().url().endsWith('/guard.mjs')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.resolve(__dirname, '../../guard.mjs'), 'utf8') });
    return route.fulfill({ contentType: 'text/html', body: '<article id="a">Test</article>' });
  });
  await page.goto('http://guard.test/');
  const result = await page.evaluate(async () => {
    const module = await import('/guard.mjs'); const guard = module.create({ target: '#a', copy: true }); guard.enable();
    const allowed = document.querySelector('#a').dispatchEvent(new Event('copy', { bubbles: true, cancelable: true }));
    guard.destroy(); return { allowed, globalPresent: 'Guard' in window };
  });
  expect(result).toEqual({ allowed: false, globalPresent: false });
});
