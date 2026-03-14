CREATE TABLE IF NOT EXISTS "recruiter_teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recruiter_id" uuid NOT NULL REFERENCES "recruiters"("id") 
    ON DELETE CASCADE,
  "team_name" text NOT NULL,
  "company" text NOT NULL,
  "tech_tags" text[] DEFAULT '{}',
  "level_range" text,
  "placements" integer DEFAULT 0,
  "source" text DEFAULT 'linkedin_jobs',
  "created_at" timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "recruiter_teams_recruiter_id_idx" 
  ON "recruiter_teams" ("recruiter_id");
