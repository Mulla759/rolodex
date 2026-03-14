import { NextResponse } from "next/server";
import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

interface OutreachRecruiter {
  id?: string;
  name?: string | null;
  company?: string | null;
  title?: string | null;
  email?: string | null;
  roleTags?: string[] | null;
  role_tags?: string[] | null;
}

interface OutreachRequestBody {
  recruiter?: OutreachRecruiter;
  studentContext?: string;
}

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getTeamTags(recruiter: OutreachRecruiter): string[] {
  if (Array.isArray(recruiter.roleTags)) return recruiter.roleTags.filter(Boolean);
  if (Array.isArray(recruiter.role_tags)) return recruiter.role_tags.filter(Boolean);
  return [];
}

export async function POST(req: Request) {
  const body = (await req.json()) as OutreachRequestBody;
  const recruiter = body?.recruiter;

  if (!recruiter || !recruiter.id || !recruiter.company || !recruiter.email) {
    return NextResponse.json(
      { error: "Invalid recruiter payload. Expected recruiter with id, company, and email." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const teamTags = getTeamTags(recruiter);
  const teamsText = teamTags.length > 0 ? teamTags.join(", ") : "Not provided";

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: [
      "You write concise, professional cold outreach emails for students.",
      "Keep the full output under 120 words.",
      'The very first line must be exactly in the format: "Subject: <text>".',
      "After the subject line, include a blank line, then the email body.",
      "No filler, no fluff, no buzzwords, and no emojis.",
      'End the email body with the sign-off exactly as: "[Your name]".',
    ].join("\n"),
    prompt: [
      "Draft a short outreach email using this recruiter context:",
      `- Name: ${recruiter.name || "Unknown"}`,
      `- Company: ${recruiter.company}`,
      `- Title: ${recruiter.title || "Unknown"}`,
      `- Teams hired for: ${teamsText}`,
      body.studentContext?.trim() ? `- Student context: ${body.studentContext.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return result.toTextStreamResponse();
}
