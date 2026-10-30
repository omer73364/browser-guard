const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('http://guard.test/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    const file = { '/': 'index.html', '/site.css': 'site.css', '/demo.js': 'demo.js', '/guard.js': 'guard.js', '/guard.mjs': 'guard.mjs', '/README.md': 'README.md', '/docs.html': 'docs.html' }[pathname];
    if (!file) return route.fulfill({ status: 404, body: 'Not found' });
    const contentType = file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : file.endsWith('.md') ? 'text/plain' : 'text/javascript';
    return route.fulfill({ contentType, body: fs.readFileSync(path.join(root, file), 'utf8') });
  });
  await page.goto('http://guard.test/');
});
test('playground controls, presets, pause/resume and event log work', async ({ page }) => {
  await expect(page.locator('#activeCount')).toHaveText('3 active');
  await page.locator('#testCopy').click(); await expect(page.locator('#testResult')).toContainText('Copy event blocked');
  await expect(page.locator('#eventLog')).toContainText('Copy blocked in #sampleText');
  await page.locator('#pause').click(); await expect(page.locator('#copyToggle')).toBeDisabled();
  await page.locator('#testCopy').click(); await expect(page.locator('#testResult')).toContainText('Copy event allowed');
  await page.locator('#pause').click(); await page.locator('#testSave').click(); await expect(page.locator('#testResult')).toContainText('Save shortcut blocked');
  await page.locator('[data-preset="off"]').click(); await expect(page.locator('#activeCount')).toHaveText('0 active');
  await page.locator('[data-preset="strict"]').click(); await expect(page.locator('#activeCount')).toHaveText('5 active');
  await page.locator('#sampleInput').fill('Still editable'); await expect(page.locator('#sampleInput')).toHaveValue('Still editable');
  await page.locator('#reset').click(); await expect(page.locator('#selectToggle')).not.toBeChecked();
  await page.locator('.event-console > summary').click();
  await page.locator('#clearLog').click(); await expect(page.locator('#eventCount')).toHaveText('00'); await expect(page.locator('#eventLog')).toContainText('Listening for interactions');
});
test('copy export matches current settings and examples switch', async ({ page }) => {
  await page.evaluate(() => { window.copied = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => window.copied.push(text) } }); });
  await page.locator('[data-preset="strict"]').click(); await page.locator('#copyConfig').click();
  let copied = await page.evaluate(() => copied); expect(copied[0]).toContain('select: true'); expect(copied[0]).toContain("target: '#protected-content'");
  await page.locator('[data-format="cjs"]').click(); await expect(page.locator('#integrationExample')).toContainText("require('browser-guard')");
  await page.locator('[data-copy="integration"]').click(); copied = await page.evaluate(() => window.copied); expect(copied[1]).toContain("require('browser-guard')");
  await page.locator('[data-format="script"]').click(); await expect(page.locator('#integrationExample')).toContainText('<script src="https://cdn.jsdelivr.net/npm/browser-guard@1.0.0/guard.js">');
  await expect(page.locator('#toast')).toContainText('Copied to clipboard');
});
test('only the sample is guarded and advanced detection stays off by default', async ({ page }) => {
  const result = await page.evaluate(() => {
    const send = node => node.dispatchEvent(new Event('copy', { bubbles: true, cancelable: true }));
    return { protected: send(document.querySelector('#sampleText')), allowed: send(document.querySelector('[data-guard-allow] code')), outside: send(document.querySelector('.hero-description')), input: send(document.querySelector('#sampleInput')) };
  });
  expect(result).toEqual({ protected: false, allowed: true, outside: true, input: true });
  await page.locator('.advanced > summary').click(); await expect(page.locator('#antiDebugToggle')).not.toBeChecked(); await expect(page.locator('#consoleToggle')).not.toBeChecked();
  await page.locator('#checkDetection').click(); await expect(page.locator('#eventLog')).toContainText('Threshold: 160px');
});
for (const width of [1440, 390, 320]) test(`layout fits ${width}px viewport`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: width > 1000 ? 1080 : 844 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const sizes = await page.locator('.feature-strip span, .control strong').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(15);
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  await page.locator('#testCopy').click(); await expect(page.locator('#testResult')).toContainText('blocked');
  if (testInfo.project.name === 'chromium' && width !== 320) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(root, width > 1000 ? 'website-preview.png' : 'website-mobile.png'), fullPage: width < 1000 });
  }
});

test('documentation links open the styled reference and fit mobile', async ({ page }) => {
  await page.locator('.integration-code > a').click();
  await expect(page).toHaveTitle('Documentation — Browser Guard');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Clear boundaries');
  await page.setViewportSize({ width: 320, height: 844 });
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(320);
  await page.getByRole('navigation', { name: 'Documentation sections' }).getByRole('link', { name: 'Anti-debugging' }).click();
  await expect(page).toHaveURL(/#anti-debugging$/);
});

test('framework examples match source files, include disable cleanup, and copy correctly', async ({ page }) => {
  await page.evaluate(() => { window.copied = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => window.copied.push(text) } }); });
  for (const [framework, file] of [['react', 'ReactArticle.jsx'], ['vue', 'VueArticle.vue'], ['angular', 'AngularArticle.ts'], ['svelte', 'SvelteArticle.svelte']]) {
    await page.locator('[data-format="' + framework + '"]').click();
    await expect(page.locator('#integrationExample')).toHaveText(fs.readFileSync(path.join(root, 'examples', file), 'utf8').trim());
    await expect(page.locator('#integrationExample')).toContainText(/guard\??\.disable\(\)/);
    await page.locator('[data-copy="integration"]').click();
    const value = await page.evaluate(() => window.copied.at(-1));
    expect(value).toContain("from 'browser-guard'");
  }
  await page.locator('[data-copy="install"]').click();
  expect(await page.evaluate(() => window.copied.at(-1))).toBe('npm install browser-guard');
  await expect(page.locator('.version').first()).toHaveText('v1.0');
  expect(await page.locator('[download]').count()).toBe(0);
});
