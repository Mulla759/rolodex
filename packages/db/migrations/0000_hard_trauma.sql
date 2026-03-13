CREATE TABLE IF NOT EXISTS "recruiters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"title" text,
	"linkedin_url" text,
	"github_url" text,
	"location" text,
	"status" text DEFAULT 'active',
	"verified_at" timestamp with time zone,
	"source_date" date,
	"response_rate" numeric(5, 2),
	"avg_reply_days" integer,
	"students_placed" integer DEFAULT 0,
	"accolades" text[] DEFAULT '{}',
	"role_tags" text[] DEFAULT '{}',
	"industry_tags" text[] DEFAULT '{}',
	"raw_linkedin" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"recruiter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_saves" ADD CONSTRAINT "student_saves_recruiter_id_recruiters_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recruiters_email_idx" ON "recruiters" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recruiters_company_idx" ON "recruiters" ("company");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_saves_unique_idx" ON "student_saves" ("student_id","recruiter_id");