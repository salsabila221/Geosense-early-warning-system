import { Badge } from "@/components/ui/badge"
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export default function LiveMap({ isAdmin }) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#D9DCD6]/30 overflow-hidden flex flex-col h-full flex-1">
      
      <div className="flex h-20 items-center justify-between border-b border-[#D9DCD6]/40 px-6 bg-slate-50/50 flex-shrink-0">
        <div>
          <h3 className="text-base font-bold text-[#16425B]">
            Peta Sebaran Sensor
          </h3>
          <p className="text-xs text-[#3A7CA5] font-medium mt-0.5">
            {isAdmin ? "Geolokasi titik koordinat node aktif di lapangan" : "Wilayah jangkauan sistem monitoring digital"}
          </p>
        </div>
        <Badge className={`${isAdmin ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"} font-semibold border shadow-none pointer-events-none px-3 py-1`}>
          {isAdmin ? "1 Node Aktif" : "Sistem Aktif"}
        </Badge>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1 min-h-[380px] h-full overflow-hidden rounded-xl border border-[#D9DCD6]/50 shadow-inner">
          <MapContainer
            center={[-6.914744, 107.60981]}
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {isAdmin ? (
              // TAMPILAN ADMIN: Pin Titik Sensor Akurat & Popup Detail Kesalahan
              <Marker position={[-6.914744, 107.60981]}>
                <Popup>
                  <span className="font-bold text-[#16425B]">Node Sensor 01</span>
                  <br />
                  <span className="text-xs text-emerald-600 font-semibold">● Status: Online</span>
                </Popup>
              </Marker>
            ) : (
              // TAMPILAN GUEST/USER: Sembunyikan Pin, ganti dengan Highlight Radius Lingkaran Wilayah
              <Circle 
                center={[-6.914744, 107.60981]}
                radius={3500}
                pathOptions={{ color: '#2F6690', fillColor: '#81C3D7', fillOpacity: 0.25, weight: 2 }}
              />
            )}
          </MapContainer>
        </div>
      </div>

    </div>
  )
}