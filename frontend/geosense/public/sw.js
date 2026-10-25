/* GeoSense service worker: app shell caching + Web Push notifications. */

const CACHE_NAME = "geosense-shell-v3"
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/geosense-icon-192.png",
  "/icons/geosense-icon-512.png",
  "/icons/geosense-icon-maskable-512.png",
  "/icons/badge-96.png",
]

async function precacheBuildAssets() {
  // Di production, index.html berisi nama file ber-hash (/assets/index-xxxx.js).
  // SW tidak tahu nama itu saat ditulis, jadi baca dari HTML lalu cache.
  try {
    const response = await fetch("/index.html", { cache: "no-store" })
    if (!response.ok) return
    const html = await response.text()
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      "/index.html",
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    )

    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
    if (!assets.length) return

    await Promise.all(
      assets.map(async (url) => {
        try {
          const res = await fetch(url)
          if (res.ok) await cache.put(url, res)
        } catch {
          /* satu aset gagal tidak menggagalkan install */
        }
      })
    )

    // Buang aset build lama supaya cache tidak membengkak tiap deploy.
    const keep = new Set(assets)
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname
      if (path.startsWith("/assets/") && !keep.has(path)) {
        await cache.delete(request)
      }
    }
  } catch {
    /* offline saat install: app shell tetap dipakai */
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => precacheBuildAssets())
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Jangan pernah cache API, Socket.IO, atau modul dev Vite.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/socket.io") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/")
  ) {
    return
  }

  // Navigasi: network-first, fallback ke app shell saat offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy))
          return response
        })
        .catch(() => caches.match("/index.html"))
    )
    return
  }

  // Aset statis: cache-first.
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            return response
          })
      )
    )
  }
})

/* ===================== Web Push ===================== */

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : "" }
  }

  const title = payload.title || "GeoSense"
  const options = {
    body: payload.body || "Ada pembaruan status dari GeoSense.",
    icon: payload.icon || "/icons/geosense-icon-192.png",
    badge: payload.badge || "/icons/badge-96.png",
    tag: payload.tag || "geosense-status",
    renotify: true,
    requireInteraction: Boolean(payload.requireInteraction),
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || "/",
      status: payload.status || null,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || "/"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin)) {
            client.navigate(targetUrl).catch(() => undefined)
            return client.focus()
          }
        }
        return self.clients.openWindow(targetUrl)
      })
  )
})

/* Dipakai tombol "Tes notifikasi" di aplikasi. */
self.addEventListener("message", (event) => {
  const data = event.data || {}
  if (data.type !== "SHOW_NOTIFICATION") return

  const payload = data.payload || {}
  event.waitUntil(
    self.registration.showNotification(payload.title || "GeoSense", {
      body: payload.body || "Notifikasi browser GeoSense berfungsi.",
      icon: "/icons/geosense-icon-192.png",
      badge: "/icons/badge-96.png",
      tag: payload.tag || "geosense-test",
      data: { url: payload.url || "/" },
    })
  )
})
