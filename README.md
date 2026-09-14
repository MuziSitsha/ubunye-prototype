# Ubunye — Working Prototype

Ubunye helps someone move from *"this is what I can do"* to *"these are the people I can
work with, this is the opportunity we could pursue, and this is how we could build the
business."* This repository is the interactive stakeholder-demonstration prototype — not
a production platform. See the full specification and delivery plan in [`docs/`](docs/).

The core thesis this prototype has to prove: **data and rules decide the recommendation;
AI only explains it.** See [`docs/architecture.md`](docs/architecture.md) §1 and
[`docs/decisions.md`](docs/decisions.md) D8.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth) + Vitest.
AI is abstracted behind `services/aiService.ts` — `MockAIService` (deterministic, default
everywhere) or `ClaudeAIService` (behind `NEXT_PUBLIC_AI_MODE=claude`).

## Getting started

Requires [Docker](https://www.docker.com/) (for the local Supabase stack) and Node 20+.

```bash
npm install
npm run db:start      # starts local Supabase (first run pulls images — be patient)
npm run db:types      # regenerate types/database.ts from the running schema
cp .env.example .env.local   # then fill in the values `supabase start` printed
npm run dev
```

Open http://localhost:3000. The Golden Demo (spec §32) personas — Sipho, Thandi, Kabelo,
Naledi, plus four more in the matching pool — are already seeded; sign in as any of them
from `/login` or `/demo` using the password in `docs/demo-script.md`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Run the Vitest suite (the matching engines are unit-tested — see `services/__tests__/`) |
| `npm run db:start` / `db:stop` | Start/stop the local Supabase stack |
| `npm run db:reset` | Rebuild the schema and reseed the full Golden Demo dataset from empty |
| `npm run db:types` | Regenerate `types/database.ts` from the running local schema |

## Repository map

```
app/            Next.js routes — pages and app/api/** route handlers (thin; no business logic)
components/     Reusable, presentational UI components
services/       All business logic. The matching engines are pure & unit-tested.
lib/            Supabase client factories, small framework-agnostic helpers
types/          Shared TypeScript types (domain.ts) + generated DB types (database.ts)
data/           Static prototype config (South African province/city list)
supabase/       migrations/, seed.sql, config.toml
docs/           architecture.md, database.md, decisions.md, demo-script.md, implementation-status.md
```

## Documentation

Start with [`docs/decisions.md`](docs/decisions.md) — it resolves every ambiguity the
specification left open (matching formulas, the people-then-opportunity ordering, the
RLS-vs-demo-reset design) and is treated as authoritative alongside the spec itself.
Then [`docs/architecture.md`](docs/architecture.md) for how the layers fit together, and
[`docs/demo-script.md`](docs/demo-script.md) to run the Golden Demo end to end.

## Environment ownership

This prototype is written to be indifferent to which Supabase/Vercel project its
environment variables point at — see `docs/decisions.md` D10. Production/demo credential
ownership should sit with Ubunye-controlled accounts (see the delivery plan §1); this repo
never bakes in a specific project.
