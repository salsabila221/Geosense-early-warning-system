import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

// UPDATE: Menambahkan 'userName' ke dalam props yang diterima Header
export default function Header({ isLoggedIn, isAdmin, userName, onNavigate, onLogout }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
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

  const getGreeting = () => {
    const hour = time.getHours()
    if (hour >= 5 && hour < 11) return "Selamat Pagi"
    if (hour >= 11 && hour < 15) return "Selamat Siang"
    if (hour >= 15 && hour < 18) return "Selamat Sore"
    return "Selamat Malam"
  }

  // UPDATE LOGIK: Memotong nama depan. Jika userName belum siap/kosong (misal login manual), 
  // sistem akan otomatis menggunakan fallback kata "Admin" atau "User" berdasarkan role-nya.
  const firstName = userName ? userName.split(" ")[0] : (isAdmin ? "Admin" : "User")

  return (
    <div className="fixed inset-x-0 top-0 z-[9999]">
      <div className="bg-[#16425B] text-[#D9DCD6] border-b border-[#2F6690]/20">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs font-medium tracking-wide">
          <span className="uppercase text-[#D9DCD6]/80">{date}</span>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white tracking-wider">{clock} WIB</span>
          </div>
        </div>
      </div>

      <header className="bg-white/95 backdrop-blur-md shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          
          <div 
            className="flex items-center gap-4 cursor-pointer select-none"
            onClick={() => onNavigate("dashboard")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2F6690] to-[#16425B] text-lg font-bold text-white shadow-md shadow-[#2F6690]/20">
              G
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#16425B]">Geosense</h1>
              <p className="text-xs font-medium uppercase tracking-wider text-[#3A7CA5]">Early Warning System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-[#16425B]">
                  {getGreeting()}, <span className="font-bold text-[#2F6690]">{firstName}</span>
                </span>
                <Button 
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-4 rounded-xl transition-colors shadow-sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-sm font-semibold text-[#3A7CA5] hover:bg-[#81C3D7]/10 hover:text-[#16425B] transition-all"
                  onClick={() => onNavigate("signup")}
                >
                  Sign Up
                </Button>
                <Button 
                  className="bg-[#2F6690] hover:bg-[#16425B] text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm shadow-[#2F6690]/10 transition-all"
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