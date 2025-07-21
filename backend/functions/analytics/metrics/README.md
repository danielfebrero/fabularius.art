# Analytics Metric Aggregators

This directory contains pluggable analytics metric/entity aggregators for the Lambda snapshot pipeline. Each module here implements a metric (e.g. view count, engagement, etc) for a particular entity type and interval.

## How It Works

- **Auto-discovery:** All `.ts` files in this directory that define an aggregator module and register it in the `AggregatorRegistry` will be auto-imported by the pipeline.
- **Base class:** Extend `MetricAggregator` and implement the required `compute` method to calculate and return snapshots for the window.
- **Registration:** Each aggregator must register a singleton instance with the registry at module scope.
- **No manual config:** Only import your module in `index.ts` (see comment at bottom of `index.ts`). The registry collects all aggregators before the Lambda runs.

## Adding a New Metric or Entity

1. Copy the example file [`album_view_count.ts`](./album_view_count.ts) and rename it, e.g. `user_active_count.ts`.
2. Update the class name, `name`, `entity_type`, `metric_name` and compute logic as needed.
3. Register your aggregator as shown (`AggregatorRegistry.register(new MyAggregator())`).
4. Import your new file in `index.ts`, e.g. `import './user_active_count';`
5. Done — the Lambda will auto-discover and execute your aggregator at the next run.

### Example: Add a User Active Count Metric

```ts
// backend/functions/analytics/metrics/user_active_count.ts
import {
  MetricAggregator,
  AggregatorRegistry,
  AggregationContext,
  SnapshotRow,
} from "./index";

class UserActiveCountAggregator extends MetricAggregator {
  name = "user_active_count";

  async compute(ctx: AggregationContext): Promise<SnapshotRow[]> {
    // Replace this with your own data lookup logic
    return [
      {
        entity_type: "user",
        entity_id: "all", // or split by user id if needed
        metric_name: "active_count",
        value: 100, // e.g., number of active users in window
        window_start: ctx.window_start,
        window_end: ctx.window_end,
        interval_type: ctx.interval_type,
        timestamp: ctx.window_end,
        meta: { simulated: true },
      },
    ];
  }
}
// Register so it is auto-discovered:
AggregatorRegistry.register(new UserActiveCountAggregator());
```

Then add:

```ts
import "./user_active_count";
```

to [`index.ts`](./index.ts).

## Snapshot Row Schema

Each aggregator must return objects of shape:

```ts
{
  entity_type: string;    // e.g. 'album', 'user'
  entity_id: string;      // unique ID of entity
  metric_name: string;    // e.g. 'view_count'
  value: number;          // computed value
  window_start: string;   // ISO 8601
  window_end: string;     // ISO 8601
  interval_type: string;  // e.g. 'hour'
  timestamp: string;      // use window_end as canonical time
  meta?: Record<string, any>;
}
```

## AnalyticsSnapshots DynamoDB Table Schema

- **PK:** `ENTITY#{entity_type}#{entity_id}#METRIC#{metric_name}`
- **SK:** `INTERVAL#{interval_type}#{timestamp}`
- **Attributes:** `value`, `window_start`, `window_end`, `meta`

No manual management is needed; all logic is in aggregator modules.
