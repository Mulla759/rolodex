import { NextRequest, NextResponse } from "next/server";
import { db, recruiters, recruiterTeams } from "@rolodex/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid recruiter ID" }, { status: 400 });
  }

  const [recruiter] = await db
    .select()
    .from(recruiters)
    .where(eq(recruiters.id, id))
    .limit(1);

  if (!recruiter) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const teams = await db
    .select()
    .from(recruiterTeams)
    .where(eq(recruiterTeams.recruiterId, id));

  return NextResponse.json({ data: { ...recruiter, teams } });
}
