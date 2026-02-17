// Tango Dashboard — Service Worker
// Bump CACHE_VERSION to force update on all clients
const CACHE_VERSION = 'tango-v2';
const ASSETS = [
  './',
  './index.html',
  './order.html',
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

// Fetch — cache-first for local assets, network-only for external (CDN, APIs)
self.addEventListener('fetch', (event) => {
  // Don't cache external requests (Supabase API, CDN scripts, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return; // Let the browser handle it normally
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve cached version instantly, but also fetch fresh copy in background
        fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
            }
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
