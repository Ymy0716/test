const cacheName = 'vocab-app-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './vocab.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cacheResponse => cacheResponse || fetch(event.request))
  );
});
