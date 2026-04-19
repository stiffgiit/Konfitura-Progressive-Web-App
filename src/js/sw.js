const CACHE_NAME = 'konfitura-cache-v6';

const ASSETS = [
    './index.html',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './src/css/bootstrap.min.css',
    './src/css/leaflet.css',
    './src/css/style.css',
    './src/js/leaflet.js',
    './src/js/bootstrap.bundle.min.js',
    './src/js/app.js',
    './images/layers.png',
    './images/layers-2x.png',
    './images/marker-icon.png',
    './images/marker-icon-2x.png',
    './images/marker-shadow.png',
];

self.addEventListener('install', event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});


self.addEventListener('fetch', event => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html')
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
