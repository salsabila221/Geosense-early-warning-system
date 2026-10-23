export default function Footer() {
  return (
    <footer className="mt-12 border-t border-[#2F6690]/30 bg-brand-dark text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center sm:px-6 lg:flex-row lg:text-left">

        <div>
          <h3 className="text-lg font-semibold">
            Geosense
          </h3>

          <p className="text-sm text-white/70">
            Landslide Monitoring & Warning System
          </p>
        </div>

        <div className="text-sm text-white/70">
          Developed by Electronics & Informatics Engineering, Universitas Padjadjaran
        </div>

        <div className="text-sm text-white/70">
          © 2026 Geosense. All Rights Reserved.
        </div>

      </div>
    </footer>
  )
}