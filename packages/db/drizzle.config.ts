import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL_DIRECT!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
