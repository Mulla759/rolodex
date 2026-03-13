# Rolodex — Project Context
**Paste this file at the start of every Claude Code session.**
Keep it updated as the project evolves. This is the single source of truth for any AI agent working on this codebase.

---

## What is Rolodex

Open-source recruiter discovery tool for CS students.
Students search a verified recruiter database, view profiles with engagement metrics, and use AI to draft cold outreach.

**Current phase:** MVP — DB seeded, search UI, profile card, save list (localStorage).
**Next phase:** Auth (`.edu` gate), AI enrichment agent, response rate tracking.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 App Router | SSR, API routes, React Server Components |
| Database | Neon (serverless Postgres) | pgvector-ready, branching, free tier |
| ORM | Drizzle ORM | TypeScript schema = DB context for agents |
| Styling | Tailwind CSS | Utility-first, no component lib at MVP |
| AI | Anthropic claude-sonnet-4-6 via Vercel AI SDK | Outreach drafting + enrichment |
| Monorepo | pnpm workspaces + Turborepo | Fast, workspace-aware |
| Deploy | Vercel | Zero-config Next.js |

---

## Monorepo layout

```
rolodex/
├── apps/
│   └── web/                     # Next.js app
│       ├── app/
│       │   ├── page.tsx          # Search page (main entry)
│       │   ├── saved/page.tsx    # Saved recruiters list
│       │   ├── layout.tsx        # Root layout + nav
│       │   └── api/
│       │       ├── recruiters/route.ts        # GET search/filter
│       │       ├── recruiters/batch/route.ts  # POST batch fetch by IDs
│       │       └── outreach/route.ts          # POST AI draft generation
│       ├── components/
│       │   ├── recruiter/
│       │   │   ├── RecruiterCard.tsx
│       │   │   ├── RecruiterGrid.tsx
│       │   │   └── OutreachModal.tsx
│       │   └── ui/               # Shared primitives (Button, Badge, Input)
│       └── lib/
│           ├── hooks/
│           │   └── useSaveList.ts  # localStorage save list
│           └── agent/             # Phase 2: enrichment helpers
├── packages/
│   └── db/
│       ├── src/
│       │   ├── schema.ts    ← SINGLE SOURCE OF TRUTH for all DB types
│       │   ├── index.ts     ← exports db client + all types
│       │   └── types.ts     ← TypeScript types + domain enums
│       ├── migrations/
│       │   └── 001_init.sql
│       ├── scripts/
│       │   └── seed.ts      ← seeds from Greenbox CSV
│       └── drizzle.config.ts
├── data/
│   └── Greenbox_recruiter_emails.csv  ← beta seed data (215 rows)
├── docs/
│   └── decisions.md         ← ADRs (architecture decision records)
├── .claude/
│   └── CONTEXT.md           ← this file
├── .env.example
└── CONTEXT.md               ← symlink or copy of .claude/CONTEXT.md
```

---

## Database schema (Drizzle)

Defined in `packages/db/src/schema.ts`. **Never write raw SQL in apps/web — always use the typed client.**

### `recruiters` table

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, auto |
| company | text | normalized title-case |
| name | text | nullable (~40% of seed data missing) |
| email | text | unique, lowercase |
| title | text | from LinkedIn enrichment |
| linkedin_url | text | enrichment |
| github_url | text | enrichment |
| location | text | enrichment |
| status | text | 'active' \| 'inactive' |
| verified_at | timestamptz | when agent last verified |
| source_date | date | "Date Appeared" from CSV |
| response_rate | numeric(5,2) | 0–100, future |
| avg_reply_days | integer | future |
| students_placed | integer | future |
| accolades | text[] | GIN indexed |
| role_tags | text[] | GIN indexed |
| industry_tags | text[] | GIN indexed |
| raw_linkedin | text | JSON string from Proxycurl |

### `student_saves` table

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| student_id | uuid | auth.users FK — not enforced until auth added |
| recruiter_id | uuid | FK → recruiters, cascade delete |

---

## Key domain types

```typescript
// from packages/db/src/types.ts
type Accolade = 'h1b_sponsor' | 'opt_eligible' | 'new_grad_friendly' | 'bs_accepted' | 'ms_accepted' | 'phd_accepted'
type RoleTag = 'SWE' | 'PM' | 'Data Science' | 'ML Engineer' | 'UX Research' | 'Design' | 'DevOps' | 'Security' | 'QA'
type IndustryTag = 'SaaS' | 'AI/ML' | 'Infrastructure' | 'Developer Tools' | 'Fintech' | 'HealthTech' | 'Enterprise' | 'Consumer'

const ACCOLADE_LABELS: Record<Accolade, string> = {
  h1b_sponsor: 'H-1B Sponsor',
  opt_eligible: 'OPT Eligible',
  new_grad_friendly: 'New Grad',
  bs_accepted: 'BS OK', ms_accepted: 'MS OK', phd_accepted: 'PhD OK',
}
```

---

## Seed data (Greenbox CSV)

- **215 rows**, ~60 companies
- ~40% missing `name` field (Amazon, Bloomberg, Atlassian bulk entries)
- Duplicate emails exist — seed script dedupes on `email`
- `source_date` = "Date Appeared" column, format M/D/YY → ISO date
- `role_tags`, `accolades`, `industry_tags` all start empty — Phase 2 AI agent populates
- After clean seed: ~190 unique records

Major companies in dataset: Accenture, Adobe, Airbnb, Amazon (×5), AMD (×5), Apple (×8), Atlassian (×12), Bloomberg (×9), and more.

---

## API routes

### `GET /api/recruiters`
Search and filter recruiters.
```
?q=         full-text search (name, company, email — ilike)
?company=   exact company match
?role=      role_tags array overlap (repeatable: ?role=SWE&role=PM)
?accolade=  accolades array overlap
?page=      default 1
?limit=     default 20, max 50
```
Returns: `{ data: Recruiter[], count: number, page: number, totalPages: number }`

### `POST /api/recruiters/batch`
Fetch specific recruiters by ID (for saved list).
```json
{ "ids": ["uuid1", "uuid2"] }
```
Max 100 IDs. Returns: `Recruiter[]`

### `POST /api/outreach`
AI-generated cold outreach draft (streaming).
```json
{ "recruiter": Recruiter, "studentContext": "optional string" }
```
Returns: streaming text. First line = `Subject: ...`, body follows after blank line.

---

## Architecture decisions

See `docs/decisions.md` for full ADRs. Summary:

- **Neon over Supabase** — Drizzle schema as TS file is more context-efficient for AI agents than Supabase's generated types. Neon branching enables safe dev/prod isolation.
- **No auth at MVP** — `.edu` gate deferred. Save list uses localStorage.
- **No AI match score** — removed from profile card design. Felt arbitrary without transparent scoring.
- **Outreach AI in API route, not client** — keeps Anthropic key server-side.
- **ai-agent package deferred** — enrichment logic lives in `apps/web/lib/agent/` until Phase 2 when it earns its own package.

---

## Environment variables

```bash
DATABASE_URL=             # Neon pooled connection string
DATABASE_URL_DIRECT=      # Neon direct (for migrations)
DRIZZLE_DATABASE_URL=     # same as DATABASE_URL_DIRECT
ANTHROPIC_API_KEY=        # sk-ant-...
PROXYCURL_API_KEY=        # optional at MVP
NEXT_PUBLIC_APP_URL=      # http://localhost:3000
```

---

## What's NOT built yet (do not hallucinate these)

- Auth / `.edu` gate
- AI enrichment agent (Proxycurl + LinkedIn scraper)
- Response rate / placement tracking
- Student-side profile (what recruiter sees)
- Admin panel
- Email sending
- pgvector semantic search (schema supports it, not wired up)
