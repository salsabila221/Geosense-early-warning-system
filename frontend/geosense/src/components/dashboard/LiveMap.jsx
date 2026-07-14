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
} from "react-leaflet"

import "leaflet/dist/leaflet.css"

export default function LiveMap() {
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

        <Badge className="bg-[#ECF8F1] text-[#3D8B68] hover:bg-[#ECF8F1]">
          1 Node Aktif
        </Badge>

      </CardHeader>

      <CardContent className="h-[360px] p-5">

        <div className="h-full overflow-hidden rounded-lg border border-brand-border">

          <MapContainer
            center={[-6.914744, 107.60981]}
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full"
          >

            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[-6.914744, 107.60981]}>
              <Popup>
                Node Sensor 01
                <br />
                Status : Online
              </Popup>
            </Marker>

          </MapContainer>

        </div>

      </CardContent>

    </Card>
  )
}