# Database

Postgres via Supabase. Full DDL lives in `supabase/migrations/`; this is the map, not a
copy of the SQL. Entity list per spec §33; relationships per spec §34.

## Identity

- **`auth.users`** — Supabase-managed. Email/password only (spec §41).
- **`profiles`** (1:1 with `auth.users`) — everything the matching engine needs: name,
  location (`province`, `city`), `availability`, `situation`, timestamps marking
  onboarding/skills-confirmation complete. A trigger (`handle_new_user`) creates the row
  automatically on signup.

## Capability

- **`skills`** / **`resources`** — open catalogues (spec §14, §12). New entries can be
  created on the fly when a user types something not already in the catalogue
  (`profileService.findOrCreateSkill` / `findOrCreateResource`).
- **`user_skills`** — join table with `experience_level`, `confidence` (set when
  AI-interpreted), and `source` (`ai_interpreted` vs `manual`).
- **`user_resources`** — simple join table (multi-select, spec §12).

## Opportunity catalogue

- **`opportunities`** — the 8-15 prototype opportunities (spec §17), including the
  prototype demand signal fields (`demand_score`, `demand_summary`, `market_signal`,
  `why_now`) — always labelled as demonstration data (spec §21).
- **`opportunity_skills`** / **`opportunity_resources`** — join tables with a
  `requirement_type` of `required` or `preferred` (spec §18).

## Matching output

- **`recommendations`** — every scoring run's full breakdown, not just the total (spec
  driver: docs/architecture.md §3). `kind` is `'opportunity'` or `'person'`; exactly one
  of `opportunity_id` / `candidate_user_id` is set, enforced by a check constraint.
  `components` is the jsonb shape documented in architecture.md §3 — this is what makes
  every on-screen explanation traceable to a row instead of an AI invention.

## Team → venture

- **`teams`** / **`team_members`** — formed immediately on the "Create Team" action (spec
  §22 — prototype acceptance is simulated).
- **`ventures`** (1:1 with `teams`) — the business itself: `current_stage`, the four
  business-builder jsonb blobs (`business_concept`, `customer`, `operations`, `money` —
  spec §24), `readiness_score`, and `readiness_checklist` (4 manually-toggled booleans
  for the items nothing else in the schema can derive — see docs/decisions.md and spec
  §5's "no real registration/banking/compliance integration" boundary).
- **`venture_stages`** — one row per stage in `VENTURE_STAGE_ORDER`
  (`types/domain.ts`), each `pending` / `active` / `complete`, powering the UBY-011
  progress tracker.

## Ecosystem

- **`support_programmes`** — spec §26's Funding & Support catalogue. Every `provider` is
  fictional (docs/decisions.md D7).
- **`learning_programmes`** — spec §28's Skills Development catalogue, optionally linked
  to a `skill_id` so `learningService` can recommend by gap.
- **`help_requests`** — spec §25's Ask For Help log.
- **`notifications`** — spec §30's activity feed (schema present; UI surfaces basic
  activity via the dashboard rather than a dedicated inbox in this build).

## Relationships (spec §34, concretely)

```
profiles ──< user_skills >── skills
profiles ──< user_resources >── resources
opportunities ──< opportunity_skills >── skills
opportunities ──< opportunity_resources >── resources

profiles ──< recommendations >── opportunities   (kind = 'opportunity')
profiles ──< recommendations >── profiles        (kind = 'person', via candidate_user_id)

profiles ──< team_members >── teams ── ventures ──< venture_stages
ventures ──< help_requests
skills ──< learning_programmes
```

## Row Level Security

See `supabase/migrations/20260914090100_rls_policies.sql` and docs/decisions.md D4 for
the full policy set and the reasoning behind it (catalogue and "public profile" data is
readable by any signed-in user because Ubunye is a discovery platform; writes are scoped
to the owning row or team membership).
