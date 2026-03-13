import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { ilike, eq, sql, and, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const q = params.get("q")?.trim() || "";
  const company = params.get("company")?.trim() || "";
  const roles = params.getAll("role").filter(Boolean);
  const accolades = params.getAll("accolade").filter(Boolean);
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      sql`(${recruiters.name} ILIKE ${pattern} OR ${recruiters.company} ILIKE ${pattern} OR ${recruiters.email} ILIKE ${pattern})`
    );
  }

  if (company) {
    conditions.push(eq(recruiters.company, company));
  }

  if (roles.length > 0) {
    conditions.push(sql`${recruiters.roleTags} && ${roles}`);
  }

  if (accolades.length > 0) {
    conditions.push(sql`${recruiters.accolades} && ${accolades}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(recruiters)
      .where(where)
      .orderBy(recruiters.company, recruiters.name)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(recruiters)
      .where(where),
  ]);

  return NextResponse.json({
    data,
    count: total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
