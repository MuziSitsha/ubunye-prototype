# Decisions

This file records resolutions to ambiguities in the Ubunye Working Prototype
Developer Specification v0.1. Where this file conflicts with a literal reading
of the spec, this file wins — it exists precisely because the spec left a gap
that a developer would otherwise have to invent an answer for. Where both the
spec and this file are silent, stop and ask rather than choosing.

Status: Adopted. (Proposed in the build & delivery plan; treated as signed off
for the purpose of building the prototype end-to-end.)

---

## D1 — The ordering paradox (spec §8 vs §15/§18)

**Problem.** §8 sequences the journey as *find people → then find opportunity*.
§18 scores opportunities against a *team's* combined skills. A solo user who
has just onboarded has no team yet. §15 asks for people who "complement" the
user without defining complementary to what — complementarity is meaningless
in the abstract; it only means something relative to a venture that needs
particular things.

**Resolution.** Score opportunities twice, against two different subjects:

1. Score **all** catalogue opportunities against the solo user's own
   skills/resources/location/availability. This pass is internal and is never
   shown on screen.
2. Take the **top 3** candidate opportunities from that pass.
3. Derive the **skill + resource gaps** across those top 3: the union of
   every required-or-preferred skill/resource those 3 opportunities list that
   the solo user does not already have, deduplicated (see D3 for the exact
   rule — pooling required and preferred here is deliberate, since at the
   solo stage the question is "who would help", not "who is strictly
   necessary").
4. Rank other seeded users by how well they close those gaps — this produces
   **UBY-007 (People You Could Build With)**. A person's match reason is a
   literal read of which gap(s) they close, e.g. "Thandi has sales experience
   your potential team currently lacks" is generated from stored gap data, not
   written in advance.
5. After the user selects people and a team is proposed, **re-score** the
   catalogue against the team's combined profile — this produces
   **UBY-008 (We Found Something)**.

Consequence: the same opportunity shown in UBY-008 can legitimately score
higher after the team forms than it did for the solo user in step 1. That is
the Ubunye thesis, demonstrated numerically on screen, not just asserted in
copy.

Implemented in `services/opportunityMatchingService.ts` (pure scoring) and
`services/peopleMatchingService.ts` (gap-closure ranking), orchestrated by
`services/recommendationService.ts`.

---

## D2 — Scoring component definitions (spec §18)

§18 gives weights but leaves three inputs undefined.

| Component | Definition |
|---|---|
| **Location Fit** | Spec §11 captures location as Province + a single free-text City/Suburb field (no separate suburb granularity), so fit is computed on what is actually captured: opportunity geography `"national"` → `1.0` (available anywhere) · case-insensitive exact match on city/suburb text → `1.0` · same province, different city → `0.5` · different province → `0.2` |
| **Availability Fit** | Minimum across team members of: full-time → `1.0` · part-time → `0.75` · evenings → `0.6` · weekends → `0.5`. A team is only as available as its least-available member. |
| **Demand Score** | Stored directly as `0–1` on `opportunities.demand_score` in seed data. Treated as normalised prototype input — not derived at runtime. |

Skill Coverage and Resource Coverage are `matched / required` (fraction of an
opportunity's `required_skills` / `required_resources` covered by the team),
clamped to `[0, 1]`. Preferred (non-required) skills/resources do not count
toward the denominator but do add a small bonus (see D5).

---

## D3 — People match scoring (spec §15 vs §18)

§18 gives opportunity weights; §15 gives only a principle ("complementary").
For symmetry, people matching uses:

```
Match Score = (Gap Coverage × 0.50)
            + (Location Fit × 0.25)
            + (Availability Overlap × 0.15)
            + (Experience Level × 0.10)
```

- **Gap Coverage** — fraction of the derived gap set (D1 step 3) that this
  candidate covers. The gap set is the union of the solo user's **missing**
  required-or-preferred skills and required-or-preferred resources, taken
  across their top-3 solo-scored opportunities (missing = the opportunity
  lists it and the user doesn't have it; required and preferred are pooled
  into one set — at solo-user stage the point is "what would help", not a
  strict operating requirement). A candidate "covers" a gap item if they hold
  that skill (`user_skills`) or that resource (`user_resources`).
- **Location Fit** — same scale as D2.
- **Availability Overlap** — the same weighted scale as D2's Availability Fit
  (full_time `1.0` · part_time `0.75` · evenings `0.6` · weekends `0.5`),
  applied to the candidate alone. It is not compared against the current
  user's own availability — a highly available candidate is valuable
  regardless of the asking user's schedule.
- **Experience Level** — average of `experience_level` (`beginner 0.25 ·
  some_experience 0.5 · experienced 0.75 · expert 1.0`) across the
  candidate's **skills** that close a gap. If the candidate closes at least
  one gap item but only via resources (no skill closes a gap), this component
  defaults to a neutral `0.5` rather than being undefined. If the candidate
  closes zero gap items, Gap Coverage is `0` and this component is also `0.5`
  (neutral) since there is nothing to average — it simply won't matter given
  a `0` on the dominant term.

Implemented in `services/peopleMatchingService.ts`.

---

## D4 — RLS vs. the demo reset (spec §42 vs §31)

§42 asks for Row Level Security. §31 asks for a reset that truncates and
reseeds. A reset requires the Supabase `service_role` key, which §6 correctly
forbids from reaching the browser.

**Resolution.** `/demo` is a thin client page with no elevated privileges.
Every mutating action it triggers calls a Next.js Route Handler under
`/api/demo/*`, which runs server-side only, uses the service-role key (never
sent to the browser), and is gated behind `process.env.ENABLE_DEMO_PANEL ===
"true"` — checked at the top of every handler, not just in the UI. This flag
must never be `true` on a deployment carrying real user data. All other
tables carry RLS policies scoped to `auth.uid()`.

---

## D5 — Preferred skills/resources bonus

Not in the spec; needed so "preferred" fields (spec §17) aren't dead data.
Each matched preferred (non-required) skill or resource adds `+0.02` to the
relevant coverage score, capped so the component never exceeds `1.0`. This is
a minor tie-breaker, not a scoring pillar — required coverage still dominates.

---

## D6 — Seed timing

§53 places the Golden Demo in Build 6 and "seed infrastructure" in Build 1.
Resolution: the four Golden Demo personas (Sipho, Thandi, Kabelo, Naledi),
skills, resources, opportunities, support programmes and learning programmes
are all seeded from day one (`supabase/seed.sql`), not assembled at the end.
`npm run db:reset` rebuilds the full demo dataset from an empty database.

---

## D7 — Fictional provider names only

Per spec §26 and the build plan §2.2: every Funding & Support and Skills
Development seed record uses a clearly fictional provider name (e.g.
"Example Development Bank", "Provincial Enterprise Fund", "Example Training
Partner"). No real bank, government department or company name appears
anywhere in seed data, copy, or fixtures until a real partnership exists.

---

## D8 — AI is narration, never decision

Per spec §7 and §37: `AIService` (`MockAIService` by default,
`ClaudeAIService` behind `NEXT_PUBLIC_AI_MODE=claude`) is called only to
phrase explanations, interpret free-text skills into a structured shape, and
draft prose summaries. It never returns a score, a ranking, a match decision,
or a number that isn't already present in the structured recommendation
object it was given. Every explanation is a template render over
`recommendations.components` (see `docs/architecture.md`) — the model narrates
stored evidence, it does not invent it. If a future contributor finds
themselves prompting a model to *decide* something, that logic belongs in a
service under `/services`, not in a prompt.

---

## D9 — Auth

Email/password via Supabase Auth only, per spec §41. No social login, no MFA,
no identity verification. Magic link is left as a documented future option,
not built, to keep the P0 journey (spec §54) minimal.

---

## D10 — Local-first Supabase for the prototype build

The build plan (§1) calls for Ubunye-owned Supabase/Vercel/domain accounts
before the first commit — that is an account-provisioning step for the
product owner, not a code change, and this repository is written to be
indifferent to which project ID those environment variables point at. For
building and demoing before those accounts exist, the app runs against a
local Supabase stack (`supabase start`, Docker-based) using the same
migrations and seed script that will run against the hosted project. Moving
to the hosted Ubunye-owned project is a matter of pointing `.env.local` at it
and running `supabase db push` — no code changes required.
