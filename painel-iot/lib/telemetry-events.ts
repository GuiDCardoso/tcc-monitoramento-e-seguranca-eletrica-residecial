import { Pool } from "pg";
import type { PoolClient } from "pg";

const CHANNEL = "voltguard_telemetry";
const globalForTelemetry = globalThis as typeof globalThis & {
  telemetryPublishPool?: Pool;
  telemetrySubscribePool?: Pool;
};

function getTelemetryPool(kind: "publish" | "subscribe"): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não está configurada para eventos em tempo real.");
  }

  if (kind === "publish") {
    globalForTelemetry.telemetryPublishPool ??= new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,
      connectionTimeoutMillis: 10_000,
      application_name: "voltguard-telemetry-publisher",
    });
    return globalForTelemetry.telemetryPublishPool;
  }

  globalForTelemetry.telemetrySubscribePool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    connectionTimeoutMillis: 10_000,
    application_name: "voltguard-telemetry-sse",
  });
  return globalForTelemetry.telemetrySubscribePool;
}

export async function publishReadingUpdate(usuarioId: string): Promise<void> {
  await getTelemetryPool("publish").query("SELECT pg_notify($1, $2)", [CHANNEL, usuarioId]);
}

export async function subscribeToReadingUpdates(): Promise<{
  client: PoolClient;
  channel: string;
}> {
  const client = await getTelemetryPool("subscribe").connect();
  try {
    await client.query(`LISTEN ${CHANNEL}`);
    return { client, channel: CHANNEL };
  } catch (error) {
    client.release();
    throw error;
  }
}
