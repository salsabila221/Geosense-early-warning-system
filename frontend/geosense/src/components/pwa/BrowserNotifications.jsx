import { useEffect, useState } from "react"
import {
  BellOff,
  BellRing,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Send,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import {
  disablePushNotifications,
  enablePushNotifications,
  getActiveSubscription,
  getNotificationPermission,
  isIosDevice,
  isPushSupported,
  isStandalone,
  showTestNotification,
} from "@/lib/push"

export default function BrowserNotifications({ isAdmin = false }) {
  const [supported] = useState(() => isPushSupported())
  const [permission, setPermission] = useState(() => getNotificationPermission())
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const iosNeedsInstall = isIosDevice() && !isStandalone()

  useEffect(() => {
    if (!supported) return
    let cancelled = false

    const check = async () => {
      if (getNotificationPermission() !== "granted") return
      const subscription = await getActiveSubscription()
      if (cancelled || !subscription) return

      setSubscribed(true)

      // Sinkronkan ulang ke backend kalau tabel langganan sempat kosong.
      const payload = subscription.toJSON()
      apiFetch("/api/push/subscribe", {
        method: "POST",
        body: {
          endpoint: payload.endpoint,
          keys: payload.keys,
          user_agent: navigator.userAgent,
        },
      }).catch(() => null)
    }

    check()
    return () => {
      cancelled = true
    }
  }, [supported])

  const handleEnable = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await enablePushNotifications()
      setSubscribed(true)
      setPermission(getNotificationPermission())
      setMessage({ type: "ok", text: "Notifikasi browser aktif di perangkat ini." })
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Gagal mengaktifkan notifikasi." })
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await disablePushNotifications()
      setSubscribed(false)
      setMessage({ type: "ok", text: "Notifikasi browser dimatikan untuk perangkat ini." })
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Gagal mematikan notifikasi." })
    } finally {
      setBusy(false)
    }
  }

  const handleTest = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await showTestNotification()
      setMessage({ type: "ok", text: "Notifikasi tes ditampilkan. Cek pojok perangkat kamu." })
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Gagal mengirim notifikasi tes." })
    } finally {
      setBusy(false)
    }
  }

  const handleServerTest = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const { ok, data } = await apiFetch("/api/admin/push/test", { method: "POST" })
      if (!ok) {
        throw new Error(data?.detail || "Gagal mengirim push dari server.")
      }

      const total = Number(data?.total ?? 0)
      const sent = Number(data?.sent ?? 0)
      const failed = Number(data?.failed ?? 0)
      const removed = Number(data?.removed ?? 0)

      if (total === 0) {
        setMessage({
          type: "error",
          text: "Belum ada perangkat yang berlangganan push. Aktifkan notifikasi di perangkat ini dulu.",
        })
      } else if (failed > 0) {
        setMessage({
          type: "error",
          text: `Push server: terkirim ${sent}, gagal ${failed}, dihapus ${removed}. Cek log backend untuk kode error.`,
        })
      } else {
        setMessage({
          type: "ok",
          text: `Push server terkirim ke ${sent} perangkat.`,
        })
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Gagal mengirim push dari server." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      id="notifikasi"
      className="mt-6 scroll-mt-32 overflow-hidden rounded-2xl border border-[#D9DCD6]/30 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              subscribed ? "bg-emerald-600 text-white" : "bg-[#81C3D7]/20 text-[#2F6690]"
            }`}
          >
            {subscribed ? (
              <BellRing className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-sm font-bold text-[#16425B]">Notifikasi Browser</p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#16425B]/80">
              Terima peringatan Siaga / Warning langsung di perangkat, tanpa harus membuka WhatsApp.
              Notifikasi tetap muncul saat aplikasi sedang ditutup selama browser mengizinkan.
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            subscribed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {subscribed ? "Aktif" : "Belum aktif"}
        </span>
      </div>

      <div className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
        {!supported && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-[11px] leading-relaxed text-amber-800">
              Browser ini belum mendukung Web Push. Gunakan Chrome, Edge, atau Safari terbaru.
            </p>
          </div>
        )}

        {iosNeedsInstall && supported && (
          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3.5">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" aria-hidden="true" />
            <p className="text-[11px] leading-relaxed text-sky-800">
              Di iPhone/iPad, notifikasi hanya bisa aktif setelah GeoSense dipasang ke Layar Utama
              lewat menu Bagikan di Safari.
            </p>
          </div>
        )}

        {permission === "denied" && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-[11px] leading-relaxed text-red-800">
              Izin notifikasi diblokir. Buka pengaturan situs di browser, izinkan notifikasi untuk
              GeoSense, lalu muat ulang halaman.
            </p>
          </div>
        )}

        {message && (
          <div
            className={`flex items-start gap-2 rounded-xl p-3.5 text-[11px] leading-relaxed ${
              message.type === "ok"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.type === "ok" ? (
              <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          {!subscribed ? (
            <Button
              onClick={handleEnable}
              disabled={busy || !supported || iosNeedsInstall || permission === "denied"}
              className="h-11 w-full rounded-xl bg-[#3A7CA5] px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2F6690] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <BellRing className="h-4 w-4" aria-hidden="true" />
              )}
              {busy ? "Memproses..." : "Aktifkan notifikasi"}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleTest}
                disabled={busy}
                className="h-11 w-full rounded-xl bg-[#3A7CA5] px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2F6690] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {busy ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Tes notifikasi
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={handleServerTest}
                  disabled={busy}
                  className="h-11 w-full rounded-xl border-[#81C3D7]/60 px-4 text-xs font-bold uppercase tracking-wider text-[#2F6690] disabled:opacity-50 md:w-auto"
                >
                  {busy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  Tes push server
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDisable}
                disabled={busy}
                className="h-11 w-full rounded-xl border-[#D9DCD6]/70 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 disabled:opacity-50 md:w-auto"
              >
                <BellOff className="h-4 w-4" aria-hidden="true" />
                Matikan
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
