// Entry point for Analytics Snapshot aggregation Lambda
// - Discovers and runs all registered metric/entity/interval aggregators
// - Writes snapshot rows to DynamoDB according to schema
// - Designed for extension: add new metrics/entities via modules in `metrics/`
//
// DynamoDB Table: AnalyticsSnapshots (schema below)
//
// PK: ENTITY#{entity_type}#{entity_id}#METRIC#{metric_name}
// SK: INTERVAL#{interval_type}#{timestamp}
// Attributes: value, window_start, window_end, meta
//
// @see metrics/README.md for documentation on adding new metric modules

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { MetricAggregator, AggregatorRegistry, SnapshotRow } from "./metrics";

// Config: Table name
const ANALYTICS_SNAPSHOTS_TABLE =
  process.env.ANALYTICS_SNAPSHOTS_TABLE || "AnalyticsSnapshots";

// DynamoDB client — expects credentials/environment to be set up externally
const ddb = new DynamoDBClient({});

// Helper: Write a single snapshot row to DynamoDB
export async function writeSnapshot(row: SnapshotRow) {
  await ddb.send(
    new PutItemCommand({
      TableName: ANALYTICS_SNAPSHOTS_TABLE,
      Item: {
        PK: {
          S: `ENTITY#${row.entity_type}#${row.entity_id}#METRIC#${row.metric_name}`,
        },
        SK: { S: `INTERVAL#${row.interval_type}#${row.timestamp}` },
        value: { N: row.value.toString() },
        window_start: { S: row.window_start },
        window_end: { S: row.window_end },
        meta: { S: JSON.stringify(row.meta ?? {}) },
      },
    })
  );
}

// Handler: Invoked by scheduler (assume hourly, but supports param for flexibility)
export async function handler(event: any = {}, context: any = {}) {
  // Determine interval type and time window
  const interval_type = event.interval_type || "hour";
  const now = new Date();
  // Compute window_start, window_end (UTC ISO 8601)
  const window_end = now.toISOString();
  let window_start: string;
  if (interval_type === "hour") {
    window_start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  } else {
    throw new Error("Unsupported interval type: " + interval_type);
  }

  // Discover and run all aggregators
  const aggregators = AggregatorRegistry.getAll();

  for (const aggregator of aggregators) {
    const results = await aggregator.compute({
      window_start,
      window_end,
      interval_type,
    });
    for (const snapshot of results) {
      await writeSnapshot({
        ...snapshot,
        window_start,
        window_end,
        interval_type,
        timestamp: window_end,
      });
    }
  }

  return { written: aggregators.length };
}

// Lambda bootstrap (for testing outside AWS)
if (require.main === module) {
  handler()
    .then((r) => {
      console.log("Aggregation Lambda ran successfully:", r);
    })
    .catch((e) => {
      console.error("Aggregation Lambda failed:", e);
      process.exit(1);
    });
}
