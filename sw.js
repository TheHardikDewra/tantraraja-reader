/* sw.js: offline cache for the reader. Bump VERSION when shipping changes. */
const VERSION = 'v2-2026-11-14';
const SHELL = VERSION + '-shell';
const BOOK = VERSION + '-book';

// The app shell. Paths are relative to this file, so the site works under /tantraraja-reader/.
const SHELL_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'favicon.svg',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'css/base.css', 'css/themes.css', 'css/pages.css', 'css/highlights.css', 'css/nav.css',
  'js/core.js', 'js/paginator.js', 'js/settings.js', 'js/highlights.js', 'js/nav.js', 'js/boot.js', 'js/pwa.js',
  'fonts/NotoSerifDevanagari-Regular.ttf', 'fonts/NotoSerifDevanagari-Bold.ttf',
  'fonts/NotoSerif-Regular.ttf', 'fonts/NotoSerif-Bold.ttf', 'fonts/NotoSerif-Italic.ttf',
  'data/toc.json',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // One missing file must not break the whole install, so add them one by one.
    await Promise.allSettled(SHELL_FILES.map(f => cache.add(new Request(f, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL, BOOK];
    for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Chapters (data/dev/NN.html, data/iast/NN.html) go in the book cache the first time they open.
const isChapter = url => /\/data\/(dev|iast)\/[^/]+\.html$/.test(url.pathname);

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const cacheName = isChapter(url) ? BOOK : SHELL;

  if (req.mode === 'navigate') {
    // Pages: try the network, fall back to the cached shell when offline.
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(SHELL)).put('index.html', res.clone());
        return res;
      } catch (e) {
        const cache = await caches.open(SHELL);
        return (await cache.match('index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Everything else: answer from cache at once, refresh it in the background (stale-while-revalidate).
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => {
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    return (await network) || new Response('Offline and not cached yet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});

// The page can ask for every chapter to be saved for offline reading.
self.addEventListener('message', event => {
  const msg = event.data || {};
  if (msg.type === 'cache-all' && Array.isArray(msg.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(BOOK);
      let done = 0;
      for (const u of msg.urls) {
        try { if (!(await cache.match(u))) await cache.add(u); } catch (e) {}
        done++;
      }
      const all = await self.clients.matchAll();
      all.forEach(c => c.postMessage({ type: 'cache-all:done', done, total: msg.urls.length }));
    })());
  }
});
