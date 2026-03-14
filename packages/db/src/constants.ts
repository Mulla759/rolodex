// ─── Domain types (no drizzle imports — safe for client bundles) ──

export type RecruiterStatus = "active" | "inactive";

export type Accolade =
  | "h1b_sponsor"
  | "opt_eligible"
  | "new_grad_friendly"
  | "bs_accepted"
  | "ms_accepted"
  | "phd_accepted";

export type RoleTag =
  | "SWE"
  | "PM"
  | "Data Science"
  | "ML Engineer"
  | "UX Research"
  | "Design"
  | "DevOps"
  | "Security"
  | "QA";

export type IndustryTag =
  | "SaaS"
  | "AI/ML"
  | "Infrastructure"
  | "Developer Tools"
  | "Fintech"
  | "HealthTech"
  | "Enterprise"
  | "Consumer";

export const ACCOLADE_LABELS: Record<Accolade, string> = {
  h1b_sponsor: "H-1B Sponsor",
  opt_eligible: "OPT Eligible",
  new_grad_friendly: "New Grad",
  bs_accepted: "BS OK",
  ms_accepted: "MS OK",
  phd_accepted: "PhD OK",
};

// ─── Contribution domain types ──────────────────

export type ContributionType = "interaction" | "profile_edit" | "linkedin_url";
export type ContributionStatus = "pending" | "approved" | "rejected";

// ─── Contribution constants ─────────────────────

export const CONTRIBUTION_TYPES: ContributionType[] = [
  "interaction",
  "profile_edit",
  "linkedin_url",
];

export const CONTRIBUTION_STATUS: ContributionStatus[] = [
  "pending",
  "approved",
  "rejected",
];

// ─── API response shapes ───────────────────────

export interface RecruiterSearchParams {
  q?: string;
  company?: string;
  role?: string | string[];
  accolade?: string | string[];
  page?: number;
  limit?: number;
}
