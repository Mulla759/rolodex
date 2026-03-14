import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { contributions, recruiterMetrics } from "@rolodex/db/schema";
import { eq, sql, and, count as drizzleCount } from "drizzle-orm";

async function recalculateMetrics(recruiterId: string) {
  const approved = await db
    .select({
      total: drizzleCount(),
    })
    .from(contributions)
    .where(
      and(
        eq(contributions.recruiterId, recruiterId),
        eq(contributions.type, "interaction"),
        eq(contributions.status, "approved"),
      ),
    );

  const interactionCount = approved[0]?.total ?? 0;

  const interactions = await db
    .select({ payload: contributions.payload })
    .from(contributions)
    .where(
      and(
        eq(contributions.recruiterId, recruiterId),
        eq(contributions.type, "interaction"),
        eq(contributions.status, "approved"),
      ),
    );

  let totalReplied = 0;
  let totalDays = 0;
  let repliedCount = 0;
  let placedCount = 0;

  for (const row of interactions) {
    try {
      const p = JSON.parse(row.payload);
      if (p.did_reply) {
        totalReplied++;
        if (p.reply_days != null) {
          totalDays += p.reply_days;
          repliedCount++;
        }
      }
      if (p.got_offer) placedCount++;
    } catch {
      // skip malformed payloads
    }
  }

  const responseRate =
    interactionCount > 0
      ? ((totalReplied / interactionCount) * 100).toFixed(2)
      : null;
  const avgReplyDays =
    repliedCount > 0 ? (totalDays / repliedCount).toFixed(1) : null;

  await db
    .insert(recruiterMetrics)
    .values({
      recruiterId,
      responseRate: responseRate,
      avgReplyDays: avgReplyDays,
      studentsPlaced: placedCount,
      interactionCount: interactionCount,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: recruiterMetrics.recruiterId,
      set: {
        responseRate: sql`excluded.response_rate`,
        avgReplyDays: sql`excluded.avg_reply_days`,
        studentsPlaced: sql`excluded.students_placed`,
        interactionCount: sql`excluded.interaction_count`,
        lastUpdated: sql`excluded.last_updated`,
      },
    });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 },
      );
    }

    const [contribution] = await db
      .select()
      .from(contributions)
      .where(eq(contributions.id, id))
      .limit(1);

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 },
      );
    }

    await db
      .update(contributions)
      .set({
        status,
        notes: notes ?? null,
        reviewedAt: new Date(),
        reviewedBy: "admin",
      })
      .where(eq(contributions.id, id));

    if (status === "approved") {
      if (contribution.type === "interaction") {
        await recalculateMetrics(contribution.recruiterId);
      } else if (contribution.type === "profile_edit") {
        try {
          const payload = JSON.parse(contribution.payload);
          const updates: Record<string, unknown> = {};
          if (payload.name) updates.name = payload.name;
          if (payload.title) updates.title = payload.title;
          if (payload.location) updates.location = payload.location;
          if (payload.linkedin_url) updates.linkedinUrl = payload.linkedin_url;

          if (Object.keys(updates).length > 0) {
            await db
              .update(recruiters)
              .set(updates)
              .where(eq(recruiters.id, contribution.recruiterId));
          }
        } catch {
          // skip malformed payload
        }
      } else if (contribution.type === "linkedin_url") {
        try {
          const payload = JSON.parse(contribution.payload);
          if (payload.linkedin_url) {
            await db
              .update(recruiters)
              .set({ linkedinUrl: payload.linkedin_url })
              .where(eq(recruiters.id, contribution.recruiterId));
          }
        } catch {
          // skip malformed payload
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
