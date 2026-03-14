CREATE TABLE IF NOT EXISTS "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recruiter_id" uuid NOT NULL,
	"student_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" text NOT NULL,
	"status" text DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recruiter_metrics" (
	"recruiter_id" uuid PRIMARY KEY NOT NULL,
	"response_rate" numeric(5, 2),
	"avg_reply_days" numeric(5, 1),
	"students_placed" integer DEFAULT 0,
	"interaction_count" integer DEFAULT 0,
	"last_updated" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contributions" ADD CONSTRAINT "contributions_recruiter_id_recruiters_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recruiter_metrics" ADD CONSTRAINT "recruiter_metrics_recruiter_id_recruiters_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contributions_recruiter_id_idx" ON "contributions" ("recruiter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contributions_status_idx" ON "contributions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contributions_student_id_idx" ON "contributions" ("student_id");
