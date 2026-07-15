import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle, // <-- Langkah 1: Tambahkan Circle di sini
} from "react-leaflet"

import "leaflet/dist/leaflet.css"

// <-- Langkah 2: Tangkap prop { isAdmin } di dalam fungsi
export default function LiveMap({ isAdmin }) {
  const position = [-6.914744, 107.60981] // Kita buat variabel biar rapi

  return (
    <Card className="rounded-xl border border-brand-border bg-white shadow-sm">

      <CardHeader className="flex h-20 flex-row items-center justify-between border-b border-brand-border">

        <div>
          <CardTitle className="text-lg font-semibold text-brand-dark">
            Peta Sebaran Sensor
          </CardTitle>

          <p className="mt-1 text-sm text-brand-secondary">
            Lokasi node sensor aktif.
          </p>
        </div>

        {/* Opsional: Teks Badge ikut menyesuaikan role */}
        <Badge className="bg-[#ECF8F1] text-[#3D8B68] hover:bg-[#ECF8F1]">
          {isAdmin ? "1 Node Aktif" : "1 Area Dipantau"}
        </Badge>

      </CardHeader>

      <CardContent className="h-[360px] p-5">

        <div className="h-full overflow-hidden rounded-lg border border-brand-border">

          <MapContainer
            center={position}
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full"
          >

            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Langkah 3: Pengondisian Marker vs Area Lingkaran */}
            {isAdmin ? (
              // Tampilan khusus ADMIN (Koordinat detail terlihat)
              <Marker position={position}>
                <Popup>
                  Node Sensor 01
                  <br />
                  Status : Online
                </Popup>
              </Marker>
            ) : (
              // Tampilan khusus GUEST (Hanya lingkaran area dengan garis putus-putus)
              <Circle
                center={position}
                radius={2500} // Radius area dalam meter
                pathOptions={{
                  color: "#2F6690",       // Warna garis tepi (brand-primary)
                  fillColor: "#2F6690",   // Warna isi lingkaran
                  fillOpacity: 0.15,      // Transparansi isi
                  dashArray: "6, 6"       // Membuat garis lingkaran putus-putus
                }}
              />
            )}

          </MapContainer>

        </div>

      </CardContent>

    </Card>
  )
}