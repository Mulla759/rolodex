import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env.local") });

const url = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL_DIRECT;

if (!url) {
  throw new Error(
    "Missing database URL. Set DRIZZLE_DATABASE_URL or DATABASE_URL_DIRECT in D:\\rolodex\\.env.local"
  );
}

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
} satisfies Config;