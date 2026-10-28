import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { Activity, Compass, MapPin } from "lucide-react"
import { extractNodeGps, formatCoordinate, formatDirection } from "@/lib/telemetry"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const NODE_IDS = ["geo_1", "geo_2", "geo_3"]
const NODE_META = {
  geo_1: { label: "Geofon 1", color: "#16a34a" },
  geo_2: { label: "Geofon 2", color: "#d97706" },
  geo_3: { label: "Geofon 3", color: "#0284c7" },
}

function formatMetric(value, digits = 1) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : "--"
}

function formatActivity(activity, vibration) {
  const value = String(activity || "").trim().toUpperCase()
  const amplitude = Number(vibration)
  const hasSpike = Number.isFinite(amplitude) && amplitude >= 150
  if (hasSpike) return "TERDETEKSI GETARAN"
  if (!value || ["-", "DIEM", "AMAN", "NORMAL", "STABIL", "KONDISI STABIL"].includes(value)) {
    return "KONDISI STABIL"
  }
  if (["JALAN", "LONGSOR", "EVENT", "GETARAN", "WASPADA", "BAHAYA"].includes(value)) {
    return "TERDETEKSI GETARAN"
  }
  return "TERDETEKSI GETARAN"
}

function firstNumeric(node, keys) {
  for (const key of keys) {
    const numeric = Number(node?.[key])
    if (Number.isFinite(numeric) && numeric > 0) return numeric
  }
  return null
}

function computeStats(signal) {
  if (!Array.isArray(signal) || signal.length === 0) return null
  const values = signal
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
  if (values.length === 0) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const rms = Math.sqrt(values.reduce((total, value) => total + value * value, 0) / values.length)
  return {
    p2p: max - min,
    rms,
    peak: Math.max(Math.abs(max), Math.abs(min)),
  }
}

function getNodeStats(node) {
  const computed = computeStats(node?.signal)
  return {
    p2p: firstNumeric(node, ["p2p", "p2p_amplitude", "peak_to_peak", "amplitude", "pp"]) ?? computed?.p2p ?? null,
    rms: firstNumeric(node, ["rms", "rms_amplitude"]) ?? computed?.rms ?? null,
    peak: firstNumeric(node, ["peak", "max", "amplitude_max"]) ?? computed?.peak ?? null,
  }
}

function getNodeUnit(node, stats) {
  const unit = String(node?.unit || node?.sample_unit || "").toLowerCase()
  if (unit.includes("adc") || unit.includes("count")) return "counts"
  if (unit.includes("mv") || unit.includes("millivolt")) return "mV"

  const signalPeak = Array.isArray(node?.signal)
    ? Math.max(0, ...node.signal.map((value) => Math.abs(Number(value) || 0)))
    : 0
  return (stats?.p2p || 0) > 10 || signalPeak > 10 ? "counts" : "mV"
}

export default function VibrationChart({
  chartData = [0, 0, 0, 0, 0, 0],
  vibration = 0,
  activity = "-",
  nodes = null,
  location = null,
  direction = null,
  samplingRate = 90,
}) {
  const safeSamplingRate = Number(samplingRate) > 0 ? Number(samplingRate) : 90
  const activityLabel = formatActivity(activity, vibration)
  const movementDetected = activityLabel === "TERDETEKSI GETARAN"
  const signalLength = Math.max(
    0,
    ...NODE_IDS.map((nodeId) => nodes?.[nodeId]?.signal?.length || 0),
  )
  const hasNodeSignals = signalLength > 0

  // Event waveform baru mengirim ADC counts (belum terkalibrasi), sedangkan
  // payload lama memakai mV. Jangan hardcode "mV" lagi.
  const unitNode = NODE_IDS.map((nodeId) => nodes?.[nodeId]).find(Boolean)
  const metricUnit = getNodeUnit(unitNode, getNodeStats(unitNode))
  const unitLabel = metricUnit === "counts" ? "ADC counts" : "mV"
  const fixedY = metricUnit === "counts"
    ? { min: -10_000_000, max: 10_000_000 }
    : { min: -15, max: 15 }
  const eventNode = NODE_IDS.map((nodeId) => nodes?.[nodeId]).find(
    (node) => node && node.event_id !== undefined && node.event_id !== null,
  )

  const labels = hasNodeSignals
    ? Array.from({ length: signalLength }, (_, index) =>
        `${(index / safeSamplingRate).toFixed(1)}s`,
      )
    : Array.from(
        { length: chartData.length },
        (_, index) => `T-${chartData.length - 1 - index}s`,
      )

  const datasets = hasNodeSignals
    ? NODE_IDS.map((nodeId) => ({
        label: NODE_META[nodeId].label,
        data: nodes?.[nodeId]?.signal || [],
        borderColor: NODE_META[nodeId].color,
        backgroundColor: `${NODE_META[nodeId].color}1A`,
        borderWidth: 1.7,
        tension: 0.12,
        pointRadius: 0,
        pointHoverRadius: 3,
      }))
    : [
        {
          label: `Getaran Tanah (${unitLabel})`,
          data: chartData,
          borderColor: "#2F6690",
          backgroundColor: "rgba(129, 195, 215, 0.2)",
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: "#16425B",
          pointBorderColor: "white",
          pointBorderWidth: 1.5,
        },
      ]

  const data = { labels, datasets }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: hasNodeSignals,
        position: "bottom",
        labels: {
          color: "#16425B",
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: "line",
          font: { size: 10, weight: "600" },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#16425B",
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#3A7CA5",
          font: { size: 9 },
          maxTicksLimit: 7,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: false,
        min: fixedY.min,
        max: fixedY.max,
        grid: { color: "#EBF0F3" },
        ticks: {
          color: "#3A7CA5",
          font: { size: 9 },
          callback: (value) =>
            metricUnit === "counts"
              ? `${(Number(value) / 1_000_000).toFixed(1)}M`
              : value,
        },
        title: {
          display: true,
          text: `Amplitudo (${unitLabel})`,
          color: "#3A7CA5",
          font: { size: 10, weight: "600" },
        },
      },
    },
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex min-h-20 flex-shrink-0 flex-col gap-3 border-b border-border/60 bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground sm:text-base">
            Getaran 3 Node Geofon
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
            p2p maksimum:{" "}
            <span className="font-bold text-foreground">
              {formatMetric(vibration)} {metricUnit}
            </span>
            {eventNode
              ? ` | Event #${eventNode.event_id} · ${eventNode.sample_count ?? signalLength} sampel${
                  eventNode.utc_valid === false ? " · UTC estimasi" : ""
                }`
              : hasNodeSignals
                ? ` | ${signalLength} sampel terakhir per node`
                : " | menunggu stream processing"}
          </p>
        </div>
        <span className="inline-flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${hasNodeSignals ? "bg-emerald-500" : "bg-slate-400"}`}
            aria-hidden="true"
          />
          {hasNodeSignals ? "3 Node Live" : "Menunggu Data"}
        </span>
      </div>

      <div className="min-h-[320px] flex-1 p-3 sm:min-h-[380px] sm:p-5">
        <div
          className="h-full w-full"
          role="img"
          aria-label="Grafik sinyal getaran tiga node geofon"
        >
          <Line data={data} options={options} />
        </div>
      </div>

      <div className="border-t border-[#D9DCD6]/40 px-3 py-3 sm:px-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {NODE_IDS.map((nodeId) => {
            const node = nodes?.[nodeId] || {}
            const online =
              typeof node.online === "boolean" ? node.online : Object.keys(node).length > 0
            const gps = extractNodeGps(node)
            const stats = getNodeStats(node)
            const cardUnit = getNodeUnit(node, stats)

            return (
              <div
                key={nodeId}
                className="rounded-xl border border-border/70 bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: NODE_META[nodeId].color }}
                    />
                    <span className="truncate text-xs font-bold text-foreground">
                      {NODE_META[nodeId].label}
                    </span>
                  </div>
                  <span
                    className={`inline-flex flex-shrink-0 items-center gap-1.5 text-[10px] font-semibold ${
                      online ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`}
                      aria-hidden="true"
                    />
                    {online ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#6B7F8A]">
                      p2p
                    </p>
                    <p className="text-xs font-bold text-[#16425B]">
                      {formatMetric(stats.p2p)}{" "}
                      <span className="text-[9px] font-medium">{cardUnit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#6B7F8A]">
                      RMS
                    </p>
                    <p className="text-xs font-bold text-[#16425B]">
                      {formatMetric(stats.rms)}{" "}
                      <span className="text-[9px] font-medium">{cardUnit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#6B7F8A]">
                      peak
                    </p>
                    <p className="text-xs font-bold text-[#16425B]">
                      {formatMetric(stats.peak)}{" "}
                      <span className="text-[9px] font-medium">{cardUnit}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[9px]">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-[#6B7F8A]" aria-hidden="true" />
                  {gps ? (
                    <span className="truncate font-mono text-[#2F6690]">
                      GPS {formatCoordinate(gps.latitude)}, {formatCoordinate(gps.longitude)}
                    </span>
                  ) : (
                    <span className="font-medium text-amber-600">GPS belum tersedia</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 space-y-2 border-t border-[#D9DCD6]/40 pt-3 text-[11px] text-[#2F6690]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 flex-shrink-0" />
              Analisis Pergerakan (AI):{" "}
              <strong className={movementDetected ? "text-amber-600" : "text-emerald-700"}>
                {activityLabel}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              Lokasi TDOA:{" "}
              <strong className="text-[#16425B]">
                {location
                  ? `X ${formatMetric(location.x)} m, Y ${formatMetric(location.y)} m`
                  : "Menunggu event 3 node"}
              </strong>
            </span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg bg-slate-50/70 px-2.5 py-2 sm:flex-row sm:items-center">
            <span className="inline-flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              Arah longsor:{" "}
              <strong className="text-[#16425B]">
                {direction ? formatDirection(direction) : "Menunggu hasil triangulasi"}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
