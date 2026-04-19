const CACHE_NAME = 'konfitura-cache-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/src/css/bootstrap.min.css',
    '/src/css/leaflet.css',
    '/src/css/style.css',
    '/src/js/leaflet.js',
    '/src/js/bootstrap.bundle.min.js',
    '/src/js/app.js',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
