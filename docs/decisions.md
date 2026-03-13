# Architecture Decision Records

---

## ADR-001 — Neon over Supabase

**Date:** 2026-03-13
**Status:** Accepted

**Context:**
Rolodex is built by a small team where multiple AI CLI agents (Claude Code sessions) need full awareness of the data model without reading documentation or querying a dashboard.

**Decision:**
Use Neon (serverless Postgres) + Drizzle ORM instead of Supabase.

**Reasoning:**
- Drizzle schema is a TypeScript file. Any agent that reads `packages/db/src/schema.ts` has complete, typed knowledge of every table, column, constraint, and relation — no dashboard, no generated dump, no migration parsing.
- Neon branching gives free dev/prod/preview isolation without managing a second Supabase project.
- Supabase's built-in REST API is redundant once you have Next.js API routes.
- Supabase RLS adds complexity before auth is even built.

**Tradeoff:** We lose Supabase's real-time subscriptions and storage. Neither is needed at MVP.

---

## ADR-002 — No AI match score on recruiter profiles

**Date:** 2026-03-13
**Status:** Accepted

**Context:**
Early design included an "AI match score" on the profile card.

**Decision:**
Removed entirely.

**Reasoning:**
Without a transparent, explainable scoring model, a numerical match score is arbitrary and erodes trust. Students would either dismiss it or over-weight it. The accolades + role tags system gives students the same filtering signal with full transparency.

---

## ADR-003 — Save list in localStorage at MVP, DB in Phase 2

**Date:** 2026-03-13
**Status:** Accepted

**Context:**
Save list requires knowing who the student is — which requires auth.

**Decision:**
MVP save list uses `localStorage` via `useSaveList` hook. `student_saves` table exists in schema but is not used until auth lands.

**Reasoning:**
Unblocks the full profile card + save interaction without building auth. Data loss on browser clear is acceptable at this stage — we have no users yet.

**Migration path:** When auth ships, `useSaveList` gets a server sync layer. Existing localStorage saves get migrated on first login.

---

## ADR-004 — AI enrichment deferred to Phase 2

**Date:** 2026-03-13
**Status:** Accepted

**Context:**
The original plan included an AI orchestration agent that pulls LinkedIn data via Proxycurl and populates `role_tags`, `accolades`, `title`, etc.

**Decision:**
Phase 1 seeds the DB from the Greenbox CSV with base fields only. `role_tags`, `accolades`, `industry_tags` start empty. Enrichment agent is Phase 2.

**Reasoning:**
- Proxycurl costs money per lookup — don't burn credits before validating the core UX.
- The profile card renders gracefully with empty arrays.
- Seeding 190 real recruiter emails is enough to validate search + profile + outreach.

---

## ADR-005 — Outreach generation stays server-side

**Date:** 2026-03-13
**Status:** Accepted

**Decision:**
The Anthropic API call for outreach drafting lives in `apps/web/app/api/outreach/route.ts`, never in client components.

**Reasoning:**
Keeps `ANTHROPIC_API_KEY` server-only. Enables rate limiting and logging at the API route level. `NEXT_PUBLIC_` prefix on the key would expose it in the browser bundle.
