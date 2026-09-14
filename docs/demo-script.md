# Golden Demo Script

The scripted, must-never-fail journey (spec §32, §55). Run `npm run db:reset` before a
presentation if the dataset might have drifted (e.g. from a previous demo run) —
`npm run dev` alone does not touch the database.

Demo persona password (all 8 seeded accounts): `Ubunye-Demo-2026`
(`supabase/seed.sql` — search `crypt('Ubunye-Demo-2026'`).

## The story (spec §55)

1. **Sipho** says: *"I repair fridges and washing machines and know a little electrical
   work."*
2. Ubunye understands his skills.
3. Ubunye identifies what's missing.
4. Ubunye finds **Thandi**, **Kabelo** and **Naledi**.
5. Combined abilities create a stronger economic unit.
6. Ubunye checks available opportunities.
7. Ubunye recommends: **Mobile Appliance Repair Service**.
8. Ubunye explains why.
9. They form a team.
10. Ubunye identifies missing business/technical capabilities.
11. Training recommendations close skill gaps.
12. Business-development support improves readiness.
13. Funding/support programmes become relevant.
14. The team reaches launch readiness.

## Two ways to run it

### A — Live, step by step (recommended for a real audience)

1. Open `/` → **Get Started**.
2. Register a fresh account (or `/login` → pick **Sipho** from the demo persona list if
   you'd rather skip account creation on stage).
3. `/onboarding/skills` — type (or read aloud while typing) Sipho's line: *"I repair
   fridges and washing machines. I have worked with my uncle doing electrical work. I can
   drive and I'm good at fixing things."* → **Continue**. Watch the interpreted skills
   appear (Appliance Repair, Electrical Maintenance, Fault Diagnosis, Driving) →
   **Confirm My Skills**.
4. `/onboarding/profile` — Gauteng / Johannesburg, Full time, Unemployed → **Continue**.
5. `/onboarding/resources` — select **Tools** → **Continue**.
6. `/onboarding/complete` — review the profile summary → **Find Opportunities**.
7. `/people` — Thandi, Kabelo and Naledi should be the top three cards, each with a
   plain-language "why matched" line naming the specific gap they close. Select all
   three → **Find Our Opportunity**.
8. `/opportunity` — **Mobile Appliance Repair Service** at a high match percentage, the
   "Why this could work" checklist, and the four-section breakdown (Your Team / What
   Customers Need / What You Already Have / What You Are Missing) → **Build This
   Business**.
9. `/team/proposed` — confirm the four-person roster and combined capability list →
   **Create Team**. This creates the venture and opens the workspace.
10. `/venture/[id]` — walk the stage tracker, then open **Skills Development** (shows the
    bookkeeping/electrical-safety gap courses) and **Funding & Support** (shows readiness
    percentage + fictional-provider programme cards).
11. Toggle a couple of readiness-checklist items, advance the stage a couple of times,
    then open `/venture/[id]/launch` → **Launch Business** → the congratulations screen.

### B — Compressed, for a time-boxed pitch

1. `/demo` → **Load demo persona** → Sipho.
2. **Skip Onboarding** (fills in Sipho's profile + skills instantly).
3. **Jump to Golden Demo** (runs people match → opportunity recommendation → team
   formation → venture creation in one call).
4. **Open venture →** to show the resulting workspace, then narrate from there.

Path B is the fallback if a live audience is short on time or the venue's connectivity is
unreliable — it still exercises the same deterministic services as path A, just without
the manual typing.

## Resetting between runs

`/demo` → **Reset Demo** clears teams/ventures/recommendations/help
requests/notifications and removes any account created during the demo that isn't one of
the 8 seeded personas — safe to run between back-to-back presentations without touching
Docker. For a full rebuild from empty, use `npm run db:reset` instead (see
docs/decisions.md D6).

## If something looks wrong on the day

- Golden Demo ranking (Thandi → Kabelo → Naledi, then Mobile Appliance Repair Service
  winning by a wide margin) is covered by
  `services/__tests__/peopleMatchingService.test.ts` — if that test is green, the ranking
  is correct and the issue is elsewhere (stale seed data → `npm run db:reset`).
- If `ENABLE_DEMO_PANEL` is not `"true"` in `.env.local`, `/demo` shows a disabled notice
  instead of the panel — check `.env.local` against `.env.example`.
