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
import { Activity, Compass, MapPin, Radio, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  const signalLength = Math.max(
    0,
    ...NODE_IDS.map((nodeId) => nodes?.[nodeId]?.signal?.length || 0),
  )
  const hasNodeSignals = signalLength > 0

  // Event waveform baru mengirim ADC counts (belum terkalibrasi), sedangkan
  // payload lama memakai mV. Jangan hardcode "mV" lagi.
  const rawUnit = NODE_IDS.map((nodeId) => nodes?.[nodeId]?.unit).find(Boolean)
  const unit = String(rawUnit || "mV").toLowerCase()
  const isAdcCounts = unit.includes("adc") || unit.includes("count")
  const metricUnit = isAdcCounts ? "counts" : "mV"
  const unitLabel = isAdcCounts ? "ADC counts" : "mV"
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
        grid: { color: "#EBF0F3" },
        ticks: { color: "#3A7CA5", font: { size: 9 } },
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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#D9DCD6]/30 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="flex min-h-20 flex-shrink-0 flex-col gap-3 border-b border-[#D9DCD6]/40 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#16425B] sm:text-base">
            Getaran 3 Node Geofon
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-[#2F6690] sm:text-xs">
            p2p maksimum:{" "}
            <span className="font-bold text-[#16425B]">
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
        <Badge className="inline-flex flex-shrink-0 items-center gap-1.5 border border-[#81C3D7]/40 bg-[#81C3D7]/20 px-2.5 py-0.5 text-[#2F6690] shadow-none">
          <Radio className="h-3 w-3" />
          {hasNodeSignals ? "3 Node Live" : "Menunggu Data"}
        </Badge>
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

            return (
              <div
                key={nodeId}
                className={`rounded-xl border p-3 ${
                  online
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: NODE_META[nodeId].color }}
                    />
                    <span className="truncate text-xs font-bold text-[#16425B]">
                      {NODE_META[nodeId].label}
                    </span>
                  </div>
                  <span
                    className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      online
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {online ? (
                      <Radio className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {online ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#6B7F8A]">
                      p2p
                    </p>
                    <p className="text-xs font-bold text-[#16425B]">
                      {formatMetric(node.p2p)}{" "}
                      <span className="text-[9px] font-medium">{metricUnit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#6B7F8A]">
                      RMS
                    </p>
                    <p className="text-xs font-bold text-[#16425B]">
                      {formatMetric(node.rms)}{" "}
                      <span className="text-[9px] font-medium">{metricUnit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#6B7F8A]">
                      peak
                    </p>
                    <p className="text-xs font-bold text-[#16425B]">
                      {formatMetric(node.peak)}{" "}
                      <span className="text-[9px] font-medium">{metricUnit}</span>
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
              Aktivitas ML (Random Forest):{" "}
              <strong className="text-[#16425B]">{activity || "-"}</strong>
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

          <div className="flex flex-col gap-1.5 rounded-lg bg-slate-50/70 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              Arah longsor:{" "}
              <strong className="text-[#16425B]">
                {direction ? formatDirection(direction) : "Menunggu hasil triangulasi"}
              </strong>
            </span>
            <span className="text-[10px] text-slate-500">
              {direction
                ? direction.source === "location.x_y"
                  ? "x = timur, y = utara; 0° = Utara"
                  : "0° = Utara, searah jarum jam"
                : "Butuh event getaran yang terdeteksi 3 node"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
