import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { contributions } from "@rolodex/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recruiter_id, student_id, type, payload } = body;

    if (!recruiter_id || !student_id || !type || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: recruiter_id, student_id, type, payload" },
        { status: 400 },
      );
    }

    const validTypes = ["interaction", "profile_edit", "linkedin_url"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const [recruiter] = await db
      .select({ id: recruiters.id })
      .from(recruiters)
      .where(eq(recruiters.id, recruiter_id))
      .limit(1);

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter not found" },
        { status: 404 },
      );
    }

    const [inserted] = await db
      .insert(contributions)
      .values({
        recruiterId: recruiter_id,
        studentId: student_id,
        type,
        payload,
        status: "pending",
      })
      .returning({ id: contributions.id });

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
