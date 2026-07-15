import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AuthPage({ onLoginSuccess, initialTab = "login", onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState(initialTab) 
  const [chooseAdmin, setChooseAdmin] = useState(false) // false = User, true = Admin

  const handleLogin = (e) => {
    e.preventDefault()
    onLoginSuccess(chooseAdmin)
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    alert("Pendaftaran Berhasil! Silakan login menggunakan akun Anda.")
    setActiveTab("login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] font-sans text-[#16425B] antialiased px-4 py-12">
      <Card className="w-full max-w-md border border-[#D9DCD6]/30 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden">
        
        {/* TAB NAVIGATION */}
        <div className="grid grid-cols-2 border-b border-[#D9DCD6]/40 text-center bg-slate-50/50">
          <button
            onClick={() => setActiveTab("login")}
            className={`py-3.5 text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === "login"
                ? "border-b-2 border-[#3A7CA5] text-[#16425B] bg-white"
                : "text-[#3A7CA5] hover:text-[#16425B] hover:bg-slate-50"
            }`}
          >
            Masuk (Login)
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`py-3.5 text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === "signup"
                ? "border-b-2 border-[#3A7CA5] text-[#16425B] bg-white"
                : "text-[#3A7CA5] hover:text-[#16425B] hover:bg-slate-50"
            }`}
          >
            Daftar (Sign Up)
          </button>
        </div>

        {/* 1. TAMPILAN LOGIN */}
        {activeTab === "login" && (
          <>
            <CardHeader className="space-y-2 text-center pt-8">
              <CardTitle className="text-2xl font-extrabold tracking-tight text-[#16425B]">
                Selamat Datang
              </CardTitle>
              <CardDescription className="text-xs text-[#3A7CA5] font-medium max-w-[280px] mx-auto leading-relaxed">
                Masukkan email dan password untuk mengakses visualisasi data dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-4">
              
              {/* BUTTON PILIHAN ROLE (USER / ADMIN) */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4F6F8] rounded-xl border border-[#D9DCD6]/40">
                <button
                  type="button"
                  onClick={() => setChooseAdmin(false)}
                  className={`py-2 text-xs font-bold tracking-wide rounded-lg transition-all border-none cursor-pointer ${
                    !chooseAdmin
                      ? "bg-[#3A7CA5] text-white shadow-sm"
                      : "text-[#3A7CA5] hover:text-[#16425B]"
                  }`}
                >
                  Sebagai User
                </button>
                <button
                  type="button"
                  onClick={() => setChooseAdmin(true)}
                  className={`py-2 text-xs font-bold tracking-wide rounded-lg transition-all border-none cursor-pointer ${
                    chooseAdmin
                      ? "bg-[#16425B] text-white shadow-sm"
                      : "text-[#3A7CA5] hover:text-[#16425B]"
                  }`}
                >
                  Sebagai Admin
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className={`w-full font-bold uppercase tracking-wider py-5 rounded-xl text-xs shadow-md transition-all mt-4 text-white border-none cursor-pointer ${
                    chooseAdmin 
                      ? "bg-[#16425B] hover:bg-[#16425B]/90 shadow-[#16425B]/10" 
                      : "bg-[#3A7CA5] hover:bg-[#2F6690] shadow-[#3A7CA5]/10"
                  }`}
                >
                  Masuk sebagai {chooseAdmin ? "Admin" : "User"}
                </Button>
              </form>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-widest text-[#3A7CA5]/60">
                <div className="absolute w-full border-t border-[#D9DCD6]/40"></div>
                <span className="relative bg-white px-3">atau</span>
              </div>

              {/* GOOGLE LOGIN BUTTON */}
              <Button 
                variant="outline" 
                type="button"
                className="w-full border-[#D9DCD6]/60 text-[#16425B] font-semibold text-xs rounded-xl py-5 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onLoginSuccess(false)}
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
            <CardHeader className="space-y-2 text-center pt-8">
              <CardTitle className="text-2xl font-extrabold tracking-tight text-[#16425B]">
                Buat Akun Baru
              </CardTitle>
              <CardDescription className="text-xs text-[#3A7CA5] font-medium max-w-[280px] mx-auto leading-relaxed">
                Pendaftaran khusus untuk Akun Monitor (User) sistem kebencanaan
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullname" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Nama Lengkap</Label>
                  <Input 
                    id="fullname" 
                    type="text" 
                    placeholder="Nama Lengkap Anda" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telegram" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Username Telegram</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#3A7CA5] font-bold text-sm pointer-events-none">
                      @
                    </span>
                    <Input 
                      id="telegram" 
                      type="text" 
                      className="pl-8 rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                      placeholder="username_kamu" 
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#3A7CA5] hover:bg-[#2F6690] text-white font-bold uppercase tracking-wider py-5 rounded-xl text-xs shadow-md shadow-[#3A7CA5]/10 mt-6 border-none cursor-pointer"
                >
                  Daftar Akun
                </Button>
              </form>
            </CardContent>
          </>
        )}
        
        {/* FOOTER BALIK KE DASHBOARD */}
        <div className="text-center pb-6 pt-4 bg-slate-50/30 border-t border-[#D9DCD6]/20">
          <button 
            onClick={onBackToDashboard} 
            className="text-xs font-bold tracking-wide text-[#3A7CA5] hover:text-[#16425B] underline underline-offset-4 transition-colors bg-transparent border-none cursor-pointer"
          >
            ← Kembali ke Dashboard Utama
          </button>
        </div>

      </Card>
    </div>
  )
}