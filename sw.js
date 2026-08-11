/* Service worker: deja la app disponible sin señal. Subir versión al publicar cambios. */
const CACHE = 'ot-ia-v1';
const BASE = self.registration.scope;
const PRECARGA = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await Promise.all(PRECARGA.map(u => c.add(new Request(u, { mode: u.startsWith('http') && !u.startsWith(BASE) ? 'no-cors' : 'same-origin' })).catch(() => {})));
    self.skipWaiting();
  }));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;                  // los envíos nunca se cachean
  if (url.indexOf('script.google.com') !== -1) return;      // el proxy siempre va a la red
  if (url.indexOf('script.googleusercontent.com') !== -1) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match(BASE + 'index.html')))
  );
});
