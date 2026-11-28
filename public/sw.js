// Ascent service worker — makes the site work offline and open instantly.
//  • pages (HTML) + owner.json: network first (always fresh), saved copy when offline
//  • built files (/_astro/), fonts, images, icons: cache first (they never change under the same name)
//  • videos / audio and other sites' APIs (GitHub, LeetCode): straight to the network
// Bump VERSION to throw away old caches.
const VERSION = 'v1';
const PAGES = `ascent-pages-${VERSION}`, ASSETS = `ascent-assets-${VERSION}`;
const CORE = ['/', '/gym/', '/goals/', '/log/', '/journal/', '/explore/', '/about/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('ascent-') && k !== PAGES && k !== ASSETS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const networkFirst = async (req) => {
  const c = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') c.put(req, res.clone());
    return res;
  } catch {
    return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? (await c.match('/')) : undefined) || Response.error();
  }
};
const cacheFirst = async (req) => {
  const c = await caches.open(ASSETS), hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') c.put(req, res.clone());
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/videos/') || url.pathname.startsWith('/audio/') || req.headers.has('range')) return;
    if (req.mode === 'navigate' || req.destination === 'document' || url.pathname === '/owner.json' || url.pathname.endsWith('.webmanifest')) return e.respondWith(networkFirst(req));
    if (url.pathname.startsWith('/_astro/') || /\.(png|jpe?g|webp|avif|svg|ico|woff2?)$/.test(url.pathname)) return e.respondWith(cacheFirst(req));
    return;
  }
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') e.respondWith(cacheFirst(req));
});
