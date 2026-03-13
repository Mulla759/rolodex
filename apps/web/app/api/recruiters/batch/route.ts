import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ids: string[] = body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  if (ids.length > 100) {
    return NextResponse.json({ error: "max 100 ids per request" }, { status: 400 });
  }

  const data = await db
    .select()
    .from(recruiters)
    .where(inArray(recruiters.id, ids));

  return NextResponse.json(data);
}
