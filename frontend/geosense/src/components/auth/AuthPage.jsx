import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// 1. IMPORT LIBRARY GOOGLE AUTH RESMI
import { GoogleLogin } from "@react-oauth/google"

export default function AuthPage({ onLoginSuccess, initialTab = "login", onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState(initialTab) 
  const [chooseAdmin, setChooseAdmin] = useState(false) // false = User, true = Admin

  // State Manajemen Google Login Flow
  const [isOnboarding, setIsOnboarding] = useState(false) 
  const [googleUser, setGoogleUser] = useState({ name: "", email: "" }) 
  const [telegramOnboarding, setTelegramOnboarding] = useState("")
  const [fullnameOnboarding, setFullnameOnboarding] = useState("")

  
  // 1. LOGIN MANUAL (EMAIL + PASSWORD)
  const handleLogin = (e) => {
    e.preventDefault()
    // Mengirimkan status role dan nama dummy default untuk login manual
    onLoginSuccess(chooseAdmin, chooseAdmin ? "Admin Geosense" : "User Manual")
  }

  // 2. SIGN UP MANUAL
  const handleSignUp = (e) => {
    e.preventDefault()
    alert("Pendaftaran Berhasil! Silakan login menggunakan akun Anda.")
    setActiveTab("login")
  }

  // 3. HANDLER GOOGLE LOGIN REAL (DIPANGGIL SAAT GOOGLE BERHASIL AUTH)
  const handleGoogleSuccess = async (credentialResponse) => {
    const tokenDariGoogle = credentialResponse.credential
    
    try {
      // Kirim ID Token mentah ke backend FastAPI kalian untuk diverifikasi & cek DB
      const response = await fetch("http://localhost:8000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenDariGoogle })
      })
      
      const result = await response.json()
      
      if (result.error) {
        alert(result.error)
        return
      }

      if (result.is_new_user) {
        // --- KONDISI A: EMAIL BELUM ADA DI SQLITE (WARGA BARU) ---
        setGoogleUser({ email: result.email, name: result.name })
        setFullnameOnboarding(result.name) // Isi otomatis nama dari Google
        setIsOnboarding(true) // Alihkan ke layar isi Telegram
      } else {
        // --- KONDISI B: USER LAMA ATAU ADMIN ---
        // UPDATE: Sekarang ikut mengirimkan result.name ke App.jsx
        onLoginSuccess(result.is_admin, result.name)
      }
    } catch (err) {
      console.error("Gagal koneksi ke backend:", err)
      alert("Gagal terhubung ke server backend FastAPI. Pastikan backend sudah menyala di localhost:8000!")
    }
  }

  // 4. FUNGSI MENYIMPAN DATA ONBOARDING TELEGRAM KE DATABASE BACKEND
  const handleCompleteOnboarding = async (e) => {
    e.preventDefault()
    
    try {
      // Kirim data lengkap ke backend untuk di-INSERT ke tabel 'users' SQLite
      const response = await fetch("http://localhost:8000/api/auth/google/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          fullname: fullnameOnboarding,
          telegram: telegramOnboarding.startsWith("@") ? telegramOnboarding : `@${telegramOnboarding}`
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert("Pendaftaran berhasil! Akun Anda telah terintegrasi dengan Telegram EWS.")
        setIsOnboarding(false)
        // UPDATE: Mengirimkan status user biasa (false) dan nama lengkap onboarding-nya
        onLoginSuccess(false, fullnameOnboarding) 
      } else {
        alert(result.detail || "Gagal menyimpan data pendaftaran.")
      }
    } catch (err) {
      console.error("Gagal menyimpan onboarding:", err)
      alert("Terjadi kesalahan jaringan saat mendaftarkan data Telegram.")
    }
  }

  // ==================== TAMPILAN KHUSUS: ONBOARDING GOOGLE (USER BARU) ====================
  if (isOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] font-sans text-[#16425B] antialiased px-4 py-12">
        <Card className="w-full max-w-md border border-[#D9DCD6]/30 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden">
          <CardHeader className="space-y-2 text-center pt-8">
            <CardTitle className="text-xl font-extrabold tracking-tight text-[#16425B]">
              👋 Sedikit Lagi, Kak!
            </CardTitle>
            <CardDescription className="text-xs text-[#3A7CA5] font-medium max-w-[320px] mx-auto leading-relaxed">
              Akun Google <span className="font-semibold text-[#16425B]">{googleUser.email}</span> berhasil ditautkan. Lengkapi data berikut agar terintegrasi dengan Notifikasi Telegram EWS.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ob-name" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Nama Lengkap</Label>
                <Input 
                  id="ob-name" 
                  type="text" 
                  value={fullnameOnboarding}
                  onChange={(e) => setFullnameOnboarding(e.target.value)}
                  className="rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] text-sm py-5" 
                  required 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="ob-telegram" className="text-xs font-bold uppercase tracking-wider text-[#16425B]/80">Username Telegram</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#3A7CA5] font-bold text-sm pointer-events-none">
                    @
                  </span>
                  <Input 
                    id="ob-telegram" 
                    type="text" 
                    value={telegramOnboarding}
                    onChange={(e) => setTelegramOnboarding(e.target.value)}
                    className="pl-8 rounded-xl border-[#D9DCD6]/60 focus-visible:ring-[#3A7CA5] placeholder:text-slate-400 text-sm py-5" 
                    placeholder="username_kamu" 
                    required 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsOnboarding(false)}
                  className="w-1/3 border-[#D9DCD6]/60 text-slate-500 font-bold uppercase tracking-wider py-5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider py-5 rounded-xl text-xs shadow-md shadow-emerald-600/10 border-none cursor-pointer"
                >
                  Selesaikan Pendaftaran
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== TAMPILAN UTAMA (LOGIN / SIGN UP STANDARD) ====================
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

              {/* 2. REAL GOOGLE LOGIN BUTTON */}
              <div className="flex justify-center w-full my-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert("Autentikasi Google gagal.")}
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
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
            <CardContent className="space-y-5 px-6 pb-4">
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

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-widest text-[#3A7CA5]/60">
                <div className="absolute w-full border-t border-[#D9DCD6]/40"></div>
                <span className="relative bg-white px-3">atau</span>
              </div>

              {/* 3. REAL GOOGLE SIGN UP BUTTON */}
              <div className="flex justify-center w-full my-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert("Autentikasi Google gagal.")}
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            </CardContent>
          </>
        )}
        
        {/* FOOTER */}
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