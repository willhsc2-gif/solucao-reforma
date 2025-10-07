const CACHE_STATIC_NAME = 'solucao-reformas-static-cache-v1';
const CACHE_DYNAMIC_NAME = 'solucao-reformas-dynamic-cache-v1';

const staticUrlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/placeholder.svg',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and pre-caching static assets.');
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then((cache) => {
        console.log('Service Worker: Pre-caching static assets.');
        return cache.addAll(staticUrlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate new service worker immediately
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated. Cleaning old caches.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC_NAME && cacheName !== CACHE_DYNAMIC_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Check if the request is for a static asset that should be cache-first
  if (staticUrlsToCache.includes(requestUrl.pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return; // Stop further processing for static assets
  }

  // For all other requests (dynamic assets like JS/CSS bundles, API calls, etc.), use network-first
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // If network fails, try to get it from the dynamic cache
        return caches.match(event.request);
      })
  );
});