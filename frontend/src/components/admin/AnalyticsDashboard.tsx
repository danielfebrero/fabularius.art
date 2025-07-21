"use client";
import { useEffect, useState } from "react";
import { adminAnalyticsApi } from "@/lib/api";
import { AnalyticsChart } from "./AnalyticsChart";
import { AnalyticsSelectors, SelectorOption } from "./AnalyticsSelectors";

// Defaults and sample configs
const DEFAULT_ENTITY_TYPE = "album";
const DEFAULT_METRIC = "views";
const DEFAULT_INTERVAL = "hour";
const DEFAULT_DAYS = 14;

const entityTypeOptions: SelectorOption[] = [
  { label: "Album", value: "album" },
  // Add more entities here
];

const metricOptions: Record<string, SelectorOption[]> = {
  album: [
    { label: "Views", value: "views" },
    // Add more metrics for albums here
  ],
  // Add more entity->metric mapping here
};

const intervalTypeOptions: SelectorOption[] = [
  { label: "Hourly", value: "hour" },
  { label: "Daily", value: "day" },
  // Add more if supported
];

// Dummy for demo: In real case, could fetch from backend or context
const albumIdOptions: SelectorOption[] = [
  { label: "All Albums", value: "all" },
  { label: "Album 1", value: "demo-album-1" },
  { label: "Album 2", value: "demo-album-2" },
];

function getDateISOStringNDaysAgo(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function AnalyticsDashboard() {
  // State
  const [entityType, setEntityType] = useState(DEFAULT_ENTITY_TYPE);
  const [entityId, setEntityId] = useState("all");
  const [metricName, setMetricName] = useState(DEFAULT_METRIC);
  const [intervalType, setIntervalType] = useState(DEFAULT_INTERVAL);

  // Date range: last 14 days default
  const [from, setFrom] = useState(getDateISOStringNDaysAgo(DEFAULT_DAYS));
  const [to, setTo] = useState(new Date().toISOString());

  const [series, setSeries] = useState<
    { window_start: string; window_end: string; value: number; meta?: any }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When any input changes, fetch data
  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await adminAnalyticsApi.query({
          entityType,
          entityId,
          metricName,
          intervalType,
          from,
          to,
        });
        setSeries(result.series || []);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
        setSeries([]);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [entityType, entityId, metricName, intervalType, from, to]);

  // For extensibility, support dynamic id/metric options
  const entityIds =
    entityType === "album" ? albumIdOptions : [{ label: "All", value: "all" }];
  const metrics = metricOptions[entityType] || [];

  return (
    <section className="mt-8 mb-8 p-6 bg-muted rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Analytics Dashboard</h2>
      <AnalyticsSelectors
        entityTypes={entityTypeOptions}
        entityType={entityType}
        setEntityType={setEntityType}
        entityIds={entityIds}
        entityId={entityId}
        setEntityId={setEntityId}
        metricNames={metrics}
        metricName={metricName}
        setMetricName={setMetricName}
        intervalTypes={intervalTypeOptions}
        intervalType={intervalType}
        setIntervalType={setIntervalType}
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
      />
      {error ? (
        <div className="text-red-500 mb-4">{error}</div>
      ) : (
        <AnalyticsChart
          series={series}
          label={
            metrics.find((m) => m.value === metricName)?.label || metricName
          }
          loading={loading}
        />
      )}
    </section>
  );
}
