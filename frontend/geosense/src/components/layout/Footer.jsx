export default function Footer() {
  return (
    <footer className="mt-12 border-t border-brand-border bg-brand-dark text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-center md:flex-row md:text-left">

        <div>
          <h3 className="text-lg font-semibold">
            Geosense
          </h3>

          <p className="text-sm text-white/70">
            Early Warning System for Landslide Monitoring
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