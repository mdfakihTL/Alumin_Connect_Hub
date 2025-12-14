const CACHE_NAME = 'alumnihub-v1';
const urlsToCache = [
  '/',
  '/login',
  '/index.html',
  '/manifest.json',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Don't fail if some URLs can't be cached
        return cache.addAll(urlsToCache).catch((err) => {
          console.warn('Some resources failed to cache:', err);
        });
      })
      .then(() => {
        console.log('Service Worker installed, skipping waiting...');
        return self.skipWaiting();
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - bypass API calls, cache only static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Bypass service worker for all API calls to backend
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('onrender.com') ||
      url.hostname.includes('alumni-portal-yw7q') ||
      event.request.method === 'POST' ||
      event.request.method === 'PUT' ||
      event.request.method === 'DELETE' ||
      event.request.method === 'PATCH') {
    // Let API requests go directly to network, don't intercept
    return;
  }
  
  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Only cache GET requests for static assets
            if (event.request.method === 'GET') {
              // Clone the response
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          }
        );
      })
  );
});

