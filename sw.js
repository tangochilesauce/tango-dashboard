// Tango Dashboard — Service Worker
// Bump CACHE_VERSION to force update on all clients
const CACHE_VERSION = 'tango-v1';
const ASSETS = [
  './',
  './tango-dashboard.html',
  './tango-system.css',
  './! LOGO.png',
  './manifest.json',
  // Fonts used by the dashboard (referenced in tango-system.css)
  './fonts/american typewriter/AmericanTypewriterStd-BdCnd.otf',
  './fonts/beast/Beast-Regular.otf',
  './fonts/gt-pressura/GT-Pressura-Mono-Light-Trial.otf',
  './fonts/gt-pressura/GT-Pressura-Mono-Regular-Trial.otf',
  './fonts/gt-pressura/GT-Pressura-Mono-Medium-Trial.otf',
  './fonts/gt-pressura/GT-Pressura-Mono-Bold-Trial.otf',
];

// Install — cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  // Activate immediately, don't wait for old tabs to close
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch — cache-first for speed, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve cached version instantly, but also fetch fresh copy in background
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {}); // Ignore network errors (we have the cache)
        return cached;
      }
      // Not in cache — try network, cache the result
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
