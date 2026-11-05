const path = require('node:path');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(__dirname,'../../node_modules/.cache/ms-playwright');
module.exports = require('@playwright/test').defineConfig({
 testDir:__dirname, testMatch:'*.spec.cjs', workers:1, timeout:30000,
 use:{baseURL:'http://127.0.0.1:8771',headless:true},
 projects:['chromium','firefox','webkit'].map(name=>({name,use:{browserName:name}})),
 webServer:{cwd:path.resolve(__dirname,'../..'),command:'node tests/integration/serve.cjs',url:'http://127.0.0.1:8771/javascript.html',reuseExistingServer:false}
});
