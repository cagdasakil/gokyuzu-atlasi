// Çevrimdışı çalışma: sayfa ve veriler ilk açılışta saklanır, internet yokken de açılır.
const CACHE = 'gokyuzu-20261018231221';
const CORE = ['./', './index.html', './gokyuzu-veri.js', './gokyuzu-veri-derin.js', './gokyuzu-exo.js', './manifest.webmanifest', './icon-192.png',
  'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js', 'https://cdn.jsdelivr.net/npm/satellite.js@5.0.0/dist/satellite.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // live data (ISS orbit, weather) always from the network
  if (u.hostname.includes('celestrak') || u.hostname.includes('open-meteo')) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })));
});
