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

// Fetch event - bypass API calls completely, cache only static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;
  
  // CRITICAL: Bypass service worker for ALL API calls and non-GET requests
  // This prevents service worker from intercepting POST/PUT/DELETE requests
  if (
    // API endpoints
    url.pathname.startsWith('/api/') ||
    // Backend server
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('alumni-portal-yw7q') ||
    // All mutation methods (POST, PUT, DELETE, PATCH)
    request.method !== 'GET' ||
    // Any request with credentials
    request.credentials === 'include'
  ) {
    // Don't intercept - let request go directly to network
    // Returning undefined means service worker won't handle this request
    return;
  }
  
  // Only handle GET requests for static assets (HTML, CSS, JS, images)
  // Don't cache API responses or dynamic content
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network for static assets only
        return fetch(request).then((response) => {
          // Only cache successful GET responses for static assets
          if (request.method === 'GET' && 
              response.status === 200 && 
              response.type === 'basic') {
            // Clone response before caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return network error
        return fetch(request);
      })
  );
});

