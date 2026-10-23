export const NODE_IDS = ["geo_1", "geo_2", "geo_3"]

export const NODE_META = {
  geo_1: { label: "Geofon 1", color: "#16a34a" },
  geo_2: { label: "Geofon 2", color: "#d97706" },
  geo_3: { label: "Geofon 3", color: "#0284c7" },
}

// Dipakai hanya kalau node belum mengirim GPS. Titik ini bukan lokasi final.
export const FALLBACK_NODES = [
  {
    id: "Node Sensor 01",
    sector: "Sektor Bandung Utara",
    position: [-6.9024, 107.6188],
    radius: 2800,
  },
  {
    id: "Node Sensor 02",
    sector: "Sektor Bandung Tengah",
    position: [-6.9236, 107.6042],
    radius: 2500,
  },
  {
    id: "Node Sensor 03",
    sector: "Sektor Bandung Selatan",
    position: [-6.9389, 107.6261],
    radius: 3000,
  },
]

export const FALLBACK_CENTER = [-6.9207, 107.6151]

const COMPASS_LABELS = [
  "Utara",
  "Timur Laut",
  "Timur",
  "Tenggara",
  "Selatan",
  "Barat Daya",
  "Barat",
  "Barat Laut",
]

const COMPASS_SHORT = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"]

function firstFinite(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return null
}

function parseCoordinate(value, { latitude }) {
  if (value === null || value === undefined || value === "") return null

  let numeric = Number(value)
  let hemisphere = ""

  if (!Number.isFinite(numeric)) {
    const match = String(value)
      .trim()
      .toUpperCase()
      .match(/^([+-]?\d+(?:[.,]\d+)?)\s*°?\s*([NSEW])?$/)
    if (!match) return null
    numeric = Number(match[1].replace(",", "."))
    hemisphere = match[2] || ""
    if (!Number.isFinite(numeric)) return null
  }

  if (hemisphere === "S" || hemisphere === "W") numeric = -Math.abs(numeric)
  const limit = latitude ? 90 : 180
  if (Math.abs(numeric) > limit) return null
  return numeric
}

function pairToGps(first, second) {
  const firstLat = parseCoordinate(first, { latitude: true })
  const secondLon = parseCoordinate(second, { latitude: false })
  if (firstLat !== null && secondLon !== null) {
    return { latitude: firstLat, longitude: secondLon }
  }

  const firstLon = parseCoordinate(first, { latitude: false })
  const secondLat = parseCoordinate(second, { latitude: true })
  if (firstLon !== null && secondLat !== null) {
    return { latitude: secondLat, longitude: firstLon }
  }
  return null
}

function candidateContainers(node) {
  if (!node || typeof node !== "object") return []
  const containers = []
  for (const key of ["gps", "gnss", "position", "coords", "coordinates", "location"]) {
    if (node[key]) containers.push(node[key])
  }
  containers.push(node)
  return containers
}

export function extractNodeGps(node) {
  if (!node || typeof node !== "object") return null

  for (const candidate of candidateContainers(node)) {
    if (Array.isArray(candidate) && candidate.length >= 2) {
      const pair = pairToGps(candidate[0], candidate[1])
      if (pair) return pair
      continue
    }

    if (typeof candidate === "string") {
      const parts = candidate.split(/[,;\s]+/).filter(Boolean)
      if (parts.length >= 2) {
        const pair = pairToGps(parts[0], parts[1])
        if (pair) return pair
      }
      continue
    }

    if (!candidate || typeof candidate !== "object") continue

    const latitude = parseCoordinate(
      candidate.latitude ??
        candidate.lat ??
        candidate.lintang ??
        candidate.gps_latitude ??
        candidate.gps_lat,
      { latitude: true },
    )
    const longitude = parseCoordinate(
      candidate.longitude ??
        candidate.lon ??
        candidate.lng ??
        candidate.long ??
        candidate.bujur ??
        candidate.gps_longitude ??
        candidate.gps_lon ??
        candidate.gps_lng,
      { latitude: false },
    )

    if (latitude !== null && longitude !== null) {
      const gps = { latitude, longitude }
      const altitude = firstFinite(candidate.altitude, candidate.alt, candidate.elevation)
      const satellites = firstFinite(
        candidate.satellites,
        candidate.sats,
        candidate.num_sats,
        candidate.sat_count,
      )
      const hdop = firstFinite(candidate.hdop, candidate.accuracy)
      if (altitude !== null) gps.altitude = altitude
      if (satellites !== null) gps.satellites = satellites
      if (hdop !== null) gps.hdop = hdop
      if (typeof candidate.fix === "boolean") gps.fix = candidate.fix
      return gps
    }

    const nested = candidate.coordinates ?? candidate.coord ?? candidate.position
    if (Array.isArray(nested) && nested.length >= 2) {
      const pair = pairToGps(nested[0], nested[1])
      if (pair) return pair
    }
  }

  return null
}

export function getNodeMapData(nodes) {
  return NODE_IDS.map((nodeId, index) => {
    const fallback = FALLBACK_NODES[index]
    const node = nodes?.[nodeId] && typeof nodes[nodeId] === "object" ? nodes[nodeId] : {}
    const gps = extractNodeGps(node)
    const radius = firstFinite(node.radius, node.coverage_radius)
    const online =
      typeof node.online === "boolean"
        ? node.online
        : node.status
          ? String(node.status).toLowerCase() !== "offline"
          : true

    return {
      key: nodeId,
      id: node.label || node.name || node.node_name || fallback.id,
      sector: node.sector || node.area || fallback.sector,
      position: gps ? [gps.latitude, gps.longitude] : fallback.position,
      radius: radius !== null && radius > 0 ? radius : fallback.radius,
      online,
      gps,
      hasGps: Boolean(gps),
    }
  })
}

export function getSiteCenter(nodeData = []) {
  const withGps = nodeData.filter((node) => node.hasGps)
  const source = withGps.length > 0 ? withGps : nodeData
  if (source.length === 0) return FALLBACK_CENTER

  return [
    source.reduce((total, node) => total + node.position[0], 0) / source.length,
    source.reduce((total, node) => total + node.position[1], 0) / source.length,
  ]
}

// Titik awal panah arah longsor. Processing menghitung location.x/y relatif
// terhadap geo_1, jadi default-kan ke GPS geo_1 (bukan centroid node).
export function getEventOrigin(location, nodeData = []) {
  if (location && typeof location === "object") {
    const eventLat = parseCoordinate(
      location.estimated_latitude ?? location.event_latitude,
      { latitude: true },
    )
    const eventLon = parseCoordinate(
      location.estimated_longitude ?? location.event_longitude,
      { latitude: false },
    )
    if (eventLat !== null && eventLon !== null) return [eventLat, eventLon]

    const origin = location.origin ?? location.reference
    if (origin && typeof origin === "object") {
      const lat = parseCoordinate(origin.latitude ?? origin.lat, { latitude: true })
      const lon = parseCoordinate(origin.longitude ?? origin.lon ?? origin.lng, {
        latitude: false,
      })
      if (lat !== null && lon !== null) return [lat, lon]
    }

    if (typeof origin === "string") {
      const match = origin.trim().match(/([1-9]\d*)$/)
      const key = match ? `geo_${match[1]}` : null
      const originNode = nodeData.find((node) => node.key === key)
      if (originNode?.hasGps) return originNode.position
    }
  }

  const geo1 = nodeData.find((node) => node.key === "geo_1" && node.hasGps)
  if (geo1) return geo1.position

  return getSiteCenter(nodeData)
}

export function bearingBetween(from, to) {
  const [fromLat, fromLon] = from
  const [toLat, toLon] = to
  const averageLat = ((fromLat + toLat) / 2) * (Math.PI / 180)
  const east = (toLon - fromLon) * Math.cos(averageLat)
  const north = toLat - fromLat
  if (Math.abs(east) < 1e-12 && Math.abs(north) < 1e-12) return null
  return (Math.atan2(east, north) * (180 / Math.PI) + 360) % 360
}

export function compassFromBearing(bearing) {
  const normalized = ((Number(bearing) || 0) % 360 + 360) % 360
  const index = Math.floor((normalized + 22.5) / 45) % 8
  return {
    compass: COMPASS_LABELS[index],
    short: COMPASS_SHORT[index],
  }
}

function normalizeDirection(bearing, source) {
  if (!Number.isFinite(Number(bearing))) return null
  const normalized = ((Number(bearing) % 360) + 360) % 360
  const labels = compassFromBearing(normalized)
  return {
    bearing: normalized,
    compass: labels.compass,
    short: labels.short,
    source,
  }
}

export function computeLandslideDirection(location, nodeData) {
  if (!location || typeof location !== "object") return null

  if (location.direction && typeof location.direction === "object") {
    const bearing = firstFinite(
      location.direction.bearing_degrees,
      location.direction.bearing,
      location.direction.heading,
      location.direction.azimuth,
    )
    const direction = normalizeDirection(bearing, "location.direction")
    if (direction) return direction
  }

  const directBearing = firstFinite(
    location.bearing_degrees,
    location.bearing,
    location.heading,
    location.azimuth,
    location.direction_deg,
  )
  if (directBearing !== null) {
    return normalizeDirection(directBearing, "location.bearing")
  }

  const eventLat = parseCoordinate(location.latitude, { latitude: true })
  const eventLon = parseCoordinate(location.longitude, { latitude: false })
  if (eventLat !== null && eventLon !== null) {
    const center = getSiteCenter(nodeData)
    const bearing = bearingBetween(center, [eventLat, eventLon])
    if (bearing !== null) return normalizeDirection(bearing, "location.lat_lon")
  }

  const x = firstFinite(location.x, location.east, location.dx)
  const y = firstFinite(location.y, location.north, location.dy)
  if (x !== null && y !== null && (Math.abs(x) > 1e-9 || Math.abs(y) > 1e-9)) {
    // Konvensi lokal: x = timur, y = utara. atan2(east, north) -> bearing.
    const bearing = (Math.atan2(x, y) * (180 / Math.PI) + 360) % 360
    return normalizeDirection(bearing, "location.x_y")
  }

  return null
}

export function destinationPoint([latitude, longitude], bearing, distanceMeters) {
  const radians = (Number(bearing) || 0) * (Math.PI / 180)
  const north = Math.cos(radians) * distanceMeters
  const east = Math.sin(radians) * distanceMeters
  return [
    latitude + north / 111320,
    longitude + east / (111320 * Math.max(0.01, Math.cos(latitude * (Math.PI / 180)))),
  ]
}

export function formatCoordinate(value, digits = 6) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : "-"
}

export function formatDirection(direction) {
  if (!direction) return null
  return `${direction.compass} (${Math.round(direction.bearing)}°)`
}
