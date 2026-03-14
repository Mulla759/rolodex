import { config } from "dotenv";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// In Next.js, .env.local is loaded automatically.
// For standalone scripts (seed, migrate), load dotenv manually.
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env.local") });
}
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), "../../.env.local") });
}

// ─────────────────────────────────────────────
// db client
// Use this everywhere — never import neon directly in apps/web.
// In Next.js, DATABASE_URL is a server-only env var (no NEXT_PUBLIC_ prefix).
// ─────────────────────────────────────────────
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// re-export schema and types for convenience
export * from "./schema";
export * from "./types";
export type { ProxycurlProfile } from "./enrichment/proxycurl";
