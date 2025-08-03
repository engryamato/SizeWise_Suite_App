/**
 * Enhanced Service Worker for SizeWise Suite
 * 
 * This service worker enhances the existing next-pwa service worker with:
 * - Advanced offline capabilities for HVAC calculations
 * - Background sync for calculation results
 * - Enhanced caching strategies for HVAC data
 * - Offline-first calculation queue management
 * - Progressive enhancement of existing functionality
 * 
 * @see docs/post-implementation-bridging-plan.md Task 2.1
 */

// Service Worker Configuration
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  HVAC_CALCULATIONS: `sizewise-hvac-calculations-${CACHE_VERSION}`,
  HVAC_DATA: `sizewise-hvac-data-${CACHE_VERSION}`,
  OFFLINE_QUEUE: `sizewise-offline-queue-${CACHE_VERSION}`,
  COMPLIANCE_DATA: `sizewise-compliance-${CACHE_VERSION}`,
  PROJECT_DATA: `sizewise-projects-${CACHE_VERSION}`
};

const OFFLINE_QUEUE_NAME = 'sizewise-offline-operations';
const BACKGROUND_SYNC_TAG = 'sizewise-background-sync';

// =============================================================================
// Service Worker Installation and Activation
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing enhanced service worker');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical HVAC calculation resources
      caches.open(CACHE_NAMES.HVAC_DATA).then(cache => {
        return cache.addAll([
          '/api/calculations/air-duct',
          '/api/calculations/grease-duct',
          '/api/calculations/boiler-vent',
          '/api/compliance/check',
          '/api/compliance/standards-info'
        ].map(url => new Request(url, { method: 'GET' })));
      }),
      
      // Initialize offline queue
      caches.open(CACHE_NAMES.OFFLINE_QUEUE),
      
      // Pre-cache compliance data
      caches.open(CACHE_NAMES.COMPLIANCE_DATA).then(cache => {
        return cache.addAll([
          '/api/compliance/ashrae-902',
          '/api/compliance/iecc-2024',
          '/api/compliance/all-advanced'
        ].map(url => new Request(url, { method: 'GET' })));
      })
    ])
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating enhanced service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('sizewise-') && 
              !Object.values(CACHE_NAMES).includes(cacheName)
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// =============================================================================
// Enhanced Fetch Handler for HVAC Operations
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle requests to our origin
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle HVAC calculation requests
  if (url.pathname.startsWith('/api/calculations/')) {
    event.respondWith(handleHVACCalculationRequest(request));
    return;
  }
  
  // Handle compliance requests
  if (url.pathname.startsWith('/api/compliance/')) {
    event.respondWith(handleComplianceRequest(request));
    return;
  }
  
  // Handle project data requests
  if (url.pathname.startsWith('/api/projects/')) {
    event.respondWith(handleProjectDataRequest(request));
    return;
  }
});

// =============================================================================
// HVAC Calculation Request Handler
// =============================================================================

async function handleHVACCalculationRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(CACHE_NAMES.HVAC_CALCULATIONS);
  
  try {
    // For POST requests (calculations), try network first
    if (request.method === 'POST') {
      try {
        const response = await fetch(request.clone());
        
        if (response.ok) {
          // Cache successful calculation results
          const responseClone = response.clone();
          const data = await responseClone.json();
          
          // Store calculation result with timestamp
          const cacheKey = `calculation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const cacheResponse = new Response(JSON.stringify({
            ...data,
            cached: true,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
          
          cache.put(cacheKey, cacheResponse);
          return response;
        }
      } catch (error) {
        console.log('[Enhanced SW] Network failed for calculation, queuing for background sync');
        
        // Queue the request for background sync
        await queueOfflineOperation(request);
        
        // Return a response indicating offline mode
        return new Response(JSON.stringify({
          success: false,
          offline: true,
          message: 'Calculation queued for when connection is restored',
          queueId: `queue-${Date.now()}`
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For GET requests, try cache first, then network
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[Enhanced SW] Error handling HVAC calculation request:', error);
    
    // Return cached response if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      success: false,
      offline: true,
      message: 'Unable to perform calculation offline. Please try again when connected.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// =============================================================================
// Compliance Request Handler
// =============================================================================

async function handleComplianceRequest(request) {
  const cache = await caches.open(CACHE_NAMES.COMPLIANCE_DATA);
  
  try {
    // Try network first for fresh compliance data
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[Enhanced SW] Network failed for compliance request, using cache');
  }
  
  // Fallback to cached compliance data
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return default compliance response if no cache available
  return new Response(JSON.stringify({
    success: false,
    offline: true,
    message: 'Compliance data not available offline'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// =============================================================================
// Project Data Request Handler
// =============================================================================

async function handleProjectDataRequest(request) {
  const cache = await caches.open(CACHE_NAMES.PROJECT_DATA);
  
  try {
    if (request.method === 'GET') {
      // Try cache first for project data
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.log('[Enhanced SW] Network failed for project request');
    
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Queue non-GET requests for background sync
    if (request.method !== 'GET') {
      await queueOfflineOperation(request);
      return new Response(JSON.stringify({
        success: false,
        offline: true,
        message: 'Operation queued for when connection is restored'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      offline: true,
      message: 'Project data not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// =============================================================================
// Offline Queue Management
// =============================================================================

async function queueOfflineOperation(request) {
  const cache = await caches.open(CACHE_NAMES.OFFLINE_QUEUE);
  const queueId = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const queueItem = {
    id: queueId,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: new Date().toISOString()
  };
  
  const queueResponse = new Response(JSON.stringify(queueItem), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  await cache.put(queueId, queueResponse);
  
  // Register background sync if supported
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      await self.registration.sync.register(BACKGROUND_SYNC_TAG);
    } catch (error) {
      console.log('[Enhanced SW] Background sync not supported');
    }
  }
  
  return queueId;
}

// =============================================================================
// Background Sync Handler
// =============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  const cache = await caches.open(CACHE_NAMES.OFFLINE_QUEUE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await cache.match(request);
      const queueItem = await response.json();
      
      // Reconstruct the original request
      const originalRequest = new Request(queueItem.url, {
        method: queueItem.method,
        headers: queueItem.headers,
        body: queueItem.body
      });
      
      // Try to execute the queued request
      const networkResponse = await fetch(originalRequest);
      
      if (networkResponse.ok) {
        // Remove from queue on success
        await cache.delete(request);
        console.log(`[Enhanced SW] Successfully processed queued operation: ${queueItem.id}`);
        
        // Notify clients of successful sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'BACKGROUND_SYNC_SUCCESS',
            queueId: queueItem.id,
            url: queueItem.url
          });
        });
      }
    } catch (error) {
      console.error('[Enhanced SW] Failed to process queued operation:', error);
    }
  }
}

// =============================================================================
// Message Handler for Client Communication
// =============================================================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus(event);
      break;
    case 'CLEAR_CACHE':
      handleClearCache(event, data);
      break;
    case 'GET_OFFLINE_QUEUE':
      handleGetOfflineQueue(event);
      break;
    default:
      console.log('[Enhanced SW] Unknown message type:', type);
  }
});

async function handleGetCacheStatus(event) {
  const cacheStatus = {};
  
  for (const [name, cacheName] of Object.entries(CACHE_NAMES)) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheStatus[name] = {
      name: cacheName,
      entries: keys.length
    };
  }
  
  event.ports[0].postMessage({
    type: 'CACHE_STATUS',
    data: cacheStatus
  });
}

async function handleClearCache(event, data) {
  const { cacheType } = data;
  
  if (cacheType && CACHE_NAMES[cacheType]) {
    await caches.delete(CACHE_NAMES[cacheType]);
  } else {
    // Clear all SizeWise caches
    for (const cacheName of Object.values(CACHE_NAMES)) {
      await caches.delete(cacheName);
    }
  }
  
  event.ports[0].postMessage({
    type: 'CACHE_CLEARED',
    data: { cacheType }
  });
}

async function handleGetOfflineQueue(event) {
  const cache = await caches.open(CACHE_NAMES.OFFLINE_QUEUE);
  const requests = await cache.keys();
  const queueItems = [];
  
  for (const request of requests) {
    const response = await cache.match(request);
    const queueItem = await response.json();
    queueItems.push(queueItem);
  }
  
  event.ports[0].postMessage({
    type: 'OFFLINE_QUEUE',
    data: queueItems
  });
}

console.log('[Enhanced SW] Enhanced Service Worker for SizeWise Suite loaded successfully');
