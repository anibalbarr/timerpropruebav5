const CACHE_NAME = 'timer-pro-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles/styles.css',
  './styles/script.js',
  './styles/img/Logo-Full-Color.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});