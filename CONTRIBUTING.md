# Contributing to Rolodex

Thanks for your interest. This is an early-stage open-source project — contributions are welcome, especially on the AI enrichment pipeline and data sources.

## Setup

**Prerequisites:** Node 20+, pnpm 9+, a Neon account (free tier works).

```bash
git clone https://github.com/your-org/rolodex
cd rolodex
pnpm install
cp .env.example .env.local
# fill in DATABASE_URL and ANTHROPIC_API_KEY
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Where to contribute

| Area | Location | Notes |
|---|---|---|
| New data sources (LinkedIn, Handshake, Indeed) | `packages/db/src/` + `apps/web/lib/agent/` | Implement the `DataSource` interface |
| UI components | `apps/web/components/` | Tailwind only, no new dependencies without discussion |
| DB schema changes | `packages/db/src/schema.ts` → run `pnpm db:generate` | Always add a migration, never edit schema directly |
| Bug fixes | anywhere | PRs welcome |

## Rules

- TypeScript strict mode — no `any`
- Keep `ANTHROPIC_API_KEY` server-side — never `NEXT_PUBLIC_`
- One PR per concern
- Run `pnpm typecheck && pnpm lint` before opening a PR

## Adding a new data source

1. Create `packages/db/src/sources/your-source.ts`
2. Export a function matching: `(email: string) => Promise<Partial<NewRecruiter>>`
3. Wire it into `apps/web/lib/agent/enrich.ts`
4. Document the API key in `.env.example`
