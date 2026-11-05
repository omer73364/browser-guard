import './harness.js';
import { mount, unmount, hydrate } from 'svelte';
import Article from './.generated/SvelteArticle.svelte';
let app;
window.harness.bind(() => {
  if (!app) {
    app = (location.pathname.includes('hydrated') && !window.hydratedOnce ? hydrate : mount)(Article, { target: document.querySelector('#app') });
    window.hydratedOnce = true;
  }
}, async () => { if (app) { const previous = app; app = undefined; await unmount(previous); } });
