self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            })
        ])
    );
});

// Leave network requests to the browser. Intercepting third-party script
// redirects with fetch(event.request) prevents Turnstile from loading on
// subsequent visits. No offline response or request cache is needed here.
