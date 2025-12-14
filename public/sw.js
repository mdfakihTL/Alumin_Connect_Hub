const CACHE_NAME = 'alumnihub-v2'; // Bumped version to clear old cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // DO NOT cache /login or any /api routes
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

// Activate event - clean up old caches (including v1 with /login)
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
    }).then(() => {
      // Force claim to activate immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - MINIMAL handler, bypass everything except static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;
  
  // CRITICAL RULES:
  // ❌ Never cache /login, /auth, /api
  // ❌ Never intercept POST/PUT/DELETE/PATCH
  // ❌ Never intercept external API calls
  // ✅ Only cache same-origin static assets (GET requests)
  
  // BYPASS service worker for:
  if (
    // API endpoints
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname === '/login' ||
    // External backend
    url.hostname !== self.location.hostname ||
    // Non-GET methods
    request.method !== 'GET' ||
    // Credentials or auth headers
    request.credentials === 'include' ||
    request.headers.get('Authorization')
  ) {
    // Don't intercept - let browser handle normally
    return;
  }
  
  // Only cache same-origin GET requests for static assets
  event.respondWith(
    caches.match(request)
      .then((cached) => cached || fetch(request))
      .catch(() => fetch(request))
  );
});

