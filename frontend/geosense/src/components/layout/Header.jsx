import { useEffect, useState } from "react"
import { LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
    <Badge
      className={`h-6 gap-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider ${
        isAdmin
          ? "bg-brand-dark text-white"
          : "bg-secondary text-secondary-foreground"
      }`}
    >
      {isAdmin ? (
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {isAdmin ? "Admin" : "User"}
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 border-border/80 bg-muted/60 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
    >
      <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
      Mode Tamu
    </Badge>
  )

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] pt-[env(safe-area-inset-top)]">
      {/* Top bar ramping: hanya tanggal + jam */}
      <div className="border-b border-white/10 bg-brand-dark text-white/65">
        <div className="mx-auto flex h-6 max-w-7xl items-center justify-between gap-3 px-4 text-[10px] font-medium sm:px-6 sm:text-[11px]">
          <span className="hidden truncate sm:inline">{date}</span>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold tracking-wide text-white">{clock} WIB</span>
          </div>
        </div>
      </div>

      <header className="relative border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-2 sm:px-6">
          {/* Logo */}
          <button
            type="button"
            onClick={goDashboard}
            className="group col-start-1 flex min-h-11 min-w-0 items-center justify-self-start gap-3 rounded-xl text-left outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:gap-3.5"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-border/70 sm:h-12 sm:w-12">
              <img
                src="/brand/geosense-mark.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
                Geosense
              </h1>
              <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
                Pemantauan Pergerakan Tanah
              </p>
            </div>
          </button>

          {/* Navigasi tengah */}
          <nav
            aria-label="Navigasi utama"
            className="col-start-2 hidden items-center justify-center gap-1 min-[1025px]:flex"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => handleNavLink(event, item.href)}
                className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Auth kanan */}
          <div className="col-start-3 hidden items-center justify-end gap-2 justify-self-end min-[1025px]:flex">
            {isLoggedIn ? (
              <>
                {roleBadge}
                <span className="hidden text-xs font-medium text-muted-foreground xl:inline">
                  {getGreeting()}, <span className="font-semibold text-foreground">{firstName}</span>
                </span>
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  className="h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onNavigate("signup")}
                >
                  Sign Up
                </Button>
                <Button
                  className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
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
            className="col-start-3 flex h-10 w-10 flex-shrink-0 items-center justify-center justify-self-end rounded-lg border border-border/70 bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-[1025px]:hidden"
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
          } absolute inset-x-0 top-full max-h-[calc(100vh-7rem)] overflow-y-auto border-t border-border/60 bg-card shadow-lg min-[1025px]:hidden`}
        >
          <nav aria-label="Navigasi seluler" className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:px-6">
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Navigasi
            </p>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => handleNavLink(event, item.href)}
                className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mx-auto max-w-7xl border-t border-border/60 px-4 py-4 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {roleBadge}
              {isLoggedIn && (
                <span className="text-xs font-medium text-muted-foreground">
                  {getGreeting()}, <span className="font-semibold text-foreground">{firstName}</span>
                </span>
              )}
            </div>

            {isLoggedIn ? (
              <Button
                variant="outline"
                onClick={() => {
                  closeMenu()
                  onLogout()
                }}
                className="h-11 w-full rounded-lg border-border text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            ) : (
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-lg border-border text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    closeMenu()
                    onNavigate("signup")
                  }}
                >
                  Sign Up
                </Button>
                <Button
                  className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
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
