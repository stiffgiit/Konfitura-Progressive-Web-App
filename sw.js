const CACHE_NAME = 'konfitura-cache-v9';

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
    './src/css/images/layers.png',
    './src/css/images/layers-2x.png',
    './src/css/images/marker-icon.png',
    './src/css/images/marker-icon-2x.png',
    './src/css/images/marker-shadow.png',
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
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).catch(() => {
                return new Response('', {
                    status: 404,
                    statusText: 'Not Found'
                });
            });
        })
    );
});
