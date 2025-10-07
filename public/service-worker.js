const CACHE_NAME = 'solucao-reformas-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Removed references to source files as they are bundled in production.
  // The build process generates unique asset names (e.g., index-CHo9Nwzz.js, index-ODOx6Yy0.css).
  // The service worker should ideally be configured to cache these generated assets dynamically
  // or you can manually add their expected paths if they are static.
  // For simplicity and to avoid caching issues with changing build hashes,
  // we'll focus on core static assets and let the browser handle the main JS/CSS bundles.
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/placeholder.svg',
  // Add here other static assets that you wish to cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});