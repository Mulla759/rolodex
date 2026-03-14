import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull, isNotNull, and, sql } from "drizzle-orm";
import * as schema from "../src/schema";
import { fetchLinkedInProfile } from "../src/enrichment/proxycurl";
import { extractRecruiterSignals } from "../src/enrichment/extract-signals";

if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env.local") });
}
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), "../../apps/web/.env.local") });
}

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 10;
  let company: string | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--company" && args[i + 1]) {
      company = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, company, dryRun };
}

async function main() {
  const { limit, company, dryRun } = parseArgs();

  console.log(
    `Enrichment run: limit=${limit}, company=${company ?? "all"}, dry-run=${dryRun}`
  );

  const conditions = [
    isNull(schema.recruiters.verifiedAt),
    isNotNull(schema.recruiters.linkedinUrl),
  ];

  if (company) {
    conditions.push(eq(schema.recruiters.company, company));
  }

  const rows = await db
    .select()
    .from(schema.recruiters)
    .where(and(...conditions))
    .limit(limit);

  console.log(`Found ${rows.length} recruiters to enrich`);

  let enriched = 0;

  for (const recruiter of rows) {
    const linkedinUrl = recruiter.linkedinUrl!;

    const profile = await fetchLinkedInProfile(linkedinUrl);
    if (!profile) {
      console.log(`No LinkedIn data for ${recruiter.email}`);
      continue;
    }

    const signals = await extractRecruiterSignals(
      profile,
      recruiter.company
    );

    if (dryRun) {
      console.log(`[DRY RUN] Would update ${recruiter.email}:`);
      console.log(`  role_tags: [${signals.role_tags.join(", ")}]`);
      console.log(`  accolades: [${signals.accolades.join(", ")}]`);
      console.log(`  industry_tags: [${signals.industry_tags.join(", ")}]`);
      console.log(`  title: ${signals.title}`);
      console.log(`  location: ${signals.location}`);
      console.log(`  teams: ${signals.teams.length} team(s)`);
      for (const team of signals.teams) {
        console.log(
          `    - ${team.team_name} [${team.tech_tags.join(", ")}] ${team.level_range ?? ""}`
        );
      }
      enriched++;
      continue;
    }

    await db
      .update(schema.recruiters)
      .set({
        roleTags: signals.role_tags,
        accolades: signals.accolades,
        industryTags: signals.industry_tags,
        title: signals.title,
        location: signals.location,
        rawLinkedin: JSON.stringify(profile),
        verifiedAt: sql`now()`,
      })
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
      `Enriched ${recruiter.email} → ${signals.role_tags.length} roles, ${signals.accolades.length} accolades, ${signals.teams.length} teams`
    );
    enriched++;
  }

  console.log(`\nEnriched ${enriched}/${rows.length} recruiters`);
}

main().catch((err) => {
  console.error("Enrichment failed:", err);
  process.exit(1);
});
