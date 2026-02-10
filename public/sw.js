/**
 * Service Worker — Cache-first strategy for Firebase Storage images
 * 
 * Intercepts fetch requests to firebasestorage.googleapis.com and
 * serves them from CacheStorage when available. Falls back to network.
 * 
 * This SW only handles image caching. All other requests pass through.
 */

const CACHE_NAME = 'bk-images-v1';
const MAX_ENTRIES = 500;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Check if a request is a cacheable image from Firebase Storage or Google (avatars)
 */
function isCacheableImageRequest(url) {
    return (
        url.includes('firebasestorage.googleapis.com') ||
        url.includes('lh3.googleusercontent.com')
    );
}

// --- Install ---
self.addEventListener('install', (event) => {
    // Activate immediately, don't wait for old tabs to close
    self.skipWaiting();
});

// --- Activate ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('bk-images-') && name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// --- Fetch ---
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only intercept GET requests for cacheable images
    if (request.method !== 'GET' || !isCacheableImageRequest(request.url)) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. Try cache first
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. Cache miss — fetch from network
            try {
                const networkResponse = await fetch(request);

                // Only cache successful responses
                if (networkResponse.ok) {
                    // Clone before putting in cache (response can only be consumed once)
                    cache.put(request, networkResponse.clone());

                    // Async cleanup: evict old entries if over limit
                    trimCache(cache);
                }

                return networkResponse;
            } catch (error) {
                // Network failed — return a transparent 1x1 pixel as fallback
                return new Response(
                    new Uint8Array([
                        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
                        0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
                        0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
                        0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
                        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
                        0x01, 0x00, 0x3b,
                    ]),
                    { headers: { 'Content-Type': 'image/gif' } }
                );
            }
        })
    );
});

/**
 * Trim cache to MAX_ENTRIES by removing oldest entries
 */
async function trimCache(cache) {
    const keys = await cache.keys();
    if (keys.length <= MAX_ENTRIES) return;

    // Remove oldest entries (first in = oldest)
    const toDelete = keys.length - MAX_ENTRIES;
    for (let i = 0; i < toDelete; i++) {
        await cache.delete(keys[i]);
    }
}
