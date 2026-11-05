import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { transformAsync } from '@babel/core';
import linker from '@angular/compiler-cli/linker/babel';
const angularLinker = { name: 'angular-linker', async transform(code,id) {
 if (!id.includes('/node_modules/@angular/') || !id.endsWith('.mjs')) return;
 return await transformAsync(code, {filename:id, plugins:[linker],configFile:false,babelrc:false,sourceMaps:true});
}};
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
const cwd = path.dirname(fileURLToPath(import.meta.url));
process.chdir(cwd);
fs.mkdirSync('.generated/angular', { recursive: true });
const packageRoot = path.dirname(fileURLToPath(import.meta.resolve('browser-guard')));
for (const file of ['ReactArticle.jsx','VueArticle.vue','SvelteArticle.svelte']) fs.copyFileSync(path.join(packageRoot, 'examples',file),'.generated/'+file);
fs.copyFileSync(path.join(packageRoot,'examples/AngularArticle.ts'),'.generated/angular/AngularArticle.ts');
fs.copyFileSync('AngularApp.ts','.generated/angular/AngularApp.ts');
fs.writeFileSync('.generated/angular/tsconfig.json',JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'bundler',experimentalDecorators:true,skipLibCheck:true,strict:true,outDir:'../angular-compiled',lib:['ES2022','DOM']},angularCompilerOptions:{strictTemplates:true,compilationMode:'full'},files:['AngularApp.ts','AngularArticle.ts']}));
execFileSync(process.execPath,['node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js','-p','.generated/angular/tsconfig.json'],{stdio:'inherit'});
const names=['javascript','react','vue','angular','svelte'];
for (const name of names) {
 const shell=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>${name} integration</title></head><body><h1>${name} real app</h1><nav data-guard-allow><button id="mount">Mount</button><button id="unmount">Unmount</button></nav><div id="app"><integration-root></integration-root></div><section id="outside"><p id="protected" tabindex="0">Protected content outside framework component</p><input id="input"><textarea id="textarea"></textarea><select id="select"><option>Editable</option></select><div contenteditable="true" id="editable">Edit me</div><p data-guard-allow><span id="allowed">Copy me</span></p></section><script type="module" src="/${name}.${name==='react'?'jsx':'js'}"></script></body></html>`;
 fs.writeFileSync(name+'.html',shell);
}

for (const name of ['react','vue','svelte','angular']) {
 await build({root:cwd,plugins:[angularLinker,react(),vue(),svelte()],build:{ssr:`ssr-${name}.${name==='react'?'jsx':'js'}`,outDir:`.generated/ssr-${name}`,emptyOutDir:true,rolldownOptions:{output:{entryFileNames:'entry.mjs'}}}});
 const { render } = await import(path.join(cwd,`.generated/ssr-${name}/entry.mjs`));
 const html = await render();
 if (!html.includes('Your content') || html.includes('data-browser-guard')) throw new Error(`${name} SSR rendered incorrectly or activated browser protection`);
 console.log(`${name}: server rendering passed without browser globals`);
 if (name !== 'angular') {
  const shell=fs.readFileSync(name+'.html','utf8');
  fs.writeFileSync(name+'-hydrated.html',shell.replace('<integration-root></integration-root>',html));
  names.push(name+'-hydrated');
 }
}

await build({root:cwd,plugins:[angularLinker,react(),vue(),svelte()],build:{outDir:"dist",emptyOutDir:true,rolldownOptions:{output:{minify:{compress:{dropDebugger:false}}},input:Object.fromEntries(names.map(n=>[n,path.join(cwd,n+".html")]))}}});

await build({root:cwd,plugins:[react()],mode:"development",define:{"process.env.NODE_ENV":JSON.stringify("development")},base:"/dev/",build:{minify:false,outDir:"dist-dev",emptyOutDir:true,rolldownOptions:{input:path.join(cwd,"react.html")}}});

await build({root:cwd,base:"/stripped/",build:{outDir:"dist-stripped",emptyOutDir:true,rolldownOptions:{input:path.join(cwd,"javascript.html")}}});
