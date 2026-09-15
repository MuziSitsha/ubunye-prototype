# Implementation Status

Updated in the same commit as the work it describes (spec §57). Status values: **Done**
(usable through the UI, per spec §57's "do not mark functionality complete until it is
usable through the UI"), **Built** (code complete, pending a manual pass), **Partial**,
**Not started**.

## P0 — Must work (spec §54)

| Requirement | Screen(s) | Status | Location |
|---|---|---|---|
| Registration / login | UBY-002, login | Done | `app/register`, `app/login`, `services/authService.ts` |
| Onboarding welcome | UBY-003 | Done | `app/(guided)/onboarding/welcome` |
| Skill interpretation (NL input) | UBY-004 | Done | `app/(guided)/onboarding/skills`, `services/skillInterpreterService.ts`, `services/aiService.ts` |
| Structured profile (location/availability/situation/experience) | UBY-005 | Done | `app/(guided)/onboarding/profile`, `services/profileService.ts` |
| Resources capture | UBY-006 | Done | `app/(guided)/onboarding/resources` |
| Profile completion summary | §13 | Done | `app/(guided)/onboarding/complete` |
| Complementary-person matching | UBY-007 | Done | `app/(guided)/people`, `services/peopleMatchingService.ts` (pure, unit-tested) |
| Opportunity catalogue | §17 | Done | `supabase/seed.sql` (14 opportunities), `services/recommendationService.ts` |
| Opportunity matching + scoring | UBY-008 | Done | `services/opportunityMatchingService.ts` (pure, unit-tested) |
| Recommendation explanation | UBY-009 | Done | `app/(guided)/opportunity`, `services/aiService.ts` (template-grounded, never invents a claim) |
| Team formation | UBY-010 | Done | `app/(guided)/team/proposed`, `services/teamService.ts` |
| Venture workspace / progress tracker | UBY-011 | Done | `app/(app)/venture/[ventureId]`, `services/ventureService.ts` |
| Business development builder | UBY-012 | Done | `app/(app)/venture/[ventureId]/build` |

## P1 — Must demonstrate (spec §54)

| Requirement | Screen(s) | Status | Location |
|---|---|---|---|
| Ask For Help | UBY-013 | Done | `app/(app)/venture/[ventureId]/help`, `services/helpService.ts` |
| Funding & Support | UBY-014 | Done | `app/(app)/venture/[ventureId]/funding`, `services/fundingService.ts`, 8 fictional-provider programmes seeded |
| Funding readiness | §27 | Done | `services/ventureService.ts` (`computeReadiness`), same route as UBY-014 |
| Skills development | UBY-015 | Done | `app/(app)/venture/[ventureId]/learning`, `services/learningService.ts` |
| Launch readiness | UBY-016 | Done | `app/(app)/venture/[ventureId]/launch` |
| Dashboard | UBY-017 | Done | `app/(app)/dashboard` |

## P2 — Nice prototype enhancement (spec §54)

| Requirement | Status | Notes |
|---|---|---|
| Notification centre | Partial | `notifications` table + RLS exist; no dedicated inbox UI — dashboard surfaces the equivalent state directly. |
| Animated progress | Not started | Progress bars/stage tracker are static (no transition animation). |
| Business-plan generation (full doc) | Partial | `AIService.generateBusinessSummary` exists and is unit-testable; not yet wired into a dedicated "generate my business plan" UI action. |
| Additional opportunities/personas beyond the seeded set | Not started | 14 opportunities / 8 personas seeded — comfortably above the §46/§17 minimums; more can be added to `supabase/seed.sql` at any time. |

## Cross-cutting (spec §31, §36-38, §42, §47, §50)

| Requirement | Status | Location |
|---|---|---|
| Demo control panel | Done | `app/demo`, `services/demoService.ts`, `app/api/demo/**` |
| Golden Demo scenario | Done | `supabase/seed.sql`, verified numerically by `services/__tests__/peopleMatchingService.test.ts` |
| AIService abstraction (Mock + Claude) | Done | `services/aiService.ts` |
| Deterministic opportunity/people scoring, pure + unit-tested | Done | `services/opportunityMatchingService.ts`, `services/peopleMatchingService.ts`, `services/__tests__/*` |
| RLS | Done | `supabase/migrations/20260914090100_rls_policies.sql` |
| Prototype data disclaimer | Done | `components/ui/Disclaimer.tsx`, rendered on `/people`, `/opportunity`, `/venture/[id]/funding` |
| Human-readable error handling | Done | `lib/errors.ts`, `lib/api.ts` |
| Responsive across mobile/tablet/desktop | Done | Verified at 390/820/1024/1440px across 12 representative pages (48 checks) — zero horizontal overflow, zero console/page errors. Shell width scales `max-w-xl → md:max-w-2xl → lg:max-w-4xl`; card grids (people matching, venture journey links, demo persona picker) go multi-column above mobile instead of just stretching. |
| No API keys client-side | Done | `ANTHROPIC_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are only read in server-only modules (`services/aiService.ts` `ClaudeAIService`, `lib/supabase/admin.ts`). |

## Explicitly out of scope (spec §5)

Not built, by design: real banking/payment integration, credit scoring, government API
integration, identity verification/KYC, live messaging/video, production ML, native
mobile apps. Where the journey needs these conceptually, the UI provides a simulated
interaction instead (spec §5, §25).

## Verified end-to-end in a real browser (spec §48)

Driven headlessly at 390px width through the full journey — registration/demo-persona
login, onboarding (skills interpretation, profile, resources), people matching,
opportunity recommendation, team formation, venture workspace, business builder, all four
readiness-checklist toggles, all three stage-advance transitions, and launch — ending on
the "Congratulations" screen, with zero console/page/HTTP errors throughout. Three real
bugs were found this way and are fixed:

1. The sticky "Find Our Opportunity" bar on `/people` overlapped the last candidate
   card's action button — fixed with a proper footer bar + bottom padding.
2. `/demo` was not in the middleware's public-path list, so an unauthenticated presenter
   was bounced to `/login` before ever seeing the panel — fixed in
   `lib/supabase/middleware.ts`.
3. The "Ready To Launch" button's visibility check compared `currentStage` against
   `"funding_ready"`, but completing that stage immediately advances `currentStage` to
   `"launch"` — the button could never appear through normal use. Fixed in
   `app/(app)/venture/[ventureId]/page.tsx`.

## Outstanding before a real stakeholder demo

1. Ownership handover per the build & delivery plan §1 (Ubunye-owned Supabase/Vercel/
   domain accounts) — infrastructure, not code; this repo is indifferent to which project
   its env vars point at (docs/decisions.md D10).
2. Before a public deployment: move to Vercel Pro and set `ENABLE_DEMO_PANEL=false`
   (build plan §2.2, docs/decisions.md D4).
