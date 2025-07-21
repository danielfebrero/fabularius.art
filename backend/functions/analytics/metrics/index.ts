// Core types, registry, and auto-discovery for analytics metric aggregators
//
// To extend: add new aggregator modules in this directory, and export in this index.
// Registry will auto-discover all aggregators on import.
//
// See README.md in this directory for extensibility instructions.

export type SnapshotRow = {
  entity_type: string; // e.g. 'album', 'user', etc
  entity_id: string; // unique ID of the entity
  metric_name: string; // e.g. 'view_count', 'total_likes'
  value: number; // computed metric value for this window
  window_start: string; // ISO 8601 UTC - window start
  window_end: string; // ISO 8601 UTC - window end
  interval_type: string; // e.g. 'hour', 'day'
  timestamp: string; // window_end - canonical timestamp for snapshot
  meta?: Record<string, any>; // optional metadata
};

// Context passed to all aggregators during Lambda invocation
export type AggregationContext = {
  window_start: string;
  window_end: string;
  interval_type: string;
};

// Abstract base for all metric aggregators
export abstract class MetricAggregator {
  // Unique name for this aggregator, e.g. 'album_view_count'
  abstract name: string;
  // Compute and return zero or more SnapshotRows for this interval/window.
  // Each SnapshotRow must match target entity, metric, and interval.
  abstract compute(ctx: AggregationContext): Promise<SnapshotRow[]>;
}

// Registry auto-discovers and tracks all aggregator modules
export class AggregatorRegistry {
  private static registry: MetricAggregator[] = [];

  static register(instance: MetricAggregator) {
    AggregatorRegistry.registry.push(instance);
  }

  static getAll(): MetricAggregator[] {
    return AggregatorRegistry.registry;
  }
}

// --- AUTO-IMPORT ALL METRIC MODULES HERE ---
// Add new metric/entity aggregators by creating new .ts files in this directory
// and importing them below. Each module must self-register with the registry.

import "./album_view_count";

// Example: Add `import './user_activity_metric'` here for a new metric
