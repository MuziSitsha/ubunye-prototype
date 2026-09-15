# Architecture

## 1. The core principle (spec §7)

Ubunye's recommendation engine is **not** `Prompt → LLM → business idea`.

```
Layer 1  Structured user data        skills, resources, location, availability, experience
Layer 2  Structured opportunity data  supabase/seed.sql -> opportunities table
Layer 3  Matching logic               services/*MatchingService.ts (pure, sync, unit-tested)
Layer 4  Demand signal                opportunities.demand_score (prototype, clearly labelled)
Layer 5  AI explanation               services/aiService.ts (narrates Layer 1-4 output only)
```

**Data + rules decide. AI explains.** See [decisions.md](decisions.md) D8.

## 2. Service layer

All business logic lives under `/services`. UI components (`app/**`,
`components/**`) call services or the thin `/api/**` route handlers that wrap
them — they never embed matching/scoring logic themselves.

| Service | Responsibility | Pure? |
|---|---|---|
| `authService.ts` | Supabase auth wrappers (sign up, sign in, sign out, session) | No (I/O) |
| `profileService.ts` | Read/write profile, skills, resources | No (I/O) |
| `skillInterpreterService.ts` | Calls `AIService.interpretSkills`, persists confirmed skills | No (I/O) |
| `peopleMatchingService.ts` | Ranks candidate users against a derived skill/resource gap set (D1, D3) | **Yes** |
| `opportunityMatchingService.ts` | Scores opportunities against a user or team (D2) | **Yes** |
| `recommendationService.ts` | Orchestrates the two matching services per D1, persists `recommendations` rows with full component + evidence breakdown | No (I/O), delegates all math to the two pure services above |
| `teamService.ts` | Team formation, membership | No (I/O) |
| `ventureService.ts` | Venture creation, stage progression, business-builder fields | No (I/O) |
| `fundingService.ts` | Funding/support programme matching, funding-readiness checklist | No (I/O) |
| `learningService.ts` | Skills-gap → learning programme matching | No (I/O) |
| `helpService.ts` | "Ask for Help" request logging | No (I/O) |
| `aiService.ts` | `AIService` interface + `MockAIService` + `ClaudeAIService` | No (I/O) |

The two matching services are pure functions: given the same typed inputs
they always return the same output, take no network/database/AI dependency,
and are exercised by unit tests in `services/__tests__/`. This is what makes
the scoring defensible to a due-diligence question — the code path a reviewer
reads is the code path that ran.

## 3. The recommendation record (why every claim on screen traces to a row)

If only a final score (`87%`) is stored and an LLM is asked to explain it
after the fact, the model will invent plausible-sounding reasons that are
fiction. `recommendations` therefore stores every scoring component **and the
evidence that produced it**, not just the total:

```json
{
  "total": 0.87,
  "components": {
    "skill_coverage":    { "score": 0.85, "matched": ["appliance_repair", "electrical_maintenance"], "missing": ["bookkeeping"] },
    "resource_coverage": { "score": 0.90, "matched": ["vehicle", "tools"], "missing": [] },
    "demand":            { "score": 0.80, "signal_id": "opp_mobile_appliance_repair" },
    "location":          { "score": 1.00, "basis": "same_city" },
    "availability":      { "score": 0.75, "basis": "min_member_part_time" }
  }
}
```

`AIService.explainRecommendation` receives exactly this object and renders it
into prose (UBY-008/UBY-009). It cannot add a claim that isn't a field in
`components`. When a stakeholder asks "how did the system decide this?", the
answer is: open the `recommendations` row.

The equivalent shape for people matching (`recommendations.kind = 'person'`):

```json
{
  "total": 0.71,
  "components": {
    "gap_coverage":  { "score": 0.80, "closes": ["sales", "customer_service"] },
    "location":      { "score": 1.00, "basis": "same_city" },
    "availability":  { "score": 0.75, "basis": "compatible" },
    "experience":    { "score": 0.60, "basis": "avg_experience_on_closed_gaps" }
  }
}
```

## 4. AI service abstraction (spec §36)

```ts
interface AIService {
  interpretSkills(input: string): Promise<SkillInterpretation>;
  explainRecommendation(recommendation: RecommendationContext): Promise<string>;
  generateBusinessSummary(venture: VentureContext): Promise<string>;
}
```

- `MockAIService` — deterministic, keyword/rule-based, zero network calls, zero
  cost, zero latency, zero flakiness. **Default in every environment.**
- `ClaudeAIService` — calls the Claude API server-side only (`app/api/ai/*`
  route handlers; the API key never reaches the browser). Selected by
  `AI_MODE=claude`. Never wired into the Golden Demo's default
  path — see D8 and the build plan's §2's "mock as default, real service as a
  flag" guidance.

Both implementations satisfy the same interface, so nothing above the service
boundary knows or cares which one is active.

## 5. Data flow: onboarding → recommendation

```
User free-text  ──▶ skillInterpreterService ──▶ AIService.interpretSkills ──▶ user confirms
                                                                                     │
                                                                                     ▼
                                                      profileService (location, availability, resources)
                                                                                     │
                                                                                     ▼
                                                      recommendationService.recommendForUser(userId)
                                                        1. opportunityMatchingService.score(allOpps, soloProfile)
                                                        2. top 3 → derive gap set
                                                        3. peopleMatchingService.rank(candidateUsers, gapSet)
                                                        │
                                                        ▼
                                              UBY-007 People You Could Build With
                                                        │  (user selects people → team proposed)
                                                        ▼
                                      recommendationService.recommendForTeam(teamProfile)
                                        opportunityMatchingService.score(allOpps, teamProfile)
                                                        │
                                                        ▼
                                    UBY-008 / UBY-009 opportunity + explanation (AIService narrates)
                                                        │
                                                        ▼
                                              teamService.createTeam / ventureService.createVenture
```

## 6. Route handlers vs. services

Route handlers under `app/api/**` are thin: parse/validate input, call a
service, map the result to JSON, map thrown errors to the human-readable
messages required by spec §50. They hold no scoring or matching logic.

`service_role`-key operations (demo reset/seed/persona-load) are isolated to
`app/api/demo/**`, gated by `ENABLE_DEMO_PANEL` (see D4). Every other route
uses the anon key plus the user's session, relying on RLS.

## 7. Directory layout

```
app/            Next.js App Router routes (pages + app/api/** route handlers)
components/     Reusable UI components (presentational; no business logic)
services/       Business logic, typed, unit-tested where pure
lib/            Supabase client factories, AI client, small framework-agnostic utils
types/          Shared TypeScript types/interfaces (mirrors the DB schema)
data/           Static prototype config: nav items, disclaimer copy, help-topic list
supabase/       migrations/, seed.sql, config.toml
docs/           This documentation set
```
