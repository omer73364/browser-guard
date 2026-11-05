import './harness.js';
import React, { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import Article from './.generated/ReactArticle.jsx';
let root;
window.harness.bind(() => {
  if (root) return;
  const element = <StrictMode><Article /></StrictMode>;
  if (location.pathname.includes('hydrated') && !window.hydratedOnce) {
    window.hydratedOnce = true; root = hydrateRoot(document.querySelector('#app'), element);
  } else { root = createRoot(document.querySelector('#app')); root.render(element); }
}, () => { root?.unmount(); root = undefined; });
