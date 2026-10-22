import L from "leaflet"
import { Badge } from "@/components/ui/badge"
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"

// Node sensor contoh. Titik presisi hanya dirender untuk admin.
const NODES = [
  {
    id: "Node Sensor 01",
    sector: "Sektor Bandung Utara",
    position: [-6.9024, 107.6188],
    radius: 2800,
    status: "Online",
  },
  {
    id: "Node Sensor 02",
    sector: "Sektor Bandung Tengah",
    position: [-6.9236, 107.6042],
    radius: 2500,
    status: "Online",
  },
  {
    id: "Node Sensor 03",
    sector: "Sektor Bandung Selatan",
    position: [-6.9389, 107.6261],
    radius: 3000,
    status: "Online",
  },
]

const createNodeIcon = (index) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#16425B;color:#ffffff;font-size:12px;font-weight:700;border:2.5px solid #81C3D7;box-shadow:0 2px 10px rgba(22,66,91,0.35)">${index + 1}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  })

export default function LiveMap({ isAdmin }) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#D9DCD6]/30 overflow-hidden flex flex-col h-full flex-1">
      
      <div className="flex min-h-20 items-center justify-between gap-3 border-b border-[#D9DCD6]/40 px-4 py-3 bg-slate-50/50 flex-shrink-0 sm:h-20 sm:px-6 sm:py-0">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#16425B] sm:text-base">
            Peta Sebaran Node
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-[#2F6690] sm:text-xs">
            {isAdmin
              ? "Titik koordinat presisi 3 node sensor aktif di lapangan"
              : "Area jangkauan pemantauan sistem tanpa titik presisi node"}
          </p>
        </div>
        <Badge
          className={`${
            isAdmin
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          } flex-shrink-0 font-semibold border shadow-none pointer-events-none px-2 py-1 sm:px-3`}
        >
          {isAdmin ? (
            <>
              <span className="sm:hidden">{NODES.length} Node</span>
              <span className="hidden sm:inline">{NODES.length} Node Aktif</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">{NODES.length} Area</span>
              <span className="hidden sm:inline">{NODES.length} Area Terpantau</span>
            </>
          )}
        </Badge>
      </div>

      <div className="p-4 flex-1 flex flex-col sm:p-5">
        <div className="flex-1 min-h-[380px] h-full overflow-hidden rounded-xl border border-[#D9DCD6]/50 shadow-inner">
          <MapContainer
            center={[-6.9207, 107.6151]}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {isAdmin
              ? NODES.map((node, index) => (
                  <Marker key={node.id} position={node.position} icon={createNodeIcon(index)}>
                    <Popup>
                      <span className="font-bold text-[#16425B]">{node.id}</span>
                      <br />
                      <span className="text-xs text-[#16425B]/70">{node.sector}</span>
                      <br />
                      <span className="text-xs font-mono text-[#2F6690]">
                        {node.position[0].toFixed(6)}, {node.position[1].toFixed(6)}
                      </span>
                      <br />
                      <span className="text-xs text-emerald-600 font-semibold">Status: {node.status}</span>
                    </Popup>
                  </Marker>
                ))
              : NODES.map((node) => (
                  <Circle
                    key={node.id}
                    center={node.position}
                    radius={node.radius}
                    pathOptions={{
                      color: "#2F6690",
                      fillColor: "#81C3D7",
                      fillOpacity: 0.22,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <span className="font-bold text-[#16425B]">{node.id}</span>
                      <br />
                      <span className="text-xs text-[#16425B]/70">{node.sector}</span>
                      <br />
                      <span className="text-xs text-[#2F6690]">
                        Radius jangkauan ±{(node.radius / 1000).toFixed(1)} km
                      </span>
                      <br />
                      <span className="text-[11px] text-slate-500">
                        Lokasi presisi node tidak ditampilkan.
                      </span>
                    </Popup>
                  </Circle>
                ))}
          </MapContainer>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-[11px] text-[#16425B]/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  isAdmin ? "bg-[#16425B] ring-2 ring-[#81C3D7]" : "bg-[#81C3D7]/60 ring-1 ring-[#2F6690]/50"
                }`}
              />
              {isAdmin ? "Titik presisi node" : "Radius jangkauan sensor"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Node online
            </span>
          </div>
          <span className="font-medium">
            {isAdmin
              ? "Koordinat presisi hanya terlihat oleh admin."
              : "Koordinat presisi disembunyikan untuk keamanan data."}
          </span>
        </div>
      </div>

    </div>
  )
}
