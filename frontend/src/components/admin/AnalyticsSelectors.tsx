import { useState } from "react";

export interface SelectorOption {
  label: string;
  value: string;
}

interface AnalyticsSelectorsProps {
  entityTypes: SelectorOption[];
  entityType: string;
  setEntityType: (entityType: string) => void;

  entityIds: SelectorOption[];
  entityId: string;
  setEntityId: (entityId: string) => void;

  metricNames: SelectorOption[];
  metricName: string;
  setMetricName: (metricName: string) => void;

  intervalTypes: SelectorOption[];
  intervalType: string;
  setIntervalType: (intervalType: string) => void;

  from: string;
  to: string;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
}

export function AnalyticsSelectors({
  entityTypes,
  entityType,
  setEntityType,
  entityIds,
  entityId,
  setEntityId,
  metricNames,
  metricName,
  setMetricName,
  intervalTypes,
  intervalType,
  setIntervalType,
  from,
  to,
  setFrom,
  setTo,
}: AnalyticsSelectorsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block mb-1 text-xs text-muted-foreground">
          Entity Type
        </label>
        <select
          className="w-full border rounded px-2 py-1"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          {entityTypes.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 text-xs text-muted-foreground">
          Entity ID
        </label>
        <select
          className="w-full border rounded px-2 py-1"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
        >
          {entityIds.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 text-xs text-muted-foreground">
          Metric
        </label>
        <select
          className="w-full border rounded px-2 py-1"
          value={metricName}
          onChange={(e) => setMetricName(e.target.value)}
        >
          {metricNames.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 text-xs text-muted-foreground">
          Interval
        </label>
        <select
          className="w-full border rounded px-2 py-1"
          value={intervalType}
          onChange={(e) => setIntervalType(e.target.value)}
        >
          {intervalTypes.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 text-xs text-muted-foreground">From</label>
        <input
          type="date"
          className="w-full border rounded px-2 py-1"
          value={from.slice(0, 10)}
          onChange={(e) => setFrom(new Date(e.target.value).toISOString())}
        />
      </div>
      <div>
        <label className="block mb-1 text-xs text-muted-foreground">To</label>
        <input
          type="date"
          className="w-full border rounded px-2 py-1"
          value={to.slice(0, 10)}
          onChange={(e) => setTo(new Date(e.target.value).toISOString())}
        />
      </div>
    </div>
  );
}
