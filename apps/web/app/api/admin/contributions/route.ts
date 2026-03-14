import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { contributions } from "@rolodex/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");

    const query = db
      .select({
        id: contributions.id,
        recruiter_id: contributions.recruiterId,
        student_id: contributions.studentId,
        type: contributions.type,
        payload: contributions.payload,
        status: contributions.status,
        notes: contributions.notes,
        created_at: contributions.createdAt,
        reviewed_at: contributions.reviewedAt,
        reviewed_by: contributions.reviewedBy,
        recruiter_email: recruiters.email,
        recruiter_company: recruiters.company,
      })
      .from(contributions)
      .leftJoin(recruiters, eq(contributions.recruiterId, recruiters.id))
      .orderBy(desc(contributions.createdAt));

    const rows =
      status && status !== "all"
        ? await query.where(eq(contributions.status, status))
        : await query;

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
