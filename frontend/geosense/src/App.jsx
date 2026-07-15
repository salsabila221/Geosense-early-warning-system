import { useState } from "react"
import Header from "@/components/layout/Header"
import HeroSection from "@/components/dashboard/HeroSection"
import LiveMap from "@/components/dashboard/LiveMap"
import VibrationChart from "@/components/dashboard/VibrationChart"
import Footer from "@/components/layout/Footer"
import AuthPage from "@/components/auth/AuthPage"
import { Button } from "@/components/ui/button"

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState("dashboard")
  
  const [systemStatus, setSystemStatus] = useState("Aman")
  const [lastUpdated, setLastUpdated] = useState("14 Juli 2026 • 12:40 WIB")
  
  // State manajemen pop-up konfirmasi (Custom Modal)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState("")

  const [users, setUsers] = useState([
    { id: 1, name: "Salsabila Wiryawan", email: "salsa@email.com", telegram: "@salsawrywn" },
    { id: 2, name: "Rian Aditya", email: "rian@email.com", telegram: "@rian_adit" },
  ])

  const handleStatusClick = (targetStatus) => {
    if (targetStatus === "Aman") {
      executeStatusUpdate("Aman")
    } else {
      setPendingStatus(targetStatus)
      setIsConfirmOpen(true)
    }
  }

  const executeStatusUpdate = (status) => {
    // 1. Paksa tutup pop-up di baris pertama agar langsung hilang dari layar
    setIsConfirmOpen(false)
    
    // 2. Baru perbarui status sistem
    setSystemStatus(status)
    
    // 3. Catat waktu pembaruan teranyar
    const now = new Date()
    const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    const dateString = now.toLocaleDateString("id-ID", { day: "numeric", month: "Short", year: "numeric" })
    setLastUpdated(`${dateString} • ${timeString} WIB`)
  }

  const handleLoginSuccess = (roleIsAdmin) => {
    setIsAdmin(roleIsAdmin)
    setIsLoggedIn(true)
    setCurrentPage("dashboard")
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setIsLoggedIn(false)
    setCurrentPage("dashboard")
    setSystemStatus("Aman")
    setLastUpdated("14 Juli 2026 • 12:40 WIB")
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
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-[#16425B] antialiased selection:bg-[#81C3D7]/30">
      
      <Header 
        isLoggedIn={isLoggedIn} 
        isAdmin={isAdmin} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-36 pb-12">
        
        <HeroSection status={systemStatus} lastUpdated={lastUpdated} />

        {/* ================= ADMIN CONTROL OVERRIDE ================= */}
        {isLoggedIn && isAdmin && (
          <section className="mb-6 p-5 rounded-2xl bg-white border border-[#D9DCD6]/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#16425B]">
                Admin Control: Emergency Override
              </h4>
              <p className="text-xs text-[#3A7CA5] mt-1">
                Paksa perubahan status kebencanaan sistem. Pilihan status akan memicu aksi telemetri yang berbeda.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleStatusClick("Aman")}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm ${
                  systemStatus === "Aman"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                ✅ Set Aman
              </Button>
              
              <Button
                onClick={() => handleStatusClick("Siaga")}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm ${
                  systemStatus === "Siaga"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                ⚠️ Set Siaga
              </Button>
              
              <Button
                onClick={() => handleStatusClick("Warning")}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm ${
                  systemStatus === "Warning"
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20 animate-pulse"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                🚨 Set Warning
              </Button>
            </div>
          </section>
        )}

        {/* GRID DASHBOARD MAP & CHART */}
        <section className="grid gap-6 lg:grid-cols-12 items-stretch">
          <div className={isLoggedIn && isAdmin ? "lg:col-span-7 flex flex-col" : "lg:col-span-12 flex flex-col"}>
            <LiveMap isAdmin={isLoggedIn && isAdmin} />
          </div>

          {isLoggedIn && isAdmin && (
            <div className="lg:col-span-5 flex flex-col">
              <VibrationChart />
            </div>
          )}
        </section>

        {/* USER MANAGEMENT */}
        {isLoggedIn && isAdmin && (
          <section className="mt-8 rounded-2xl bg-white border border-[#D9DCD6]/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="p-6 border-b border-[#D9DCD6]/40 bg-slate-50/50">
              <h3 className="text-base font-bold text-[#16425B]">User Management</h3>
              <p className="text-xs text-[#3A7CA5] font-medium mt-0.5">
                Daftar akun monitor (User) yang terintegrasi dengan notifikasi bot Telegram
              </p>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#D9DCD6]/60 text-[#3A7CA5] text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Nama</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3 pr-2">ID Telegram</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DCD6]/30 text-[#16425B]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pl-2 font-semibold">{user.name}</td>
                      <td className="py-3.5">{user.email}</td>
                      <td className="py-3.5 pr-2 font-mono text-xs text-[#2F6690]">{user.telegram}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>

      {/* ================= CUSTOM MODAL POP-UP KONFIRMASI (MURNI TAILWIND) ================= */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop gelap blur latar belakang */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsConfirmOpen(false)}
          />
          
          {/* Konten Box Dialog */}
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#D9DCD6]/40 transform transition-all animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-[#16425B] flex items-center gap-2">
                {pendingStatus === "Warning" ? "🚨 Konfirmasi Status Warning" : "⚠️ Konfirmasi Status Siaga"}
              </h3>
              <p className="text-xs text-[#3A7CA5] font-medium mt-3 leading-relaxed">
                Apakah Anda yakin ingin mengubah status sistem menjadi{" "}
                <span className={`font-bold uppercase ${pendingStatus === "Warning" ? "text-red-600" : "text-amber-500"}`}>
                  {pendingStatus}
                </span>
                ? Aksi ini akan mengubah tampilan utama dashboard publik dan memicu pengiriman broadcast notifikasi darurat secara instan ke seluruh ID Telegram user yang terdaftar.
              </p>
            </div>
            
            <div className="mt-6 flex flex-row items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-2 transition-colors cursor-pointer border-none"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => executeStatusUpdate(pendingStatus)}
                className={`text-xs font-bold text-white rounded-xl px-5 py-2 transition-all cursor-pointer border-none shadow-sm ${
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