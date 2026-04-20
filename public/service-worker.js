const CACHE_NAME = "CRAVAB-cache-v1";
const API_CACHE_NAME = "CRAVAB-api-v1";

// App shell resources (StaleWhileRevalidate strategy)
const appShellUrls = [
  "/",
  "/auth/login",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon-180x180.png",
  "/apple-touch-icon-152x152.png",
  "/apple-touch-icon-120x120.png",
  "/calls",
  "/clients", 
  "/appointments",
  "/more",
  "/services"
];

// API endpoints (NetworkFirst strategy)
const apiEndpoints = [
  "/api/calls",
  "/api/clients",
  "/api/appointments",
  "/api/vapi"
];

self.addEventListener("install", (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    // Clear all old caches first
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Then add new cache with error handling for iOS
      return caches.open(CACHE_NAME).then((cache) => {
        // Add resources one by one to handle iOS caching issues
        return Promise.allSettled(
          appShellUrls.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      });
    }).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    }).catch(error => {
      console.error('Service Worker installation failed:', error);
      // Don't fail installation on iOS
    })
  );
});

// Handle messages from main thread for cache invalidation
self.addEventListener("message", (event) => {
  const { type, tenantId, dataType } = event.data;

  if (type === "INVALIDATE_CACHE") {
    invalidateCacheByDataType(tenantId, dataType);
  } else if (type === "INVALIDATE_ALL_CACHES") {
    invalidateAllCaches(tenantId);
  } else if (type === "CLEAR_ALL_CACHES") {
    clearAllCaches();
  }
});

// Invalidate cache by data type
async function invalidateCacheByDataType(tenantId, dataType) {
  const caches = await caches.keys();
  
  for (const cacheName of caches) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const url = new URL(request.url);
      
      // Check if this request should be invalidated based on data type
      if (shouldInvalidateRequest(url, tenantId, dataType)) {
        await cache.delete(request);
      }
    }
  }
}

// Invalidate all caches for a tenant
async function invalidateAllCaches(tenantId) {
  const caches = await caches.keys();
  
  for (const cacheName of caches) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const url = new URL(request.url);
      
      // Check if this request belongs to the tenant
      if (url.searchParams.get('tenantId') === tenantId || 
          url.pathname.includes(`/api/`) ||
          url.pathname.includes(`/clients`) ||
          url.pathname.includes(`/appointments`) ||
          url.pathname.includes(`/calls`)) {
        await cache.delete(request);
      }
    }
  }
}

// Clear all caches
async function clearAllCaches() {
  const caches = await caches.keys();
  
  for (const cacheName of caches) {
    await caches.delete(cacheName);
  }
}

// Check if a request should be invalidated
function shouldInvalidateRequest(url, tenantId, dataType) {
  const dataTypeMap = {
    clients: ['/api/clients', '/clients'],
    appointments: ['/api/appointments', '/appointments'],
    calls: ['/api/calls', '/calls'],
    services: ['/api/services', '/services'],
    company: ['/api/company', '/settings'],
    documents: ['/api/documents', '/documents'],
    reports: ['/api/reports', '/reports']
  };

  const patterns = dataTypeMap[dataType] || [];
  
  return patterns.some(pattern => 
    url.pathname.startsWith(pattern) || 
    url.searchParams.get('tenantId') === tenantId
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle app shell resources (StaleWhileRevalidate)
  if (appShellUrls.some(shellUrl => url.pathname === shellUrl)) {
    event.respondWith(handleAppShell(request));
    return;
  }

  // Handle API calls (NetworkFirst)
  if (apiEndpoints.some(endpoint => url.pathname.startsWith(endpoint))) {
    event.respondWith(handleAPI(request));
    return;
  }

  // Handle static assets (CacheFirst)
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(handleStaticAssets(request));
    return;
  }

  // Default: NetworkFirst
  event.respondWith(handleDefault(request));
});

// StaleWhileRevalidate for app shell
async function handleAppShell(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Update cache in background
    const fetchPromise = fetch(request).then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone()).catch(error => {
          console.warn('Failed to cache response:', error);
        });
      }
      return response;
    }).catch(error => {
      console.warn('Network fetch failed:', error);
      return cachedResponse;
    });

    // Return cached version immediately, or wait for network
    return cachedResponse || fetchPromise;
  } catch (error) {
    console.error('App shell handling failed:', error);
    // Fallback to network
    try {
      return await fetch(request);
    } catch (networkError) {
      console.error('Network fallback failed:', networkError);
      // Return a basic offline page
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CRAVAB - Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #2563eb; }
            </style>
          </head>
          <body>
            <h1>CRAVAB</h1>
            <p>You're offline. Please check your connection and try again.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
}

// NetworkFirst for API calls
async function handleAPI(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const url = new URL(request.url);
  
  // Check if this is a localhost request in production - skip it
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    console.warn('Blocked localhost request in production:', url.href);
    return new Response(
      JSON.stringify({
        error: "Configuration Error",
        message: "API endpoint not configured for production",
        details: "This PWA is trying to call localhost. Please clear cache and reinstall the app."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response if no cache
    return new Response(
      JSON.stringify({ 
        error: "Offline", 
        message: "No internet connection and no cached data available" 
      }),
      { 
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// CacheFirst for static assets
async function handleStaticAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Default NetworkFirst strategy
async function handleDefault(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return error response
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "No internet connection and no cached data available"
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "new-appointment") {
    event.waitUntil(syncNewAppointments());
  }
  
  if (event.tag === "call-updates") {
    event.waitUntil(syncCallUpdates());
  }
});

// Sync queued appointments when back online
async function syncNewAppointments() {
  try {
    // Get queued appointments from IndexedDB
    const queuedAppointments = await getQueuedAppointments();
    
    for (const appointment of queuedAppointments) {
      try {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointment)
        });
        
        if (response.ok) {
          // Remove from queue
          await removeQueuedAppointment(appointment.id);
        }
      } catch (error) {
        console.error("Failed to sync appointment:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Sync call updates when back online
async function syncCallUpdates() {
  try {
    // Trigger a refresh of call data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: "SYNC_CALLS" });
    });
  } catch (error) {
    console.error("Failed to sync call updates:", error);
  }
}

// Helper functions for IndexedDB operations
async function getQueuedAppointments() {
  // This would interact with IndexedDB to get queued appointments
  // Implementation depends on your IndexedDB setup
  return [];
}

async function removeQueuedAppointment(id) {
  // Remove appointment from queue after successful sync
}

// Push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.data,
      actions: [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "view") {
    event.waitUntil(
      self.clients.openWindow("/calls")
    );
  }
});
