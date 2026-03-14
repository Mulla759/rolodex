import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@rolodex/db";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [recruiter] = await db
      .select({
        id: recruiters.id,
        linkedinUrl: recruiters.linkedinUrl,
        name: recruiters.name,
        title: recruiters.title,
        location: recruiters.location,
      })
      .from(recruiters)
      .where(eq(recruiters.id, id))
      .limit(1);

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter not found" },
        { status: 404 },
      );
    }

    if (!recruiter.linkedinUrl) {
      return NextResponse.json(
        { error: "No LinkedIn URL to enrich from" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_AI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const prompt = `Given this LinkedIn profile URL: ${recruiter.linkedinUrl}

Extract the following information for a recruiter profile. Return ONLY a JSON object with these fields:
- name: full name (string or null)
- title: job title (string or null)  
- location: city, state or city, country (string or null)

If you cannot determine a field, set it to null. Return ONLY valid JSON, no markdown.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!geminiRes.ok) {
      return NextResponse.json(
        { error: "Gemini API call failed" },
        { status: 502 },
      );
    }

    const geminiData = await geminiRes.json();
    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: { name?: string; title?: string; location?: string };
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return NextResponse.json(
        { error: "Failed to parse Gemini response" },
        { status: 502 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.name && !recruiter.name) updates.name = parsed.name;
    if (parsed.title) updates.title = parsed.title;
    if (parsed.location) updates.location = parsed.location;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db
        .update(recruiters)
        .set(updates)
        .where(eq(recruiters.id, id));
    }

    return NextResponse.json({
      ok: true,
      enriched: updates,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
