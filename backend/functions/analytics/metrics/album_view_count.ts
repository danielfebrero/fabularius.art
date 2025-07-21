// Example metric aggregator: Album View Count (hourly)
// Demonstrates the aggregator module pattern for analytics snapshots infrastructure
//
// To add new metrics/entities, copy this file and adjust for your use-case.
// Each aggregator must:
//  - Extend MetricAggregator
//  - Set a unique `name` property (e.g. 'album_view_count')
//  - Implement async `compute(ctx)` returning SnapshotRow[] for the window
//  - Register itself with AggregatorRegistry at module scope
//
// Simulates counting all album views across all albums for the window.

import {
  MetricAggregator,
  AggregatorRegistry,
  AggregationContext,
  SnapshotRow,
} from "./index";

// Simulate album IDs & metric with stubbed data (replace with real DB/query in production)
const albumIds = ["album1", "album2"];

class AlbumViewCountAggregator extends MetricAggregator {
  name = "album_view_count";

  // Compute total view count for all albums in the given window.
  async compute(ctx: AggregationContext): Promise<SnapshotRow[]> {
    // Replace this section with real data aggregation/query logic
    return albumIds.map((albumId) => ({
      entity_type: "album",
      entity_id: albumId,
      metric_name: "view_count",
      value: Math.floor(Math.random() * 500), // Simulated view count for demo
      window_start: ctx.window_start,
      window_end: ctx.window_end,
      interval_type: ctx.interval_type,
      timestamp: ctx.window_end,
      meta: { simulated: true },
    }));
  }
}

// Register on module load (required for discovery)
AggregatorRegistry.register(new AlbumViewCountAggregator());
