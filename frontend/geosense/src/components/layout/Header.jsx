import { useEffect, useState } from "react"
import { LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = {
  admin: [
    { label: "Dashboard", href: "#dashboard" },
    { label: "Peta", href: "#peta" },
    { label: "Kontrol", href: "#kontrol" },
    { label: "Pengguna", href: "#pengguna" },
    { label: "Riwayat", href: "#riwayat" },
    { label: "WhatsApp", href: "#whatsapp" },
  ],
  guest: [
    { label: "Dashboard", href: "#dashboard" },
    { label: "Peta", href: "#peta" },
    { label: "Panduan", href: "#panduan" },
    { label: "Nomor Darurat", href: "#nomor-darurat" },
    { label: "Notifikasi", href: "#notifikasi" },
  ],
}

export default function Header({ isLoggedIn, isAdmin, userName, onNavigate, onLogout }) {
  const [time, setTime] = useState(new Date())
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false)
    }

    const desktopQuery = window.matchMedia("(min-width: 1025px)")
    const handleDesktop = (event) => {
      if (event.matches) setIsMenuOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    desktopQuery.addEventListener("change", handleDesktop)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      desktopQuery.removeEventListener("change", handleDesktop)
    }
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

  const firstName = userName ? userName.split(" ")[0] : isAdmin ? "Admin" : "User"
  const navItems = isAdmin ? NAV_ITEMS.admin : NAV_ITEMS.guest

  const closeMenu = () => setIsMenuOpen(false)

  const handleNavLink = (event, href) => {
    event.preventDefault()
    closeMenu()

    const target = document.querySelector(href)
    if (!target) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const headerHeight =
      document.querySelector("header")?.parentElement?.getBoundingClientRect().height || 128
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth",
    })
    window.history.replaceState(null, "", href)
  }

  const goDashboard = () => {
    closeMenu()
    onNavigate("dashboard")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const roleBadge = isLoggedIn ? (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        isAdmin ? "bg-[#16425B] text-white" : "bg-[#81C3D7]/25 text-[#2F6690]"
      }`}
    >
      {isAdmin ? (
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {isAdmin ? "Admin" : "User"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2F6690]">
      <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
      Mode Tamu
    </span>
  )

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] bg-[#16425B] pt-[env(safe-area-inset-top)]">
      <div className="border-b border-[#2F6690]/20 bg-[#16425B] text-[#D9DCD6]">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4 text-[10px] font-medium tracking-wide sm:px-6 sm:text-xs">
          <span className="truncate uppercase text-[#D9DCD6]/80">{date}</span>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wider text-white">{clock} WIB</span>
          </div>
        </div>
      </div>

      <header className="relative bg-white/95 shadow-[0_2px_15px_rgba(0,0,0,0.02)] backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={goDashboard}
            className="group flex min-h-11 min-w-0 items-center gap-3 rounded-xl text-left outline-none select-none focus-visible:ring-2 focus-visible:ring-[#3A7CA5]/50 sm:gap-4"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#81C3D7]/50 sm:h-14 sm:w-14">
              <img
                src="/brand/geosense-mark.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-[#16425B] sm:text-xl">
                Geosense
              </h1>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[#2F6690] sm:text-xs">
                Pemantauan Pergerakan Tanah
              </p>
            </div>
          </button>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-0.5 min-[1025px]:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => handleNavLink(event, item.href)}
                className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-sm font-semibold text-[#2F6690] transition-colors hover:bg-[#81C3D7]/15 hover:text-[#16425B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A7CA5]/50 xl:px-3"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden flex-shrink-0 items-center gap-2 min-[1025px]:flex">
            {isLoggedIn ? (
              <>
                {roleBadge}
                <span className="hidden text-sm font-medium text-[#16425B] xl:inline">
                  {getGreeting()}, <span className="font-bold text-[#2F6690]">{firstName}</span>
                </span>
                <Button
                  onClick={onLogout}
                  className="h-11 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                {roleBadge}
                <Button
                  variant="ghost"
                  className="h-11 rounded-xl px-3 text-sm font-semibold text-[#2F6690] transition-all hover:bg-[#81C3D7]/10 hover:text-[#16425B]"
                  onClick={() => onNavigate("signup")}
                >
                  Sign Up
                </Button>
                <Button
                  className="h-11 rounded-xl bg-[#2F6690] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2F6690]/10 transition-all hover:bg-[#16425B]"
                  onClick={() => onNavigate("login")}
                >
                  Login
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#D9DCD6]/60 bg-white text-[#16425B] transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A7CA5]/50 min-[1025px]:hidden"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div
          id="mobile-navigation"
          className={`${
            isMenuOpen ? "block" : "hidden"
          } absolute inset-x-0 top-full max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-[#D9DCD6]/50 bg-white shadow-[0_18px_35px_rgba(22,66,91,0.16)] min-[1025px]:hidden`}
        >
          <nav aria-label="Navigasi seluler" className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:px-6">
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#2F6690]/70">
              Navigasi
            </p>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => handleNavLink(event, item.href)}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-semibold text-[#2F6690] transition-colors hover:bg-[#81C3D7]/15 hover:text-[#16425B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A7CA5]/50"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mx-auto max-w-7xl border-t border-[#D9DCD6]/50 px-4 py-4 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {roleBadge}
              {isLoggedIn && (
                <span className="text-xs font-medium text-[#16425B]">
                  {getGreeting()}, <span className="font-bold text-[#2F6690]">{firstName}</span>
                </span>
              )}
            </div>

            {isLoggedIn ? (
              <Button
                onClick={() => {
                  closeMenu()
                  onLogout()
                }}
                className="h-11 w-full rounded-xl bg-red-600 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            ) : (
              <div className="grid gap-2">
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-xl border border-[#D9DCD6]/70 text-sm font-semibold text-[#2F6690] transition-all hover:bg-[#81C3D7]/10 hover:text-[#16425B]"
                  onClick={() => {
                    closeMenu()
                    onNavigate("signup")
                  }}
                >
                  Sign Up
                </Button>
                <Button
                  className="h-11 w-full rounded-xl bg-[#2F6690] text-sm font-semibold text-white shadow-sm shadow-[#2F6690]/10 transition-all hover:bg-[#16425B]"
                  onClick={() => {
                    closeMenu()
                    onNavigate("login")
                  }}
                >
                  Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  )
}
