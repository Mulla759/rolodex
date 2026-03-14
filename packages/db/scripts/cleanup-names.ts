import "dotenv/config";
import { db } from "../src/index";
import { recruiters } from "../src/schema";
import { isNotNull, eq } from "drizzle-orm";

async function cleanup() {
  const rows = await db
    .select({ id: recruiters.id, name: recruiters.name, company: recruiters.company })
    .from(recruiters)
    .where(isNotNull(recruiters.name));

  let fixed = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name!;
    const nLower = name.toLowerCase();
    const cLower = row.company.toLowerCase();

    if (cLower.includes(nLower) || nLower.includes(cLower)) {
      await db
        .update(recruiters)
        .set({ name: null, updatedAt: new Date() })
        .where(eq(recruiters.id, row.id));
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log("\n── Name cleanup complete ──────────────────");
  console.log(`  Total checked: ${rows.length}`);
  console.log(`  Fixed:         ${fixed} records`);
  console.log(`  Skipped:       ${skipped} records`);
  console.log("───────────────────────────────────────────\n");
  process.exit(0);
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
