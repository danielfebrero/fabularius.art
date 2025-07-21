import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { enUS } from "date-fns/locale";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  TimeScale
);

type SeriesPoint = {
  window_start: string;
  window_end: string;
  value: number;
  meta?: any;
};

interface AnalyticsChartProps {
  series: SeriesPoint[];
  label?: string;
  loading?: boolean;
  unit?:
    | "millisecond"
    | "second"
    | "minute"
    | "hour"
    | "day"
    | "week"
    | "month"
    | "quarter"
    | "year";
}

export function AnalyticsChart({
  series,
  label = "Value",
  loading,
  unit = "day",
}: AnalyticsChartProps) {
  const data = {
    labels: series.map((pt) => pt.window_start),
    datasets: [
      {
        label,
        data: series.map((pt) => pt.value),
        fill: false,
        borderColor: "#6366f1",
        backgroundColor: "#6366f1",
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: unit,
        },
        adapters: {
          date: {
            locale: enUS,
          },
        },
        title: {
          display: true,
          text: "Time window",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: label,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading chart…</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] bg-card rounded-lg p-4 shadow-sm">
      <Line data={data} options={options} />
    </div>
  );
}
