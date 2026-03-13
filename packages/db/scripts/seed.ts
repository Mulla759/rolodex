import { readFileSync } from "fs";
import { resolve } from "path";
import Papa from "papaparse";
import { db } from "../src/index";
import { recruiters } from "../src/schema";
import type { NewRecruiter } from "../src/types";

// ─────────────────────────────────────────────
// Seed script — Greenbox recruiter CSV
// Run: pnpm --filter @rolodex/db seed
//
// Input columns: Company, Name, Email, Date Appeared
// Expected: ~215 rows → ~190 clean inserts after dedupe + validation
// ─────────────────────────────────────────────

const CSV_PATH = resolve(process.cwd(), "../../data/Greenbox_recruiter_emails.csv");

interface RawRow {
  Company: string;
  Name: string;
  Email: string;
  "Date Appeared": string;
}

function normalizeCompany(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseSourceDate(raw: string): string | null {
  if (!raw?.trim()) return null;
  // format: M/D/YY or MM/DD/YY
  const [m, d, y] = raw.trim().split("/");
  if (!m || !d || !y) return null;
  const year = y.length === 2 ? `20${y}` : y;
  const month = m.padStart(2, "0");
  const day = d.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function seed() {
  let raw = readFileSync(CSV_PATH, "utf-8");
  // CSV has an empty first row — strip it so PapaParse picks up the real headers
  raw = raw.replace(/^[,\s]*\n/, "");

  const { data } = Papa.parse<RawRow>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const stats = { total: data.length, inserted: 0, skipped: 0, reasons: {} as Record<string, number> };
  const seen = new Set<string>();
  const rows: NewRecruiter[] = [];

  for (const row of data) {
    const email = row.Email?.trim().toLowerCase();
    const company = row.Company?.trim();

    if (!email || !isValidEmail(email)) {
      stats.skipped++;
      stats.reasons["invalid_email"] = (stats.reasons["invalid_email"] ?? 0) + 1;
      continue;
    }

    if (seen.has(email)) {
      stats.skipped++;
      stats.reasons["duplicate_email"] = (stats.reasons["duplicate_email"] ?? 0) + 1;
      continue;
    }

    if (!company) {
      stats.skipped++;
      stats.reasons["missing_company"] = (stats.reasons["missing_company"] ?? 0) + 1;
      continue;
    }

    seen.add(email);

    rows.push({
      company: normalizeCompany(company),
      name: row.Name?.trim() || null,
      email,
      sourceDate: parseSourceDate(row["Date Appeared"]),
      status: "active",
      accolades: [],
      roleTags: [],
      industryTags: [],
    });
  }

  // Bulk upsert — on email conflict, update source_date and updated_at
  if (rows.length > 0) {
    await db
      .insert(recruiters)
      .values(rows)
      .onConflictDoUpdate({
        target: recruiters.email,
        set: {
          sourceDate: rows[0].sourceDate, // drizzle handles per-row via sql``
          updatedAt: new Date(),
        },
      });
    stats.inserted = rows.length;
  }

  console.log("\n── Rolodex seed complete ──────────────────");
  console.log(`  Total rows:    ${stats.total}`);
  console.log(`  Inserted:      ${stats.inserted}`);
  console.log(`  Skipped:       ${stats.skipped}`);
  if (Object.keys(stats.reasons).length > 0) {
    console.log("  Skip reasons:");
    for (const [reason, count] of Object.entries(stats.reasons)) {
      console.log(`    ${reason}: ${count}`);
    }
  }
  console.log("───────────────────────────────────────────\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
