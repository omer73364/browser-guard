import './harness.js';
let guard;
window.harness.bind(() => {
  if (guard) return;
  document.querySelector('#app').textContent = 'Your content';
  guard = window.harness.Guard.create({ copy: true, select: true, rightClick: true, savePage: true, print: true, console: false, antiDebug: false });
  guard.enable();
}, () => { guard?.destroy(); guard = undefined; document.querySelector('#app').replaceChildren(); });
