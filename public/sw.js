// Service Worker for TheBulletinBriefs PWA - Optimized for Performance
const CACHE_VERSION = 'v3';
const CACHE_NAME = `bulletin-briefs-${CACHE_VERSION}`;
const STATIC_CACHE = `bulletin-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `bulletin-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `bulletin-images-${CACHE_VERSION}`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/logo.png',
  '/tb-briefs-favicon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('Failed to cache static assets:', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
  );
  self.clients.claim();
});

// Message handler for cache control
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        self.clients.claim();
      })
    );
  }
});

// Fetch event - network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) return;

  const isHTMLRequest = request.mode === 'navigate' || 
                        request.destination === 'document' ||
                        request.headers.get('accept')?.includes('text/html');

  // Network-first strategy for HTML to prevent blank screens
  if (isHTMLRequest) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request)
            .then(cached => cached || caches.match('/offline.html'));
        })
    );
    return;
  }

  // Cache-first strategy for static assets with smart caching
  const isImage = request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(request.url);
  const cacheName = isImage ? IMAGE_CACHE : DYNAMIC_CACHE;
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update cache in background for non-images
          if (!isImage) {
            updateCache(request);
          }
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Cache successful responses
            const responseToCache = response.clone();
            caches.open(cacheName)
              .then(cache => {
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Return placeholder for images
            if (isImage) {
              return new Response(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect fill="#f0f0f0" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="#999">Image unavailable</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions here
      syncOfflineActions()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'New article available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'read',
        title: 'Read Now',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data.url = data.url || options.data.url;
  }
  
  event.waitUntil(
    self.registration.showNotification('TheBulletinBriefs', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'read') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Helper functions
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('Failed to update cache:', error);
  }
}

async function syncOfflineActions() {
  // Implement offline action syncing here
  // e.g., sync likes, comments, reading progress
  console.log('Syncing offline actions...');
}

// Cache size management - Improved with separate image cache
async function cleanupCache() {
  // Clean dynamic cache
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  const dynamicKeys = await dynamicCache.keys();
  if (dynamicKeys.length > 50) {
    const keysToDelete = dynamicKeys.slice(0, dynamicKeys.length - 50);
    await Promise.all(keysToDelete.map(key => dynamicCache.delete(key)));
  }
  
  // Clean image cache
  const imageCache = await caches.open(IMAGE_CACHE);
  const imageKeys = await imageCache.keys();
  if (imageKeys.length > 100) {
    const keysToDelete = imageKeys.slice(0, imageKeys.length - 100);
    await Promise.all(keysToDelete.map(key => imageCache.delete(key)));
  }
}

// Run cleanup when service worker is idle
self.addEventListener('idle', cleanupCache);