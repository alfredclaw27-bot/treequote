import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const results: Record<string, { success: boolean; error?: string; latency?: number }> = {};

  const projects = [
    {
      name: "dozuki-stepper",
      host: "db.knahrdqvhilvcluonnxg.supabase.co",
      password: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
    {
      name: "timecard-tracker",
      host: "db.ylvrenvbvnpomslkikru.supabase.co",
      password: "MJU&76yhnbv3u3u",
    },
  ];

  for (const proj of projects) {
    const start = Date.now();
    const pool = new Pool({
      host: proj.host,
      port: 5432,
      user: "postgres",
      password: proj.password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 8000,
    });

    try {
      const client = await pool.connect();
      const result = await client.query("SELECT 1 as test, version() as pg_version");
      client.release();
      results[proj.name] = { success: true, latency: Date.now() - start };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results[proj.name] = { success: false, error: msg.substring(0, 100) };
    } finally {
      await pool.end().catch(() => {});
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}
