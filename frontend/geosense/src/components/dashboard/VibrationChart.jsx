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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

export default function VibrationChart() {
  const data = {
    labels: ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25"],

    datasets: [
      {
        label: "Frekuensi Getaran",
        data: [2.3, 2.8, 2.1, 3.4, 2.9, 2.5],

        borderColor: "#2F6690",
        backgroundColor: "#81C3D7",

        borderWidth: 2,

        tension: 0.4,

        pointRadius: 3,

        pointBackgroundColor: "#2F6690",
      },
    ],
  }

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,

        grid: {
          color: "#E7EBEE",
        },

        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <Card className="rounded-xl border border-brand-border bg-white shadow-sm">

      <CardHeader className="flex h-20 flex-row items-center justify-between border-b border-brand-border">

        <div>

          <CardTitle className="text-lg font-semibold text-brand-dark">
            Grafik Getaran
          </CardTitle>

          <p className="mt-1 text-sm text-brand-secondary">
            Data getaran sensor dalam 30 menit terakhir.
          </p>

        </div>

        <Badge
          variant="outline"
          className="border-brand-primary text-brand-primary"
        >
          Realtime
        </Badge>

      </CardHeader>

      <CardContent className="h-[360px] p-5">

        <Line
          data={data}
          options={options}
        />

      </CardContent>

    </Card>
  )
}