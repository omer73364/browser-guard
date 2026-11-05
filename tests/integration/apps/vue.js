import './harness.js';
import { createApp, createSSRApp } from 'vue';
import Article from './.generated/VueArticle.vue';
let app;
window.harness.bind(() => {
  if (app) return;
  app = (location.pathname.includes('hydrated') && !window.hydratedOnce ? createSSRApp : createApp)(Article); window.hydratedOnce = true; app.mount('#app');
}, () => { app?.unmount(); app = undefined; });
