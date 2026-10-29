import L from "leaflet"
import { useEffect, useMemo, useRef } from "react"
import { Compass } from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import {
  destinationPoint,
  formatCoordinate,
  formatDirection,
  getEventOrigin,
  getEventPoint,
  getNodeMapData,
  getSiteCenter,
} from "@/lib/telemetry"

const createNodeIcon = (index, online = true) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:${
      online ? "#16425B" : "#64748B"
    };color:#ffffff;font-size:12px;font-weight:700;border:2.5px solid ${
      online ? "#81C3D7" : "#CBD5E1"
    };box-shadow:0 2px 10px rgba(22,66,91,0.35)">${index + 1}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  })

const createDirectionIcon = (bearing) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:rgba(220,38,38,0.12);border:2px solid rgba(220,38,38,0.65);box-shadow:0 3px 12px rgba(220,38,38,0.28);transform:rotate(${bearing}deg)"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })

const createEventIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#DC2626;color:#fff;border:3px solid #fff;box-shadow:0 3px 14px rgba(220,38,38,0.45)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17],
  })

function mapDistanceMeters(a, b) {
  const [lat1, lon1] = a
  const [lat2, lon2] = b
  const meanLat = ((lat1 + lat2) / 2) * (Math.PI / 180)
  const east = (lon2 - lon1) * 111_320 * Math.cos(meanLat)
  const north = (lat2 - lat1) * 110_540
  return Math.hypot(east, north)
}

function MapFocus({ center, positions, positionsKey }) {
  const map = useMap()
  const lastKey = useRef("")

  useEffect(() => {
    if (positions.length === 0 || positionsKey === lastKey.current) return
    lastKey.current = positionsKey

    if (positions.length === 1) {
      map.setView(positions[0], 15)
      return
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 17 })
  }, [center, map, positions, positionsKey])

  return null
}

export default function LiveMap({ isAdmin, nodes = null, location = null, direction = null }) {
  const mapNodes = useMemo(
    () => (Array.isArray(nodes) && nodes.length > 0 ? nodes : getNodeMapData(null)),
    [nodes],
  )
  const center = useMemo(() => getSiteCenter(mapNodes), [mapNodes])
  const gpsPositions = useMemo(
    () => mapNodes.filter((node) => node.hasGps).map((node) => node.position),
    [mapNodes],
  )
  const eventPoint = useMemo(() => getEventPoint(location), [location])
  const focusPositions = useMemo(
    () => (eventPoint ? [...gpsPositions, eventPoint] : gpsPositions),
    [eventPoint, gpsPositions],
  )
  const positionsKey = useMemo(
    () =>
      focusPositions
        .map(([latitude, longitude]) => `${latitude.toFixed(4)},${longitude.toFixed(4)}`)
        .join("|"),
    [focusPositions],
  )
  const hasGps = gpsPositions.length > 0
  const onlineCount = mapNodes.filter((node) => node.online).length
  const directionOrigin = useMemo(
    () => (isAdmin ? getEventOrigin(location, mapNodes) : center),
    [center, isAdmin, location, mapNodes],
  )
  const directionEnd = useMemo(() => {
    if (!direction || !hasGps) return null
    if (eventPoint) return eventPoint
    return destinationPoint(directionOrigin, direction.bearing, 320)
  }, [direction, directionOrigin, eventPoint, hasGps])
  const movementEnd = useMemo(() => {
    if (!eventPoint || !direction) return null
    return destinationPoint(eventPoint, direction.bearing, 28)
  }, [direction, eventPoint])
  const eventRadius = useMemo(() => {
    if (!eventPoint || gpsPositions.length < 3) return 18
    const spans = gpsPositions.map((position) =>
      mapDistanceMeters(position, eventPoint),
    )
    return Math.max(12, Math.min(30, Math.max(...spans) * 0.65))
  }, [eventPoint, gpsPositions])

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex min-h-20 flex-shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-4 py-3 sm:h-20 sm:px-6 sm:py-0">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground sm:text-base">Peta Sebaran Node</h3>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
            {isAdmin
              ? "Titik presisi node mengikuti koordinat GPS yang dikirim alat"
              : "Area jangkauan pemantauan sistem tanpa titik presisi node"}
          </p>
        </div>
        <span className="pointer-events-none inline-flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-emerald-500" : "bg-sky-500"}`}
            aria-hidden="true"
          />
          {isAdmin ? `${onlineCount} node aktif` : `${mapNodes.length} area terpantau`}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="h-full min-h-[380px] flex-1 overflow-hidden rounded-xl border border-border/60 shadow-inner">
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapFocus center={center} positions={focusPositions} positionsKey={positionsKey} />

            {isAdmin
              ? mapNodes.map((node, index) => (
                  <Marker
                    key={node.key}
                    position={node.position}
                    icon={createNodeIcon(index, node.online)}
                  >
                    <Popup>
                      <span className="font-bold text-[#16425B]">{node.id}</span>
                      <br />
                      <span className="text-xs text-[#16425B]/70">{node.sector}</span>
                      <br />
                      {node.hasGps ? (
                        <>
                          <span className="font-mono text-xs text-[#2F6690]">
                            {formatCoordinate(node.position[0])}, {formatCoordinate(node.position[1])}
                          </span>
                          <br />
                          <span className="text-[11px] text-slate-500">
                            GPS fix
                            {node.gps?.satellites ? ` · ${node.gps.satellites} satelit` : ""}
                            {node.gps?.hdop ? ` · HDOP ${node.gps.hdop}` : ""}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-amber-600">
                          GPS belum tersedia, memakai titik fallback.
                        </span>
                      )}
                      <br />
                      <span
                        className={`text-xs font-semibold ${
                          node.online ? "text-emerald-600" : "text-slate-500"
                        }`}
                      >
                        Status: {node.online ? "Online" : "Offline"}
                      </span>
                    </Popup>
                  </Marker>
                ))
              : mapNodes.map((node) => (
                  <Circle
                    key={node.key}
                    center={node.position}
                    radius={node.radius}
                    pathOptions={{
                      color: node.online ? "#2F6690" : "#94A3B8",
                      fillColor: node.online ? "#81C3D7" : "#CBD5E1",
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

            {eventPoint && gpsPositions.length >= 3 && (
              <Polygon
                positions={gpsPositions}
                pathOptions={{
                  color: "#DC2626",
                  fillColor: "#DC2626",
                  fillOpacity: 0.06,
                  weight: 1.5,
                  dashArray: "5 7",
                }}
              />
            )}

            {eventPoint && (
              <>
                <Circle
                  center={eventPoint}
                  radius={eventRadius}
                  pathOptions={{
                    color: "#DC2626",
                    fillColor: "#DC2626",
                    fillOpacity: 0.18,
                    weight: 2,
                    dashArray: "7 5",
                  }}
                />
                <Circle
                  center={eventPoint}
                  radius={eventRadius * 1.65}
                  pathOptions={{
                    color: "#EF4444",
                    fillColor: "#EF4444",
                    fillOpacity: 0.07,
                    weight: 1.5,
                    dashArray: "3 7",
                  }}
                />
              </>
            )}

            {eventPoint && (
              <Marker position={eventPoint} icon={createEventIcon()}>
                <Popup>
                  <span className="font-bold text-[#16425B]">Estimasi lokasi TDOA</span>
                  <br />
                  <span className="font-mono text-xs text-[#2F6690]">
                    {formatCoordinate(eventPoint[0])}, {formatCoordinate(eventPoint[1])}
                  </span>
                  <br />
                  <span className="text-[11px] text-slate-500">
                    Titik event dari korelasi 3 node, berada di dalam area segitiga.
                  </span>
                </Popup>
              </Marker>
            )}

            {directionEnd && direction && (
              <Polyline
                positions={[directionOrigin, directionEnd]}
                pathOptions={{
                  color: "#DC2626",
                  weight: 2,
                  opacity: 0.35,
                  dashArray: "4 8",
                }}
              />
            )}

            {eventPoint && movementEnd && direction && (
              <>
                <Polyline
                  positions={[eventPoint, movementEnd]}
                  pathOptions={{
                    color: "#DC2626",
                    weight: 3.5,
                    opacity: 0.9,
                  }}
                />
                <Marker position={movementEnd} icon={createDirectionIcon(direction.bearing)}>
                  <Popup>
                    <span className="font-bold text-[#16425B]">Arah pergerakan getaran</span>
                    <br />
                    <span className="text-xs text-[#16425B]/70">{formatDirection(direction)}</span>
                    <br />
                    <span className="text-[11px] text-slate-500">
                      Panah dimulai dari episentrum TDOA.
                    </span>
                  </Popup>
                </Marker>
              </>
            )}

            {!eventPoint && directionEnd && direction && (
              <Marker position={directionEnd} icon={createDirectionIcon(direction.bearing)}>
                <Popup>
                  <span className="font-bold text-[#16425B]">Perkiraan arah pergerakan</span>
                  <br />
                  <span className="text-xs text-[#16425B]/70">{formatDirection(direction)}</span>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-[#D9DCD6]/50 bg-slate-50/60 px-3 py-2.5 text-[11px] text-[#2F6690] sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Arah longsor:{" "}
            <strong className="text-[#16425B]">
              {direction ? formatDirection(direction) : "Menunggu hasil triangulasi 3 node"}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            TDOA:{" "}
            <strong className="text-[#16425B]">
              {eventPoint && location
                ? `X ${Number(location.x).toFixed(1)} m, Y ${Number(location.y).toFixed(1)} m`
                : "Menunggu event 3 node"}
            </strong>
          </span>
        </div>
      </div>
    </div>
  )
}
