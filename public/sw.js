/**
 * Service Worker
 * 
 * 1. Cache-first strategy for Firebase Storage images
 * 2. FCM Push Notifications (web)
 * 
 * Intercepts fetch requests to firebasestorage.googleapis.com and
 * serves them from CacheStorage when available. Falls back to network.
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

// =============================================================================
// FCM Push Notifications (web)
// =============================================================================

/**
 * Handle incoming push messages from Firebase Cloud Messaging.
 * The payload comes from Cloud Functions via admin.messaging().send().
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        console.warn('[SW] Failed to parse push data:', e);
        return;
    }

    // FCM wraps notifications in a `notification` key, data in `data`
    const notification = data.notification || {};
    const title = notification.title || 'Bez Komprese';
    const options = {
        body: notification.body || '',
        icon: '/logo_120.webp',
        badge: '/logo_120.webp',
        data: data.data || {},
        tag: data.data?.tag || 'default',
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Handle notification click — open the app or focus existing tab
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    let url = data.url || '/'; // Default to root

    // Determine target URL based on notification payload type
    if (data.type) {
        switch (data.type) {
            case 'new_event':
            case 'event_update':
            case 'event_comment':
            case 'event_participation':
                if (data.eventId) url = `/events/${data.eventId}`;
                break;
            case 'friend_request':
            case 'badge_awarded':
            case 'beacon_status_change': // Has userId
                if (data.userId) url = `/profile/${data.userId}`;
                break;
            case 'chat_message':
                url = '/chats';
                // Note: /chats doesn't immediately open the specific room in mobile UI yet, but goes to the chat list.
                break;
            case 'marketplace_listing':
                if (data.listingId) url = `/market/${data.listingId}`;
                break;
            case 'vehicle_reminder':
                if (data.carId) url = `/garage/${data.carId}/service`;
                break;
            case 'sos_beacon':
                url = '/tracker';
                break;
        }
    }

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing tab if found
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Otherwise open new tab
            return self.clients.openWindow(url);
        })
    );
});

