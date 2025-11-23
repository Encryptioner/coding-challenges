/**
 * Service Worker for Mobile IDE PWA
 * Handles offline support, caching, and background sync
 */

const CACHE_NAME = 'mobile-ide-v1.0.0';
const RUNTIME_CACHE = 'mobile-ide-runtime';
const MAX_CACHE_AGE_MS = 3600000; // 1 hour

// Files to cache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

/**
 * Install event - cache essential files
 */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Pre-caching static assets');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');

    const currentCaches = [CACHE_NAME, RUNTIME_CACHE];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!currentCaches.includes(cacheName)) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip POST requests and non-GET methods
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Check if cache is stale
                const cacheTime = cachedResponse.headers.get('sw-cache-time');
                if (cacheTime) {
                    const age = Date.now() - parseInt(cacheTime, 10);
                    if (age > MAX_CACHE_AGE_MS) {
                        // Cache is stale, fetch fresh
                        return fetchAndCache(event.request);
                    }
                }
                return cachedResponse;
            }

            return fetchAndCache(event.request);
        }).catch(() => {
            // Network failed, return offline page if available
            return caches.match('/offline.html');
        })
    );
});

/**
 * Fetch from network and update cache
 */
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);

        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
            return response;
        }

        // Clone response
        const responseToCache = response.clone();

        // Add cache time header
        const headers = new Headers(responseToCache.headers);
        headers.append('sw-cache-time', Date.now().toString());

        const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers,
        });

        // Cache the response
        caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, modifiedResponse);
        });

        return response;
    } catch (error) {
        console.error('[ServiceWorker] Fetch failed:', error);
        throw error;
    }
}

/**
 * Message event - handle commands from app
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }
});

/**
 * Background Sync event - for offline operations
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-git-changes') {
        event.waitUntil(syncGitChanges());
    }

    if (event.tag === 'sync-file-saves') {
        event.waitUntil(syncFileSaves());
    }
});

async function syncGitChanges() {
    // Implement git sync logic
    console.log('[ServiceWorker] Syncing git changes...');
}

async function syncFileSaves() {
    // Implement file save sync logic
    console.log('[ServiceWorker] Syncing file saves...');
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
        },
        actions: [
            {
                action: 'explore',
                title: 'Open',
            },
            {
                action: 'close',
                title: 'Close',
            },
        ],
    };

    event.waitUntil(
        self.registration.showNotification('Mobile IDE', options)
    );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});
