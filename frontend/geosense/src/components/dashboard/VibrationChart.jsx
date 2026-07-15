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
import { Badge } from "@/components/ui/badge"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function VibrationChart() {
  const data = {
    labels: ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25"],
    datasets: [
      {
        label: "Frekuensi Getaran (Hz)",
        data: [2.3, 2.8, 2.1, 3.4, 2.9, 2.5],
        borderColor: "#2F6690",
        backgroundColor: "rgba(129, 195, 215, 0.2)",
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#16425B",
        pointBorderColor: "white",
        pointBorderWidth: 1.5,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#3A7CA5", font: { size: 11 } } },
      y: { 
        beginAtZero: true, 
        grid: { color: "#EBF0F3" }, 
        ticks: { color: "#3A7CA5", stepSize: 1, font: { size: 11 } } 
      },
    },
  }

  return (
    <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#D9DCD6]/30 overflow-hidden flex flex-col h-full flex-1">
      
      <div className="flex h-20 items-center justify-between border-b border-[#D9DCD6]/40 px-6 bg-slate-50/50 flex-shrink-0">
        <div>
          <h3 className="text-base font-bold text-[#16425B]">
            Grafik Getaran Tanah
          </h3>
          <p className="text-xs text-[#3A7CA5] font-medium mt-0.5">
            Analisis spektrum frekuensi 30 menit terakhir
          </p>
        </div>
        <Badge className="bg-[#81C3D7]/20 text-[#2F6690] border border-[#81C3D7]/40 shadow-none px-2.5 py-0.5 animate-pulse">
          Realtime
        </Badge>
      </div>

      <div className="p-5 flex-1 min-h-[380px]">
        <div className="h-full w-full">
          <Line data={data} options={options} />
        </div>
      </div>

    </div>
  )
}