const CACHE_NAME = 'ssat-vocab-cache-v2';

// Static assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => {
                console.warn('[SW] Failed to cache some static assets:', err);
            })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch: Network-first with cache fallback for navigation, Cache-first for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests
    if (url.origin !== location.origin) return;

    // For navigation requests (HTML pages), try network first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the fresh response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Network failed, try cache
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('/');
                    });
                })
        );
        return;
    }

    // For assets (JS, CSS, images), try cache first, then network
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                // Return cached version, but also update cache in background
                fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, response);
                        });
                    }
                }).catch(() => { });
                return cached;
            }

            // Not in cache, fetch from network
            return fetch(request).then((response) => {
                if (!response || response.status !== 200) {
                    return response;
                }

                // Cache the new response
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });

                return response;
            }).catch(() => {
                // Offline and not cached - return a fallback for assets
                console.warn('[SW] Fetch failed for:', request.url);
                return new Response('', { status: 503, statusText: 'Offline' });
            });
        })
    );
});
