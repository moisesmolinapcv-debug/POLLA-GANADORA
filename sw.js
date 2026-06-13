const CACHE_NAME = 'polla-parley-v8';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './supabase-js.js',
  './world_cup_data.js',
  './manifest.json',
  './Icono Oficial de la App.png'
];

// Install Event - cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - network-first for code/manifest, cache-first for images
self.addEventListener('fetch', (e) => {
  // Avoid non-GET requests
  if (e.request.method !== 'GET') {
    return;
  }

  const isSameOrigin = e.request.url.startsWith(self.location.origin);
  const isFlagCDN = e.request.url.startsWith('https://flagcdn.com/');
  const isSupabase = e.request.url.startsWith('https://vbodvczpnmyxdcerpxrb.supabase.co');

  // Allow caching for local files, flagcdn flag images, and Supabase GET requests
  if (!isSameOrigin && !isFlagCDN && !isSupabase) {
    return;
  }

  const isImage = e.request.destination === 'image' || 
                  e.request.url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i);

  if (isImage) {
    // Cache-First strategy for images
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Graceful fallback if offline
          return caches.match('./Icono Oficial de la App.png');
        });
      })
    );
  } else {
    // Network-First strategy for HTML, JS, CSS, JSON, manifest
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Graceful failure
          });
        })
    );
  }
});
