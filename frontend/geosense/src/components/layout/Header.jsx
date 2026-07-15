import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function Header({ isLoggedIn, isAdmin, onNavigate, onLogout }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const date = time.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const clock = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Fungsi pintar untuk menentukan ucapan selamat berdasarkan jam real-time
  const getGreeting = () => {
    const hour = time.getHours()
    if (hour >= 5 && hour < 11) return "Selamat Pagi"
    if (hour >= 11 && hour < 15) return "Selamat Siang"
    if (hour >= 15 && hour < 18) return "Selamat Sore"
    return "Selamat Malam"
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] shadow-sm">

      <div className="bg-brand-dark text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-sm">
          <span>{date}</span>
          <span className="font-semibold text-brand-accent">
            {clock} WIB
          </span>
        </div>
      </div>

      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          {/* Logo Brand & Judul Sistem (Bisa diklik untuk balik ke dashboard utama) */}
          <div 
            className="flex items-center gap-4 cursor-pointer select-none"
            onClick={() => onNavigate("dashboard")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
              G
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-dark">
                Geosense
              </h1>
              <p className="text-sm text-brand-secondary">
                Early Warning System
              </p>
            </div>
          </div>

          {/* AREA KONTROL AUTHENTICATION */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              // JIKA USER / ADMIN SUDAH LOGIN
              <>
                <span className="text-sm font-medium text-brand-dark">
                  {getGreeting()}, <span className="font-bold text-brand-primary">{isAdmin ? "Admin" : "User"}</span>
                </span>
                
                <Button 
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-4 transition-colors"
                >
                  Logout
                </Button>
              </>
            ) : (
              // JIKA BELUM LOGIN (GUEST MURNI)
              <>
                <Button
                  variant="ghost"
                  className="text-brand-dark hover:bg-brand-accent/20"
                  onClick={() => onNavigate("signup")}
                >
                  Sign Up
                </Button>

                <Button 
                  className="bg-brand-primary hover:bg-brand-secondary"
                  onClick={() => onNavigate("login")}
                >
                  Login
                </Button>
              </>
            )}
          </div>

        </div>
      </header>

    </div>
  )
}