<div align="center">

# Rolodex

**Find the recruiter. Write the email. Get the job.**

A recruiter discovery tool built for CS students — searchable profiles, verified contact data, and AI-drafted cold outreach.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/maintained_with-pnpm-orange)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

</div>

---

## What it does

Most students don't cold email recruiters because they don't know who to email or what to say. Rolodex fixes both.

- **Search recruiters by company, role type, and visa support** — filter by H-1B sponsors, new-grad-friendly, OPT-eligible
- **Profiles with trust signals** — engagement metrics, accolades, last-verified date via AI agent
- **AI outreach drafting** — one click generates a personalized cold email under 120 words
- **Save lists** — bookmark recruiters, build your pipeline

---

## Stack

| | |
|---|---|
| **Frontend** | Next.js 14 App Router, Tailwind CSS |
| **Database** | Neon (serverless Postgres) + pgvector |
| **ORM** | Drizzle ORM — TypeScript schema as source of truth |
| **AI** | Anthropic claude-sonnet-4-6 via Vercel AI SDK |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Deploy** | Vercel |

---

## Project structure

```
rolodex/
├── apps/
│   └── web/                   # Next.js app
│       ├── app/
│       │   ├── page.tsx        # Search + browse
│       │   ├── saved/          # Saved recruiter list
│       │   └── api/
│       │       ├── recruiters/ # Search, filter, batch fetch
│       │       └── outreach/   # AI draft generation (streaming)
│       ├── components/
│       │   ├── recruiter/      # RecruiterCard, OutreachModal, Grid
│       │   └── ui/             # Shared primitives
│       └── lib/
│           ├── hooks/          # useSaveList (localStorage)
│           └── agent/          # Phase 2: enrichment helpers
└── packages/
    └── db/
        ├── src/
        │   ├── schema.ts       # ← single source of truth
        │   ├── index.ts        # db client + re-exports
        │   └── types.ts        # TypeScript types + domain enums
        ├── migrations/
        └── scripts/seed.ts     # Seeds from Greenbox CSV
```

---

## Getting started

**Prerequisites:** Node 20+, pnpm 9+, [Neon account](https://neon.tech) (free tier), [Anthropic API key](https://console.anthropic.com).

### 1. Clone and install

```bash
git clone https://github.com/your-org/rolodex
cd rolodex
pnpm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in:

```bash
DATABASE_URL=             # Neon pooled connection string
DATABASE_URL_DIRECT=      # Neon direct connection (for migrations)
ANTHROPIC_API_KEY=        # sk-ant-...
```

### 3. Set up the database

```bash
pnpm db:migrate   # run migrations
pnpm db:seed      # seed ~190 recruiter records from CSV
```

### 4. Run

```bash
pnpm dev
# → http://localhost:3000
```

---

## Database commands

```bash
pnpm db:migrate    # apply pending migrations
pnpm db:generate   # generate migration from schema changes
pnpm db:seed       # seed from data/Greenbox_recruiter_emails.csv
pnpm db:studio     # open Drizzle Studio (visual DB browser)
```

---

## Recruiter profile fields

| Field | Source | Phase |
|---|---|---|
| company, name, email | CSV seed | MVP |
| title, location, linkedin_url | AI enrichment (Proxycurl) | Phase 2 |
| role_tags, industry_tags | AI enrichment | Phase 2 |
| accolades | AI enrichment | Phase 2 |
| response_rate, avg_reply_days | Student feedback | Phase 3 |

---

## Accolades

Filter recruiter profiles by what matters to you:

| Key | Label |
|---|---|
| `h1b_sponsor` | H-1B Sponsor |
| `opt_eligible` | OPT Eligible |
| `new_grad_friendly` | New Grad |
| `bs_accepted` | BS OK |
| `ms_accepted` | MS OK |
| `phd_accepted` | PhD OK |

---

## Roadmap

**MVP (current)**
- [x] Monorepo scaffold — Next.js + Neon + Drizzle
- [x] DB schema + migrations
- [x] Seed from Greenbox CSV (~190 records)
- [ ] Search + filter UI
- [ ] Recruiter profile card
- [ ] Save list (localStorage)
- [ ] AI outreach drafting

**Phase 2**
- [ ] `.edu` auth gate
- [ ] AI enrichment agent (Proxycurl + LinkedIn)
- [ ] Scheduled re-verification
- [ ] pgvector semantic search

**Phase 3**
- [ ] Student-side profile (what a recruiter sees)
- [ ] Response rate tracking
- [ ] Outreach analytics

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The highest-leverage contribution right now is adding data sources — if you can pull recruiter data from Handshake, Indeed, or university job boards, open a PR.

---

## Context for AI agents

If you're a Claude Code session working on this repo, read `.claude/CONTEXT.md` first. It has the full schema, API shapes, domain types, and architecture decisions — everything you need to work without ambiguity.

---

<div align="center">

MIT License · Built for students, by students

</div>
