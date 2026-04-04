const CACHE_NAME = 'athena-grow-v3';

const PRECACHE_URLS = [
  '/',
  '/manifest.json'
];

// Precache sprites
const phases = ['clone', 'veg', 'bloom'];
const spriteFiles = [];

// Clone sprites
['w1-d1', 'w1-d4', 'w2-d1', 'w2-d4'].forEach(s => spriteFiles.push(`/sprites/clone-${s}.svg`));

// Veg sprites
['w1-d1','w1-d4','w2-d1','w2-d4','w2-d7','w3-d1','w3-d4','w3-d7','w4-d1','w4-d4','w4-d7','w4-d7-preflip'].forEach(s => spriteFiles.push(`/sprites/veg-${s}.svg`));

// Bloom sprites
['w1-d1','w1-d3','w1-d5','w1-d7','w2-d1','w2-d3','w2-d5','w2-d7','w3-d1','w3-d4','w3-d7','w4-d1','w4-d4','w4-d7','w5-d1','w5-d4','w5-d7','w6-d1','w6-d4','w6-d7','w7-d1','w7-d4','w7-d7','w8-d1','w8-d4','w8-d7','w9-d1','w9-d3','w9-d5','w9-d7','w9-d7-chop','w1-d1-stretch','w2-d1-stretch','w5-d4-peak'].forEach(s => spriteFiles.push(`/sprites/bloom-${s}.svg`));

const ALL_URLS = [...PRECACHE_URLS, ...spriteFiles];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ALL_URLS).catch(() => {
        // Graceful fallback if some assets not yet available
        return cache.addAll(PRECACHE_URLS);
      });
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      }).catch(() => {
        // Offline fallback
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
