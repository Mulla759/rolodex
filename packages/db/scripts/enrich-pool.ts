import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull, and, sql } from "drizzle-orm";
import * as schema from "../src/schema";
import {
  fetchLinkedInProfile,
  searchByEmail,
} from "../src/enrichment/proxycurl";
import { extractRecruiterSignals } from "../src/enrichment/extract-signals";

if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env.local") });
}
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), "../../apps/web/.env.local") });
}

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const PROGRESS_FILE = resolve(import.meta.dirname ?? __dirname, "../.enrich-progress.json");
const COST_PER_LOOKUP = 0.01;

interface ProgressData {
  lastRun: string;
  processed: string[];
  failed: string[];
  totalEnriched: number;
}

function loadProgress(): ProgressData {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
    } catch {
      /* corrupted file — start fresh */
    }
  }
  return { lastRun: "", processed: [], failed: [], totalEnriched: 0 };
}

function saveProgress(progress: ProgressData) {
  progress.lastRun = new Date().toISOString();
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 50;
  let concurrency = 3;
  let company: string | undefined;
  let delay = 2000;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--limit":
        limit = parseInt(args[++i], 10);
        break;
      case "--concurrency":
        concurrency = Math.min(10, Math.max(1, parseInt(args[++i], 10)));
        break;
      case "--company":
        company = args[++i];
        break;
      case "--delay":
        delay = parseInt(args[++i], 10);
        break;
      case "--dry-run":
        dryRun = true;
        break;
    }
  }

  return { limit, concurrency, company, delay, dryRun };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type RecruiterRow = typeof schema.recruiters.$inferSelect;

async function enrichOne(
  recruiter: RecruiterRow,
  dryRun: boolean
): Promise<{ email: string; success: boolean; nameUpdated: boolean }> {
  let profile = recruiter.linkedinUrl
    ? await fetchLinkedInProfile(recruiter.linkedinUrl)
    : await searchByEmail(recruiter.email);

  if (!profile) {
    console.log(`  ⊘ ${recruiter.email} — no LinkedIn data found`);
    return { email: recruiter.email, success: false, nameUpdated: false };
  }

  const signals = await extractRecruiterSignals(profile, recruiter.company);

  const shouldUpdateName = recruiter.name === null && profile.full_name !== null;

  if (dryRun) {
    console.log(`  [DRY RUN] ${recruiter.email}:`);
    console.log(`    role_tags: [${signals.role_tags.join(", ")}]`);
    console.log(`    accolades: [${signals.accolades.join(", ")}]`);
    console.log(`    industry_tags: [${signals.industry_tags.join(", ")}]`);
    console.log(`    title: ${signals.title}`);
    console.log(`    location: ${signals.location}`);
    if (shouldUpdateName) {
      console.log(`    name: null → ${profile.full_name}`);
    }
    console.log(`    teams: ${signals.teams.length} team(s)`);
    return { email: recruiter.email, success: true, nameUpdated: shouldUpdateName };
  }

  const updateFields: Record<string, unknown> = {
    roleTags: signals.role_tags,
    accolades: signals.accolades,
    industryTags: signals.industry_tags,
    title: signals.title,
    location: signals.location,
    rawLinkedin: JSON.stringify(profile),
    verifiedAt: sql`now()`,
  };

  if (shouldUpdateName) {
    updateFields.name = profile.full_name;
    console.log(`    name: null → ${profile.full_name}`);
  }

  await db
    .update(schema.recruiters)
    .set(updateFields)
    .where(eq(schema.recruiters.id, recruiter.id));

  for (const team of signals.teams) {
    await db.insert(schema.recruiterTeams).values({
      recruiterId: recruiter.id,
      teamName: team.team_name,
      company: recruiter.company,
      techTags: team.tech_tags,
      levelRange: team.level_range,
      source: team.source,
    });
  }

  console.log(
    `  ✓ ${recruiter.email} → name: ${recruiter.name ?? profile.full_name ?? "?"}, roles: [${signals.role_tags.join(", ")}]`
  );

  return { email: recruiter.email, success: true, nameUpdated: shouldUpdateName };
}

async function main() {
  const { limit, concurrency, company, delay, dryRun } = parseArgs();

  console.log(
    `Pooled enrichment: limit=${limit}, concurrency=${concurrency}, delay=${delay}ms, company=${company ?? "all"}, dry-run=${dryRun}`
  );

  const progress = loadProgress();
  const alreadyProcessed = new Set(progress.processed);

  const conditions = [
    isNull(schema.recruiters.verifiedAt),
    eq(schema.recruiters.status, "active"),
  ];

  if (company) {
    conditions.push(eq(schema.recruiters.company, company));
  }

  const allRows = await db
    .select()
    .from(schema.recruiters)
    .where(and(...conditions))
    .orderBy(schema.recruiters.createdAt)
    .limit(limit);

  const rows = allRows.filter((r) => !alreadyProcessed.has(r.email));
  const skipped = allRows.length - rows.length;

  console.log(`Found ${allRows.length} recruiters to enrich (${skipped} already processed, ${rows.length} remaining)\n`);

  let enriched = 0;
  let failed = 0;
  let lookups = 0;

  for (let i = 0; i < rows.length; i += concurrency) {
    const batch = rows.slice(i, i + concurrency);
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(rows.length / concurrency);

    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} recruiters)`);

    const results = await Promise.allSettled(
      batch.map((r) => enrichOne(r, dryRun))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      lookups++;

      if (result.status === "fulfilled" && result.value.success) {
        enriched++;
        progress.processed.push(result.value.email);
      } else if (result.status === "rejected") {
        failed++;
        const email = batch[j].email;
        progress.failed.push(email);
        console.log(`  ✗ ${email} → ${result.reason?.message ?? result.reason}`);
      } else {
        failed++;
        progress.failed.push(results[j].status === "fulfilled" ? (results[j] as PromiseFulfilledResult<{ email: string }>).value.email : batch[j].email);
      }
    }

    if (!dryRun) {
      progress.totalEnriched += enriched;
      saveProgress(progress);
    }

    if (i + concurrency < rows.length) {
      console.log(`  waiting ${delay}ms before next batch...\n`);
      await sleep(delay);
    }
  }

  const cost = (lookups * COST_PER_LOOKUP).toFixed(2);
  console.log(`\n─── Summary ───`);
  console.log(`Enriched: ${enriched} | Failed: ${failed} | Skipped (already done): ${skipped}`);
  console.log(`Estimated cost: $${cost} at $${COST_PER_LOOKUP}/lookup`);

  if (!dryRun) {
    saveProgress(progress);
  }
}

main().catch((err) => {
  console.error("Pooled enrichment failed:", err);
  process.exit(1);
});
