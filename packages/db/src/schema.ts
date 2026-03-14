import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// recruiters
// Core table. AI agent writes to: title, linkedin_url, github_url,
// location, verified_at, response_rate, avg_reply_days,
// students_placed, accolades, role_tags, industry_tags, raw_linkedin.
// Seed script writes the base fields from CSV.
// ─────────────────────────────────────────────
export const recruiters = pgTable(
  "recruiters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    company: text("company").notNull(),
    name: text("name"),                        // nullable — ~40% of seed data missing
    email: text("email").notNull(),
    title: text("title"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    location: text("location"),

    // trust signals
    status: text("status").default("active"),  // 'active' | 'inactive'
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    sourceDate: date("source_date"),           // "Date Appeared" from CSV

    // engagement metrics — populated by agent / student feedback
    responseRate: numeric("response_rate", { precision: 5, scale: 2 }),
    avgReplyDays: integer("avg_reply_days"),
    studentsPlaced: integer("students_placed").default(0),

    // array fields — GIN indexed for overlap queries
    // accolades values: 'h1b_sponsor' | 'opt_eligible' | 'new_grad_friendly'
    //                   | 'bs_accepted' | 'ms_accepted' | 'phd_accepted'
    accolades: text("accolades").array().default([]),
    roleTags: text("role_tags").array().default([]),    // 'SWE' | 'PM' | 'ML Engineer' etc
    industryTags: text("industry_tags").array().default([]),

    // raw enrichment payload from LinkedIn / Proxycurl
    rawLinkedin: text("raw_linkedin"),         // stored as JSON string

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("recruiters_email_idx").on(t.email),
    companyIdx: index("recruiters_company_idx").on(t.company),
    // GIN indexes defined in migration SQL — drizzle-kit doesn't emit these natively
  })
);

// ─────────────────────────────────────────────
// student_saves
// Client-side localStorage for MVP.
// This table exists for Phase 2 when auth lands.
// ─────────────────────────────────────────────
export const studentSaves = pgTable(
  "student_saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").notNull(),   // auth.users — nullable FK until auth added
    recruiterId: uuid("recruiter_id")
      .notNull()
      .references(() => recruiters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueSave: uniqueIndex("student_saves_unique_idx").on(t.studentId, t.recruiterId),
  })
);

// ─────────────────────────────────────────────
// recruiter_teams
// Populated by AI enrichment pipeline from LinkedIn data.
// Each row = one team/role a recruiter hires for.
// ─────────────────────────────────────────────
export const recruiterTeams = pgTable(
  "recruiter_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recruiterId: uuid("recruiter_id")
      .notNull()
      .references(() => recruiters.id, { onDelete: "cascade" }),
    teamName: text("team_name").notNull(),
    company: text("company").notNull(),
    techTags: text("tech_tags").array().default([]),
    levelRange: text("level_range"),
    placements: integer("placements").default(0),
    source: text("source").default("linkedin_jobs"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    recruiterIdx: index("recruiter_teams_recruiter_id_idx").on(t.recruiterId),
  })
);

// ─────────────────────────────────────────────
// relations (for drizzle relational queries)
// ─────────────────────────────────────────────
export const recruitersRelations = relations(recruiters, ({ many }) => ({
  saves: many(studentSaves),
  teams: many(recruiterTeams),
}));

export const studentSavesRelations = relations(studentSaves, ({ one }) => ({
  recruiter: one(recruiters, {
    fields: [studentSaves.recruiterId],
    references: [recruiters.id],
  }),
}));

export const recruiterTeamsRelations = relations(recruiterTeams, ({ one }) => ({
  recruiter: one(recruiters, {
    fields: [recruiterTeams.recruiterId],
    references: [recruiters.id],
  }),
}));
