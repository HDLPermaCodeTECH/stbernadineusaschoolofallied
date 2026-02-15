const CACHE_NAME = 'st-bernadine-v16';
const ASSETS_TO_CACHE = [
    './index.html',
    './styles.css',
    './script.js',
    './asset/images/logo.png',
    './asset/images/pc.webp',
    './asset/images/sahs.webp',
    './asset/images/hcs.jpg',
    './asset/images/hha.jpg',
    './asset/images/Violeta.jpg',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    // Force this service worker to become the active service worker, bypassing the waiting state
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    // Claim any clients immediately, so they utilize this service worker
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});
