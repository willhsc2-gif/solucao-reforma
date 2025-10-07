const CACHE_NAME = 'solucao-reformas-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Removido /src/main.tsx, /src/App.tsx, /src/globals.css, /src/App.css
  // Em um ambiente de produção, esses arquivos são empacotados.
  // O Vite gera nomes de arquivo com hash, então não podemos listá-los diretamente aqui.
  // O Service Worker deve interceptar as requisições para os assets gerados.
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/placeholder.svg',
  // Adicione aqui outros assets estáticos que você deseja cachear
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