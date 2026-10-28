import { useState, useEffect, useMemo } from "react"
import { io } from "socket.io-client" // Import Socket.IO Client
import { History, MessageCircle, ShieldAlert, ShieldCheck, Siren, TriangleAlert, Users } from "lucide-react"
import Header from "@/components/layout/Header"
import HeroSection from "@/components/dashboard/HeroSection"
import LiveMap from "@/components/dashboard/LiveMap"
import VibrationChart from "@/components/dashboard/VibrationChart"
import DisasterGuidance from "@/components/dashboard/DisasterGuidance"
import EmergencyContacts from "@/components/dashboard/EmergencyContacts"
import NotificationCTA from "@/components/dashboard/NotificationCTA"
import InstallPrompt from "@/components/pwa/InstallPrompt"
import BrowserNotifications from "@/components/pwa/BrowserNotifications"
import Footer from "@/components/layout/Footer"
import AuthPage from "@/components/auth/AuthPage"
import { Button } from "@/components/ui/button"
import { API_URL, IS_NGROK, apiFetch, clearToken, getToken, setToken } from "@/lib/api"
import { toDisplayStatus } from "@/lib/status"
import { computeLandslideDirection, getNodeMapData } from "@/lib/telemetry"

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [currentPage, setCurrentPage] = useState("dashboard")
  
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  
  const [systemStatus, setSystemStatus] = useState("Aman")
  const [statusSource, setStatusSource] = useState("sensor")
  const [lastUpdated, setLastUpdated] = useState("Menghubungkan ke server...")
  
  // State data grafik & getaran real-time
  const [chartData, setChartData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  const [liveVibration, setLiveVibration] = useState(0.0)
  const [mlActivity, setMlActivity] = useState("-")
  const [nodeTelemetry, setNodeTelemetry] = useState(null)
  const [estimatedLocation, setEstimatedLocation] = useState(null)
  const [samplingRate, setSamplingRate] = useState(90)
  
  // Custom Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState("")

  const [users, setUsers] = useState([])
  const [statusHistory, setStatusHistory] = useState([])
  const [waConfig, setWaConfig] = useState(null)
  const [waLogs, setWaLogs] = useState([])
  const [waTestPhone, setWaTestPhone] = useState("")
  const [waTesting, setWaTesting] = useState(false)

  // Node + arah longsor diturunkan dari payload MQTT terakhir.
  const nodeMapData = useMemo(() => getNodeMapData(nodeTelemetry), [nodeTelemetry])
  const landslideDirection = useMemo(
    () => computeLandslideDirection(estimatedLocation, nodeMapData),
    [estimatedLocation, nodeMapData],
  )

  // ================= PIPELINE SOCKET.IO (LIVE DATA FROM BACKEND FASTAPI) =================
  useEffect(() => {
    // Hubungkan ke Backend FastAPI (Socket.IO di-mount di app yang sama, port 8000)
    // extraHeaders diperlukan agar polling Socket.IO melewati halaman peringatan
    // free-tier ngrok. WebSocket tetap memakai transport default.
    const socket = io(
      API_URL,
      IS_NGROK
        ? { extraHeaders: { "ngrok-skip-browser-warning": "true" } }
        : undefined,
    )

    socket.on("connect", () => {
      console.log("[GeoSense] Terhubung ke backend via Socket.IO")
      setLastUpdated("Terhubung ke Server")
    })

    socket.on("geosense_update", (dataFromServer) => {
      try {
        // 1. Update Status Kebencanaan (Aman / Siaga / Warning)
        if (dataFromServer.status) {
          setSystemStatus(toDisplayStatus(dataFromServer.status))
        }
        const source = dataFromServer.status_source === "admin" ? "admin" : "sensor"
        setStatusSource(source)

        // 2. Format Timestamp Update
        const dateObj = dataFromServer.timestamp 
          ? new Date(dataFromServer.timestamp * 1000) 
          : new Date()
        const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        const sourceLabel = source === "admin" ? "Manual (Admin Override)" : "Live (Sensor Node)"
        setLastUpdated(`${sourceLabel} | ${timeStr} WIB`)

        // 3. Update Nilai Getaran (Amplitudo Peak-to-Peak) & Streaming Chart Data
        // Pesan gpsdata hanya memperbarui peta; jangan menambah titik duplikat ke grafik.
        if (
          dataFromServer.p2p_amplitude !== undefined &&
          dataFromServer.update_type !== "gpsdata"
        ) {
          const ampVal = parseFloat(dataFromServer.p2p_amplitude)
          setLiveVibration(ampVal)

          // Masukkan data baru ke antrean grafik (Simpan 10 data terakhir)
          setChartData((prevData) => {
            const updated = [...prevData, ampVal]
            return updated.slice(-10)
          })
        }

        // 4. Update Aktivitas ML
        if (dataFromServer.aktivitas) {
          setMlActivity(dataFromServer.aktivitas.toUpperCase())
        }

        // 5. Data 3 node + hasil TDOA dari geosense-processing
        if (dataFromServer.nodes && typeof dataFromServer.nodes === "object") {
          setNodeTelemetry(dataFromServer.nodes)

          const incomingRate = Number(dataFromServer.sampling_rate)
          if (Number.isFinite(incomingRate) && incomingRate > 0) {
            setSamplingRate(incomingRate)
          }
        }

        const incomingLocation = dataFromServer.location
        const incomingDirection = dataFromServer.direction
        const hasLocationObject = incomingLocation && typeof incomingLocation === "object"
        const hasLocationValue =
          hasLocationObject &&
          [
            incomingLocation.x,
            incomingLocation.y,
            incomingLocation.latitude,
            incomingLocation.longitude,
            incomingLocation.bearing,
            incomingLocation.bearing_degrees,
            incomingLocation.direction,
          ].some((value) => value !== undefined && value !== null && value !== "")

        if (hasLocationValue) {
          const nextLocation = { ...incomingLocation }
          if (Number.isFinite(Number(nextLocation.x))) nextLocation.x = Number(nextLocation.x)
          if (Number.isFinite(Number(nextLocation.y))) nextLocation.y = Number(nextLocation.y)
          if (!nextLocation.direction && incomingDirection) {
            nextLocation.direction = incomingDirection
          }
          setEstimatedLocation(nextLocation)
        } else if (incomingDirection) {
          setEstimatedLocation({ direction: incomingDirection })
        } else {
          setEstimatedLocation(null)
        }

      } catch (error) {
        console.error("Gagal membaca payload data:", error)
      }
    })

    socket.on("disconnect", () => {
      console.warn("[GeoSense] Koneksi ke server terputus")
      setLastUpdated("Server Offline")
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // ================= STATUS AWAL DARI REST API (BERLAKU UNTUK SEMUA ROLE) =================
  useEffect(() => {
    let cancelled = false

    const loadInitialStatus = async () => {
      try {
        const { ok, data } = await apiFetch("/api/system/status", { auth: false })
        if (cancelled || !ok) return

        if (data?.status) setSystemStatus(toDisplayStatus(data.status))
        const source = data?.status_source === "admin" ? "admin" : "sensor"
        setStatusSource(source)

        if (data?.last_updated) {
          const when = new Date(data.last_updated)
          if (!Number.isNaN(when.getTime())) {
            const timeStr = when.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
            const sourceLabel = source === "admin" ? "Manual (Admin Override)" : "Live (Sensor Node)"
            setLastUpdated(`${sourceLabel} | ${timeStr} WIB`)
          }
        }
      } catch (err) {
        console.error("Gagal mengambil status sistem:", err)
      }
    }

    loadInitialStatus()
    return () => {
      cancelled = true
    }
  }, [])

  // ================= RESTORE SESI LOGIN DARI TOKEN JWT =================
  useEffect(() => {
    let cancelled = false

    const restoreSession = async () => {
      if (!getToken()) {
        if (!cancelled) setIsRestoringSession(false)
        return
      }

      try {
        const { ok, data } = await apiFetch("/api/auth/me")
        if (cancelled) return

        if (ok && data?.user) {
          setIsAdmin(data.user.is_admin)
          setUserName(data.user.fullname || data.user.email)
          setUserPhone(data.user.phone_number || "")
          setIsLoggedIn(true)
        } else {
          clearToken()
        }
      } catch (err) {
        console.error("Gagal memulihkan sesi login:", err)
      } finally {
        if (!cancelled) setIsRestoringSession(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  // ================= AMBIL DAFTAR USER DARI DATABASE (KHUSUS ADMIN) =================
  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      setUsers([])
      return
    }

    let cancelled = false
    const loadUsers = async () => {
      try {
        const { ok, data } = await apiFetch("/api/admin/users")
        if (!cancelled && ok && Array.isArray(data?.users)) setUsers(data.users)
      } catch (err) {
        console.error("Gagal mengambil daftar user:", err)
      }
    }

    loadUsers()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, isAdmin])

  // ================= RIWAYAT PERUBAHAN STATUS (KHUSUS ADMIN) =================
  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      setStatusHistory([])
      return
    }

    let cancelled = false
    const loadHistory = async () => {
      try {
        const { ok, data } = await apiFetch("/api/system/history?limit=20")
        if (!cancelled && ok && Array.isArray(data?.items)) setStatusHistory(data.items)
      } catch (err) {
        console.error("Gagal mengambil riwayat status:", err)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, isAdmin, systemStatus])

  // ================= KONFIG & LOG NOTIFIKASI WHATSAPP (FONNTE) =================
  const loadWhatsapp = async () => {
    try {
      const [configRes, logsRes] = await Promise.all([
        apiFetch("/api/admin/wa/config"),
        apiFetch("/api/admin/wa/logs?limit=10"),
      ])
      if (configRes.ok) setWaConfig(configRes.data)
      if (logsRes.ok && Array.isArray(logsRes.data?.items)) setWaLogs(logsRes.data.items)
    } catch (err) {
      console.error("Gagal mengambil data WhatsApp:", err)
    }
  }

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      setWaConfig(null)
      setWaLogs([])
      return
    }
    loadWhatsapp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin])

  const handleWaTest = async () => {
    const phone = waTestPhone.trim()
    if (!phone) {
      alert("Isi nomor WhatsApp tujuan dulu. Contoh: 08123456789")
      return
    }

    setWaTesting(true)
    try {
      const { ok, data } = await apiFetch(`/api/admin/wa/test?phone=${encodeURIComponent(phone)}`, {
        method: "POST",
      })
      if (ok) {
        alert("Pesan tes telah dikirim. Periksa WhatsApp Anda (mungkin membutuhkan beberapa detik).")
        setWaTestPhone("")
        loadWhatsapp()
      } else {
        alert(data?.detail || "Gagal mengirim pesan tes.")
      }
    } catch (err) {
      console.error("Gagal mengirim pesan tes WA:", err)
      alert("Terjadi kesalahan jaringan saat mengirim pesan tes.")
    } finally {
      setWaTesting(false)
    }
  }

  const handleStatusClick = (targetStatus) => {
    if (targetStatus === "Aman") {
      executeStatusUpdate("Aman")
    } else {
      setPendingStatus(targetStatus)
      setIsConfirmOpen(true)
    }
  }

  // ================= SINKRONISASI API OVERRIDE KE BACKEND =================
  const executeStatusUpdate = async (status) => {
    setIsConfirmOpen(false)
    
    const now = new Date()
    const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    
    // Optimistic UI update
    setSystemStatus(status)
    setStatusSource("admin")
    setLastUpdated(`Manual (Admin Override) | ${timeString} WIB`)
    
    try {
      const { ok, data } = await apiFetch(`/api/admin/override?status=${encodeURIComponent(status)}`, {
        method: "POST",
      })
      if (!ok) console.error("Override ditolak backend:", data?.detail || data)
    } catch (err) {
      console.error("Gagal mengirim perintah override ke backend:", err)
    }
  }

  const handleLoginSuccess = (roleIsAdmin, name, accessToken, phone) => {
    if (accessToken) setToken(accessToken)
    setIsAdmin(!!roleIsAdmin)
    setUserName(name || "User")
    setUserPhone(phone || "")
    setIsLoggedIn(true)
    setCurrentPage("dashboard")
  }

  const handleLogout = () => {
    clearToken()
    setIsAdmin(false)
    setIsLoggedIn(false)
    setUserName("")
    setUserPhone("")
    setCurrentPage("dashboard")
  }

  const waDevice = waConfig?.device
  const waDeviceStatus = waConfig?.device_status ?? waDevice?.device_status
  const waDeviceDisconnected = Boolean(waDeviceStatus && waDeviceStatus !== "connect")

  if (isRestoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-primary">
        Memeriksa sesi login...
      </div>
    )
  }

  if (currentPage === "login" || currentPage === "signup") {
    return (
      <AuthPage 
        initialTab={currentPage} 
        onLoginSuccess={handleLoginSuccess}
        onBackToDashboard={() => setCurrentPage("dashboard")}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-brand-light/30">
      
      <Header 
        isLoggedIn={isLoggedIn} 
        isAdmin={isAdmin} 
        userName={userName}
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
      />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-[calc(7rem+env(safe-area-inset-top))] sm:px-6">
        
        <HeroSection
          status={systemStatus}
          lastUpdated={lastUpdated}
          roleLabel={isAdmin ? "Dashboard Admin" : isLoggedIn ? "Dashboard User" : "Dashboard Tamu"}
        />

        <InstallPrompt />

        {/* ================= ADMIN CONTROL OVERRIDE ================= */}
        {isLoggedIn && isAdmin && (
          <section
            id="kontrol"
            className="mb-6 flex scroll-mt-32 flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#16425B] flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#3A7CA5]" aria-hidden="true" />
                Admin Control: Emergency Override
              </h4>
              <p className="text-xs text-[#3A7CA5] mt-1">
                Paksa perubahan status kebencanaan sistem. Hasil override akan disebarkan langsung ke seluruh user.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:flex-wrap">
              <Button
                onClick={() => handleStatusClick("Aman")}
                className={`h-11 w-full rounded-xl px-4 text-xs font-bold uppercase tracking-wider shadow-sm transition-all md:w-auto ${
                  systemStatus === "Aman"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Set Aman
              </Button>
              
              <Button
                onClick={() => handleStatusClick("Siaga")}
                className={`h-11 w-full rounded-xl px-4 text-xs font-bold uppercase tracking-wider shadow-sm transition-all md:w-auto ${
                  systemStatus === "Siaga"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                Set Siaga
              </Button>
              
              <Button
                onClick={() => handleStatusClick("Warning")}
                className={`h-11 w-full rounded-xl px-4 text-xs font-bold uppercase tracking-wider shadow-sm transition-all md:w-auto ${
                  systemStatus === "Warning"
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20 animate-pulse"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Siren className="h-3.5 w-3.5" aria-hidden="true" />
                Set Warning
              </Button>
            </div>
          </section>
        )}

        {/* ================= NOTIFIKASI WHATSAPP (USER & GUEST) ================= */}
        {!isAdmin && (
          <NotificationCTA
            isLoggedIn={isLoggedIn}
            phoneNumber={userPhone}
            onNavigate={setCurrentPage}
          />
        )}

        {/* GRID DASHBOARD MAP & CHART */}
        <section id="peta" className="mt-6 grid min-w-0 scroll-mt-32 items-stretch gap-6 lg:grid-cols-12">
          <div className={isAdmin ? "lg:col-span-5 flex min-w-0 flex-col" : "lg:col-span-12 flex min-w-0 flex-col"}>
            <LiveMap
              isAdmin={isAdmin}
              nodes={nodeMapData}
              location={estimatedLocation}
              direction={landslideDirection}
            />
          </div>

          {isLoggedIn && isAdmin && (
            <div className="lg:col-span-7 flex min-w-0 flex-col">
              <VibrationChart 
                chartData={chartData} 
                vibration={liveVibration} 
                activity={mlActivity} 
                status={systemStatus}
                statusSource={statusSource}
                nodes={nodeTelemetry}
                location={estimatedLocation}
                direction={landslideDirection}
                samplingRate={samplingRate}
              />
            </div>
          )}
        </section>

        {/* ================= NOTIFIKASI BROWSER (SEMUA ROLE) ================= */}
        <BrowserNotifications isAdmin={isAdmin} />

        {/* ================= PANDUAN & NOMOR DARURAT (USER & GUEST) ================= */}
        {!isAdmin && (
          <>
            <DisasterGuidance status={systemStatus} />
            <EmergencyContacts />
          </>
        )}

        {/* USER MANAGEMENT */}
        {isLoggedIn && isAdmin && (
          <section
            id="pengguna"
            className="mt-8 scroll-mt-32 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          >
            <div className="border-b border-border/60 bg-muted/40 p-4 sm:p-6">
              <h3 className="text-base font-bold text-[#16425B] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#3A7CA5]" aria-hidden="true" />
                User Management
              </h3>
              <p className="text-xs text-[#3A7CA5] font-medium mt-0.5">
                Seluruh akun terdaftar beserta nomor WhatsApp yang menerima peringatan darurat
              </p>
            </div>
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[#3A7CA5] text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Nama</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Nomor WhatsApp</th>
                    <th className="pb-3 pr-2">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-[#16425B]">
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                        Belum ada user terdaftar.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => (
                    <tr key={user.email} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pl-2 font-semibold">{user.fullname || "-"}</td>
                      <td className="py-3.5">{user.email}</td>
                      <td className="py-3.5 font-mono text-xs text-[#2F6690]">{user.phone_number || "-"}</td>
                      <td className="py-3.5 pr-2 text-xs uppercase font-bold text-[#3A7CA5]">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* RIWAYAT PERUBAHAN STATUS */}
        {isLoggedIn && isAdmin && (
          <section
            id="riwayat"
            className="mt-8 scroll-mt-32 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          >
            <div className="border-b border-border/60 bg-muted/40 p-4 sm:p-6">
              <h3 className="text-base font-bold text-[#16425B] flex items-center gap-2">
                <History className="h-4 w-4 text-[#3A7CA5]" aria-hidden="true" />
                Riwayat Perubahan Status
              </h3>
              <p className="text-xs text-[#3A7CA5] font-medium mt-0.5">
                Setiap perubahan status dicatat sebagai baris baru, baik dari model ML maupun override admin.
              </p>
            </div>
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[#3A7CA5] text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Waktu (WIB)</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Sumber</th>
                    <th className="pb-3">Oleh</th>
                    <th className="pb-3 pr-2">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-[#16425B]">
                  {statusHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                        Belum ada riwayat perubahan status.
                      </td>
                    </tr>
                  )}
                  {statusHistory.map((item) => {
                    const rawStatus = (item.status || "").toUpperCase()
                    const statusClass =
                      rawStatus === "WASPADA" || rawStatus === "WARNING"
                        ? "text-red-600"
                        : rawStatus === "SIAGA"
                          ? "text-amber-600"
                          : "text-emerald-600"
                    const sourceLabel =
                      item.source === "admin" ? "Admin" : item.source === "ml" ? "ML" : "Sistem"
                    const sourceClass =
                      item.source === "admin"
                        ? "bg-amber-100 text-amber-700"
                        : item.source === "ml"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-slate-100 text-slate-600"
                    const waktu = item.created_at
                      ? new Date(item.created_at).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"

                    const detailParts = []
                    if (item.kondisi_tanah) detailParts.push(item.kondisi_tanah)
                    if (item.aktivitas) detailParts.push(item.aktivitas)
                    if (item.p2p_amplitude !== null && item.p2p_amplitude !== undefined) {
                      detailParts.push(`p2p ${item.p2p_amplitude}`)
                    }
                    if (item.rms !== null && item.rms !== undefined) detailParts.push(`rms ${item.rms}`)

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="py-3.5 pl-2 font-mono text-xs whitespace-nowrap">{waktu}</td>
                        <td className={`py-3.5 text-xs font-bold uppercase ${statusClass}`}>{item.status}</td>
                        <td className="py-3.5">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${sourceClass}`}>
                            {sourceLabel}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs">{item.changed_by || "-"}</td>
                        <td className="py-3.5 pr-2 text-xs text-slate-500">
                          {item.note || "-"}
                          {detailParts.length > 0 && (
                            <div className="text-[11px] text-slate-400">{detailParts.join(" | ")}</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* NOTIFIKASI WHATSAPP (FONNTE) */}
        {isLoggedIn && isAdmin && (
          <section
            id="whatsapp"
            className="mt-8 scroll-mt-32 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h3 className="text-base font-bold text-[#16425B] flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#3A7CA5]" aria-hidden="true" />
                  Notifikasi WhatsApp (Fonnte)
                </h3>
                <p className="text-xs text-[#3A7CA5] font-medium mt-0.5">
                  Pesan otomatis dikirim ke semua user terdaftar saat status berubah menjadi {waConfig?.notify_statuses?.join(" / ") || "SIAGA / WASPADA"}.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  "Diterima" berarti Fonnte sudah menerima pesan. Jika nomor penerima belum pernah chat ke nomor device,
                  WhatsApp dapat menahan pesan (time-lock). Mintalah penerima mengirim pesan apa saja ke nomor device satu kali.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold">
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    !waConfig?.token_configured || !waConfig?.enabled
                      ? "text-red-600"
                      : waDeviceDisconnected
                        ? "text-amber-600"
                        : "text-emerald-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      !waConfig?.token_configured || !waConfig?.enabled
                        ? "bg-red-500"
                        : waDeviceDisconnected
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    aria-hidden="true"
                  />
                  {!waConfig?.token_configured
                    ? "Nonaktif"
                    : waDeviceDisconnected
                      ? "Device Terputus"
                      : waConfig?.enabled
                        ? "Aktif"
                        : "Nonaktif"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                  {waConfig?.recipients ?? 0} penerima
                </span>
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {!waConfig?.token_configured && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
                  <span className="font-bold">FONNTE_TOKEN belum diset.</span> Isi token dari dashboard Fonnte
                  (menu <span className="font-semibold">Device → Token</span>, pastikan device sudah
                  <span className="font-semibold"> Connected</span>) ke file <code className="font-mono">.env</code> backend,
                  lalu restart backend.
                </div>
              )}

              {waConfig?.token_configured && waDeviceDisconnected && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
                  <span className="font-bold">Device Fonnte terputus.</span> Status:{" "}
                  <code className="font-mono">{waDeviceStatus}</code>. Token dan kuota masih terbaca, tetapi
                  WhatsApp tidak dapat mengirim sampai device tersambung kembali.
                  <div className="mt-1">
                    Buka dashboard Fonnte, lalu scan QR ulang dari ponsel nomor device sampai status
                    berubah menjadi <span className="font-semibold">Connected</span>.
                  </div>
                  {(waDevice?.device || waDevice?.quota) && (
                    <div className="mt-1 text-[11px] text-amber-700/80">
                      {waDevice?.device ? `Nomor device: ${waDevice.device}` : ""}
                      {waDevice?.quota ? ` · Kuota: ${waDevice.quota}` : ""}
                      {waDevice?.expired ? ` · Aktif sampai: ${waDevice.expired}` : ""}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <div className="w-full space-y-1.5 sm:max-w-xs">
                  <label htmlFor="wa-test" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">
                    Tes kirim ke nomor
                  </label>
                  <input
                    id="wa-test"
                    type="tel"
                    inputMode="tel"
                    value={waTestPhone}
                    onChange={(event) => setWaTestPhone(event.target.value)}
                    placeholder="08123456789"
                    className="w-full rounded-xl border border-border/60 px-3.5 py-2.5 text-sm text-[#16425B] outline-none focus:ring-2 focus:ring-[#3A7CA5]/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleWaTest}
                  disabled={waTesting}
                  className="h-11 w-full rounded-xl bg-[#3A7CA5] px-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#2F6690] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                >
                  {waTesting ? "Mengirim..." : "Kirim Tes"}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-[#3A7CA5] text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Waktu (WIB)</th>
                      <th className="pb-3">Nomor</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Sumber</th>
                      <th className="pb-3 pr-2">Hasil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-[#16425B]">
                    {waLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                          Belum ada pengiriman WhatsApp.
                        </td>
                      </tr>
                    )}
                    {waLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pl-2 font-mono text-xs whitespace-nowrap">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString("id-ID", {
                                timeZone: "Asia/Jakarta",
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-3.5 font-mono text-xs text-[#2F6690]">{log.phone}</td>
                        <td className="py-3.5 text-xs font-bold uppercase">{log.status}</td>
                        <td className="py-3.5 text-xs uppercase">{log.source}</td>
                        <td className="py-3.5 pr-2">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              log.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {log.success ? "Diterima" : "Gagal"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* CUSTOM MODAL POP-UP KONFIRMASI */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsConfirmOpen(false)}
          />
          
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#D9DCD6]/40 transform transition-all animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-[#16425B] flex items-center gap-2">
                {pendingStatus === "Warning" ? (
                  <>
                    <Siren className="h-5 w-5 text-red-600" aria-hidden="true" />
                    Konfirmasi Status Warning
                  </>
                ) : (
                  <>
                    <TriangleAlert className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    Konfirmasi Status Siaga
                  </>
                )}
              </h3>
              <p className="text-xs text-[#3A7CA5] font-medium mt-3 leading-relaxed">
                Apakah Anda yakin ingin mengubah status sistem menjadi{" "}
                <span className={`font-bold uppercase ${pendingStatus === "Warning" ? "text-red-600" : "text-amber-500"}`}>
                  {pendingStatus}
                </span>
                ? Aksi ini akan mengubah tampilan utama dashboard publik dan memicu pengiriman broadcast notifikasi darurat.
              </p>
            </div>
            
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button 
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="h-11 w-full rounded-xl border-none bg-slate-100 px-4 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-200 sm:w-auto"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => executeStatusUpdate(pendingStatus)}
                className={`h-11 w-full rounded-xl border-none px-5 text-xs font-bold text-white shadow-sm transition-all sm:w-auto ${
                  pendingStatus === "Warning" 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/10" 
                    : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10"
                }`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
