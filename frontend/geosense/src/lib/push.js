// Helper Web Push untuk PWA GeoSense.
// Alur: minta izin -> subscribe PushManager -> kirim subscription ke backend.

import { apiFetch } from "@/lib/api"

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

export function getNotificationPermission() {
  if (!isPushSupported()) return "unsupported"
  return Notification.permission
}

export function isIosDevice() {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent || ""
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  )
}

export function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  )
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

async function getRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Browser ini tidak mendukung service worker.")
  }

  // Jangan menggantung selamanya kalau service worker gagal aktif.
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Service worker belum aktif. Muat ulang halaman lalu coba lagi.")),
        8000
      )
    ),
  ])
}

export async function getActiveSubscription() {
  if (!isPushSupported()) return null
  try {
    const registration = await getRegistration()
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function enablePushNotifications() {
  if (!isPushSupported()) {
    throw new Error("Browser ini tidak mendukung notifikasi push.")
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission()

  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Izin notifikasi diblokir. Aktifkan lewat pengaturan situs di browser, lalu coba lagi."
        : "Izin notifikasi tidak diberikan."
    )
  }

  const { ok, data } = await apiFetch("/api/push/public-key", { auth: false })
  if (!ok || !data?.publicKey) {
    throw new Error(data?.detail || "Kunci Web Push belum tersedia di server.")
  }
  if (data.enabled === false) {
    throw new Error("Web Push belum diaktifkan di server.")
  }

  const registration = await getRegistration()
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    }))

  const payload = subscription.toJSON()
  const saved = await apiFetch("/api/push/subscribe", {
    method: "POST",
    body: {
      endpoint: payload.endpoint,
      keys: payload.keys,
      user_agent: navigator.userAgent,
    },
  })

  if (!saved.ok) {
    throw new Error(saved.data?.detail || "Gagal menyimpan langganan notifikasi.")
  }

  return subscription
}

export async function disablePushNotifications() {
  const registration = await getRegistration()
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return false

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await apiFetch("/api/push/unsubscribe", {
    method: "POST",
    body: { endpoint },
  }).catch(() => null)

  return true
}

export async function showTestNotification() {
  const registration = await getRegistration()

  await registration.showNotification("Tes Notifikasi GeoSense", {
    body: "Notifikasi browser berhasil diaktifkan. Peringatan status akan muncul di sini.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: "geosense-test",
    data: { url: "/" },
  })
}
