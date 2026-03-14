import { NextRequest, NextResponse } from "next/server";
import { db, recruiters, contributions } from "@rolodex/db";
import { CONTRIBUTION_TYPES } from "@rolodex/db/constants";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { recruiter_id, type, payload, student_id } = body as Record<string, unknown>;

  // Validate student_id
  if (typeof student_id !== "string" || !student_id.trim()) {
    return NextResponse.json({ error: "student_id is required" }, { status: 400 });
  }

  // Validate type
  if (!CONTRIBUTION_TYPES.includes(type as typeof CONTRIBUTION_TYPES[number])) {
    return NextResponse.json(
      { error: `type must be one of: ${CONTRIBUTION_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate payload is a valid JSON string
  if (typeof payload !== "string") {
    return NextResponse.json({ error: "payload must be a JSON string" }, { status: 400 });
  }
  try {
    JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "payload is not valid JSON" }, { status: 400 });
  }

  // Validate recruiter_id exists
  if (typeof recruiter_id !== "string") {
    return NextResponse.json({ error: "recruiter_id is required" }, { status: 400 });
  }

  const [recruiter] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.id, recruiter_id))
    .limit(1);

  if (!recruiter) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const [inserted] = await db
    .insert(contributions)
    .values({
      recruiterId: recruiter_id,
      studentId: student_id.trim(),
      type: type as string,
      payload,
      status: "pending",
    })
    .returning({ id: contributions.id, status: contributions.status });

  return NextResponse.json(inserted, { status: 201 });
}
