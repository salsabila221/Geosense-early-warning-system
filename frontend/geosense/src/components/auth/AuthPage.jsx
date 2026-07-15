import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AuthPage({ onLoginSuccess, initialTab = "login", onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState(initialTab) 
  const [chooseAdmin, setChooseAdmin] = useState(false) // false = User, true = Admin (Lebih aman pake boolean!)

  const handleLogin = (e) => {
    e.preventDefault()
    // Kirim langsung nilai boolean chooseAdmin ke App.jsx
    onLoginSuccess(chooseAdmin)
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    alert("Pendaftaran Berhasil! Silakan login menggunakan akun Anda.")
    setActiveTab("login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12">
      <Card className="w-full max-w-md border border-brand-border bg-white shadow-lg rounded-xl">
        
        {/* TAB NAVIGATION */}
        <div className="grid grid-cols-2 border-b border-brand-border text-center">
          <button
            onClick={() => setActiveTab("login")}
            className={`py-3 text-sm font-semibold transition-colors ${
              activeTab === "login"
                ? "border-b-2 border-brand-primary text-brand-dark"
                : "text-brand-secondary hover:text-brand-dark"
            }`}
          >
            Masuk (Login)
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`py-3 text-sm font-semibold transition-colors ${
              activeTab === "signup"
                ? "border-b-2 border-brand-primary text-brand-dark"
                : "text-brand-secondary hover:text-brand-dark"
            }`}
          >
            Daftar (Sign Up)
          </button>
        </div>

        {/* 1. TAMPILAN LOGIN */}
        {activeTab === "login" && (
          <>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-brand-dark">Selamat Datang</CardTitle>
              <CardDescription className="text-brand-secondary">
                Masukkan email dan password untuk mengakses dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* BUTTON PILIHAN ROLE (USER / ADMIN) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-brand-bg/40 rounded-lg border border-brand-border/60">
                <button
                  type="button"
                  onClick={() => setChooseAdmin(false)} // Klik ini = User (false)
                  className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                    !chooseAdmin
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-brand-secondary hover:text-brand-dark"
                  }`}
                >
                  Sebagai User
                </button>
                <button
                  type="button"
                  onClick={() => setChooseAdmin(true)} // Klik ini = Admin (true)
                  className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                    chooseAdmin
                      ? "bg-brand-dark text-white shadow-sm"
                      : "text-brand-secondary hover:text-brand-dark"
                  }`}
                >
                  Sebagai Admin
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="nama@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-secondary text-white mt-2">
                  Masuk sebagai {chooseAdmin ? "Admin" : "User"}
                </Button>
              </form>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center py-2 text-xs uppercase text-brand-secondary">
                <div className="absolute w-full border-t border-brand-border"></div>
                <span className="relative bg-white px-2">atau</span>
              </div>

              {/* GOOGLE LOGIN BUTTON */}
              <Button 
                variant="outline" 
                type="button"
                className="w-full border-brand-border text-brand-dark hover:bg-brand-bg/30"
                onClick={() => onLoginSuccess(false)} // Google otomatis masuk sebagai User
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Masuk dengan Google
              </Button>
            </CardContent>
          </>
        )}

        {/* 2. TAMPILAN SIGN UP (KHUSUS USER) */}
        {activeTab === "signup" && (
          <>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-brand-dark">Buat Akun Baru</CardTitle>
              <CardDescription className="text-brand-secondary">
                Pendaftaran khusus untuk Akun Monitor (User)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Nama Lengkap</Label>
                  <Input id="fullname" type="text" placeholder="Salsabila Wiryawan" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="nama@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram">Username Telegram</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-secondary text-sm">@</span>
                    <Input id="telegram" type="text" className="pl-7" placeholder="username_kamu" required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-secondary text-white mt-2">
                  Daftar Akun
                </Button>
              </form>
            </CardContent>
          </>
        )}
        
        {/* FOOTER BALIK KE DASHBOARD */}
        <div className="text-center pb-6 pt-4">
          <button 
            onClick={onBackToDashboard} 
            className="text-xs text-brand-secondary hover:text-brand-primary underline transition-colors"
          >
            ← Kembali ke Dashboard Utama
          </button>
        </div>

      </Card>
    </div>
  )
}