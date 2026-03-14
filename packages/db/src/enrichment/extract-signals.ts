import Anthropic from "@anthropic-ai/sdk";
import type { ProxycurlProfile } from "./proxycurl";

const VALID_ROLE_TAGS = [
  "SWE",
  "PM",
  "Data Science",
  "ML Engineer",
  "UX Research",
  "Design",
  "DevOps",
  "Security",
  "QA",
] as const;

const VALID_ACCOLADES = [
  "h1b_sponsor",
  "opt_eligible",
  "new_grad_friendly",
  "bs_accepted",
  "ms_accepted",
  "phd_accepted",
] as const;

const VALID_INDUSTRY_TAGS = [
  "SaaS",
  "AI/ML",
  "Infrastructure",
  "Developer Tools",
  "Fintech",
  "HealthTech",
  "Enterprise",
  "Consumer",
] as const;

export interface ExtractedSignals {
  role_tags: string[];
  accolades: string[];
  industry_tags: string[];
  title: string | null;
  location: string | null;
  teams: Array<{
    team_name: string;
    tech_tags: string[];
    level_range: string | null;
    source: string;
  }>;
}

export async function extractRecruiterSignals(
  profile: ProxycurlProfile,
  company: string
): Promise<ExtractedSignals> {
  const client = new Anthropic();

  const recentExperiences = profile.experiences.slice(0, 5).map((exp) => ({
    company: exp.company,
    title: exp.title,
    starts_at: exp.starts_at,
    ends_at: exp.ends_at,
    description: exp.description,
  }));

  const userPrompt = `Analyze this LinkedIn recruiter profile and extract structured data.

Company context: ${company}

Headline: ${profile.headline ?? "N/A"}

Recent experiences:
${JSON.stringify(recentExperiences, null, 2)}

Skills: ${profile.skills?.join(", ") || "N/A"}

Extract and return a JSON object with these fields:
- role_tags: array of roles this recruiter hires for. ONLY use values from: ${VALID_ROLE_TAGS.join(", ")}
- accolades: array of applicable visa/education signals. ONLY use values from: ${VALID_ACCOLADES.join(", ")}
- industry_tags: array of industry categories. ONLY use values from: ${VALID_INDUSTRY_TAGS.join(", ")}
- title: the recruiter's current job title (string or null)
- location: city and state, e.g. "San Francisco, CA" (string or null)
- teams: array of objects, each with:
  - team_name: name of the team they recruit for
  - tech_tags: array of technologies relevant to that team
  - level_range: seniority range like "L3-L5" or "Junior-Senior" (string or null)
  - source: always "linkedin_jobs"`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system:
      "You are a recruiting data analyst. Extract structured signals from a LinkedIn recruiter profile. Respond only with valid JSON. No markdown, no explanation, just the JSON object.",
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Failed to parse AI response as JSON:", text);
    return {
      role_tags: [],
      accolades: [],
      industry_tags: [],
      title: null,
      location: null,
      teams: [],
    };
  }

  const roleTags = filterValid(parsed.role_tags, VALID_ROLE_TAGS);
  const accolades = filterValid(parsed.accolades, VALID_ACCOLADES);
  const industryTags = filterValid(parsed.industry_tags, VALID_INDUSTRY_TAGS);

  const teams = Array.isArray(parsed.teams)
    ? parsed.teams.map((t: Record<string, unknown>) => ({
        team_name: typeof t.team_name === "string" ? t.team_name : "Unknown",
        tech_tags: Array.isArray(t.tech_tags)
          ? t.tech_tags.filter((v): v is string => typeof v === "string")
          : [],
        level_range:
          typeof t.level_range === "string" ? t.level_range : null,
        source: "linkedin_jobs",
      }))
    : [];

  return {
    role_tags: roleTags,
    accolades,
    industry_tags: industryTags,
    title: typeof parsed.title === "string" ? parsed.title : null,
    location: typeof parsed.location === "string" ? parsed.location : null,
    teams,
  };
}

function filterValid(
  values: unknown,
  validList: readonly string[]
): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter(
    (v): v is string => typeof v === "string" && validList.includes(v)
  );
}
