// Deen App — Service Worker (Workbox-lite manual implementation)
const CACHE_NAME = 'deen-v1'
const API_CACHE  = 'deen-api-v1'

const PRECACHE_ASSETS = ['/', '/index.html']

// Install: pre-cache shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== API_CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch strategy
self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET') return
  if (url.protocol === 'chrome-extension:') return

  // API: stale-while-revalidate for prayer times + Quran text
  if (url.pathname.startsWith('/api/v1/prayer/times') || url.pathname.startsWith('/api/v1/quran/surahs')) {
    e.respondWith(staleWhileRevalidate(request, API_CACHE))
    return
  }

  // Navigation: serve shell, fallback to index.html for SPA routing
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(cached => cached || fetch(request))
    )
    return
  }

  // Static assets: cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(request, CACHE_NAME))
  }
})

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline — Deen app is unavailable without a connection.', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)
  return cached || fetchPromise
}

// Push Notifications
self.addEventListener('push', (e) => {
  let data = { title: 'Deen', body: 'New notification' }
  try {
    if (e.data) data = e.data.json()
  } catch (err) {}
  
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge.png'
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
