// Pemetaan status dari backend (AMAN / SIAGA / WASPADA / WARNING / BAHAYA)
// ke tampilan dashboard yang dipakai bersama oleh HeroSection & DisasterGuidance.

export function toDisplayStatus(raw) {
  const value = String(raw || "").toUpperCase()
  if (value === "SIAGA") return "Siaga"
  if (value === "WASPADA" || value === "WARNING" || value === "BAHAYA") return "Warning"
  return "Aman"
}

export const STATUS_META = {
  Aman: {
    label: "Aman",
    description:
      "Seluruh infrastruktur node sensor telemetri beroperasi normal tanpa anomali.",
    guidance:
      "Kondisi aman. Gunakan waktu ini untuk memeriksa drainase dan rekahan lereng, mengenali jalur evakuasi, serta menyiapkan tas siaga.",
    badgeBg: "",
    badgeColor: "#047857",
    cardBg: "bg-emerald-50/90 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)]",
    textColor: "text-emerald-800",
    descColor: "text-emerald-900/80",
    borderTop: "border-emerald-200",
    panelBg: "bg-emerald-50 border-emerald-200",
    panelText: "text-emerald-900",
    panelIcon: "bg-emerald-600 text-white",
  },
  Siaga: {
    label: "Siaga",
    description:
      "Waspada! Terdeteksi peningkatan getaran mikro frekuensi rendah pada struktur tanah.",
    guidance:
      "Tingkatkan kewaspadaan. Jauhi lereng dan tebing, pantau informasi resmi BNPB/BPBD, dan siapkan evakuasi bila getaran atau hujan meningkat.",
    badgeBg: "",
    badgeColor: "#B45309",
    cardBg: "bg-amber-50/90 border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.15)]",
    textColor: "text-amber-800",
    descColor: "text-amber-950/80",
    borderTop: "border-amber-200",
    panelBg: "bg-amber-50 border-amber-200",
    panelText: "text-amber-900",
    panelIcon: "bg-amber-500 text-white",
  },
  Warning: {
    label: "Warning",
    description:
      "BAHAYA! Pergeseran tanah masif terdeteksi. Sinyal darurat dikirim otomatis ke WhatsApp pengguna terdaftar.",
    guidance:
      "Segera evakuasi menjauhi arah longsoran atau suara gemuruh menuju zona evakuasi. Jangan kembali sebelum area dinyatakan aman. Hubungi 112/BPBD bila ada korban.",
    badgeBg: "animate-pulse",
    badgeColor: "#B91C1C",
    cardBg: "bg-red-50/90 border-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.15)]",
    textColor: "text-red-800",
    descColor: "text-red-950/80",
    borderTop: "border-red-200",
    panelBg: "bg-red-50 border-red-200",
    panelText: "text-red-900",
    panelIcon: "bg-red-600 text-white",
  },
}

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.Aman
}
