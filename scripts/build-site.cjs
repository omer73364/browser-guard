const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = ['index.html', 'docs.html', 'site.css', 'demo.js', 'guard.js', 'guard.mjs', 'README.md', 'favicon.svg', 'code-highlight.js'];
fs.mkdirSync(output, { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
console.log('Website ready in dist/');
