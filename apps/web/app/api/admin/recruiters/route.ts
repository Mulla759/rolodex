import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { recruiterMetrics } from "@rolodex/db/schema";
import { eq, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const company = req.nextUrl.searchParams.get("company")?.trim();

    const query = db
      .select({
        id: recruiters.id,
        company: recruiters.company,
        name: recruiters.name,
        email: recruiters.email,
        title: recruiters.title,
        linkedin_url: recruiters.linkedinUrl,
        location: recruiters.location,
        status: recruiters.status,
        verified_at: recruiters.verifiedAt,
        accolades: recruiters.accolades,
        interaction_count: recruiterMetrics.interactionCount,
      })
      .from(recruiters)
      .leftJoin(recruiterMetrics, eq(recruiters.id, recruiterMetrics.recruiterId))
      .orderBy(recruiters.company, recruiters.name);

    const rows = company
      ? await query.where(ilike(recruiters.company, `%${company}%`))
      : await query;

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
