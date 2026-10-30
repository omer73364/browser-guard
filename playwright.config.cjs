const path = require('node:path');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(__dirname, 'node_modules/.cache/ms-playwright');
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 3,
  use: { headless: true },
  projects: ['chromium', 'firefox', 'webkit'].map(name => ({ name, use: { browserName: name } })),
});
