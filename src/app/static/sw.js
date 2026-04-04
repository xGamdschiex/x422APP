const CACHE_NAME = 'athena-grow-v5';

const PRECACHE_URLS = [
  '/',
  '/manifest.json'
];

// Precache sprites
const spriteFiles = [];
['w1-d1', 'w1-d4', 'w2-d1', 'w2-d4'].forEach(s => spriteFiles.push(`/sprites/clone-${s}.svg`));
['w1-d1','w1-d4','w2-d1','w2-d4','w2-d7','w3-d1','w3-d4','w3-d7','w4-d1','w4-d4','w4-d7','w4-d7-preflip'].forEach(s => spriteFiles.push(`/sprites/veg-${s}.svg`));
['w1-d1','w1-d3','w1-d5','w1-d7','w2-d1','w2-d3','w2-d5','w2-d7','w3-d1','w3-d4','w3-d7','w4-d1','w4-d4','w4-d7','w5-d1','w5-d4','w5-d7','w6-d1','w6-d4','w6-d7','w7-d1','w7-d4','w7-d7','w8-d1','w8-d4','w8-d7','w9-d1','w9-d3','w9-d5','w9-d7','w9-d7-chop','w1-d1-stretch','w2-d1-stretch','w5-d4-peak'].forEach(s => spriteFiles.push(`/sprites/bloom-${s}.svg`));

const ALL_URLS = [...PRECACHE_URLS, ...spriteFiles];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ALL_URLS).catch(() => cache.addAll(PRECACHE_URLS));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => {
      // Alle offenen Tabs neu laden nach SW-Update
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first fuer HTML und JS (damit Updates sofort ankommen)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }

  // Cache-first fuer Bilder/Sprites (aendert sich selten)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
