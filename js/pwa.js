/* pwa.js: offline support and "Add to Home Screen". Registers sw.js and adds the head tags it needs. */
(function () {
  const head = document.head;
  const add = (tag, attrs) => {
    const sel = tag + Object.entries(attrs).filter(([k]) => k === 'rel' || k === 'name').map(([k, v]) => `[${k}="${v}"]`).join('');
    if (head.querySelector(sel)) return;
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    head.appendChild(el);
  };
  // All relative, so they resolve under /tantraraja-reader/ on GitHub Pages.
  add('link', { rel: 'manifest', href: 'manifest.webmanifest' });
  add('link', { rel: 'icon', href: 'favicon.svg', type: 'image/svg+xml' });
  add('link', { rel: 'apple-touch-icon', href: 'icons/apple-touch-icon.png' });
  add('meta', { name: 'theme-color', content: '#7A2E1D' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Tantrarāja' });
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });

  if (!('serviceWorker' in navigator)) return;
  // file:// and plain http (other than localhost) cannot run a service worker.
  if (!window.isSecureContext) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('[TR] offline cache not available:', err));
  });

  // TR.pwa.saveAll(): download every chapter in both scripts so the whole book reads offline.
  const TR = window.TR;
  if (TR) {
    TR.pwa = {
      async saveAll() {
        const reg = await navigator.serviceWorker.ready;
        const toc = TR.state.toc.length ? TR.state.toc : await (await fetch('data/toc.json')).json();
        const base = new URL('.', location.href);
        const urls = [];
        toc.forEach(c => ['dev', 'iast'].forEach(s => urls.push(new URL(`data/${s}/${c.id}.html`, base).href)));
        return new Promise(resolve => {
          const onMsg = e => { if (e.data && e.data.type === 'cache-all:done') { navigator.serviceWorker.removeEventListener('message', onMsg); TR.emit('pwa:saved', e.data); resolve(e.data); } };
          navigator.serviceWorker.addEventListener('message', onMsg);
          (reg.active || navigator.serviceWorker.controller).postMessage({ type: 'cache-all', urls });
        });
      },
    };
  }
})();
