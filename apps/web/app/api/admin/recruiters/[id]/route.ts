import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = [
      "name",
      "title",
      "location",
      "linkedin_url",
      "status",
      "accolades",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        const dbField =
          field === "linkedin_url" ? "linkedinUrl" : field;
        updates[dbField] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(recruiters)
      .set(updates)
      .where(eq(recruiters.id, id))
      .returning({ id: recruiters.id });

    if (!updated) {
      return NextResponse.json(
        { error: "Recruiter not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
