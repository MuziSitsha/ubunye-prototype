// Demo control panel logic (spec §31). Every export here is only ever called from
// app/api/demo/**, which is gated behind ENABLE_DEMO_PANEL (docs/decisions.md D4).
// Scope of "reset": clears session state created by interacting with the app (teams,
// ventures, recommendations, help requests, notifications) and removes any account that
// isn't one of the seeded demo personas. It does not touch the catalogue (skills,
// resources, opportunities, support/learning programmes) or the personas' own seeded
// skills/resources — for a full rebuild-from-empty, use `npm run db:reset` instead
// (docs/decisions.md D6).

import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { interpretAndStageSkills } from "@/services/skillInterpreterService";
import { markOnboardingComplete, markSkillsConfirmed, setUserResources, updateProfileDetails } from "@/services/profileService";
import { getOpportunity, recommendOpportunityForTeam, recommendPeopleForUser } from "@/services/recommendationService";
import { createTeam } from "@/services/teamService";
import { createVenture } from "@/services/ventureService";
import type { SupabaseClientType } from "@/types/supabase-helpers";

export const DEMO_PERSONA_EMAILS = [
  "sipho@ubunye.demo",
  "thandi@ubunye.demo",
  "kabelo@ubunye.demo",
  "naledi@ubunye.demo",
  "lindiwe@ubunye.demo",
  "themba@ubunye.demo",
  "zanele@ubunye.demo",
  "bongani@ubunye.demo",
] as const;

export const DEMO_PASSWORD = "Ubunye-Demo-2026";

export async function listDemoPersonas(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, city, is_demo_persona")
    .eq("is_demo_persona", true)
    .order("first_name");
  if (error) throw new AppError("We couldn't load demo personas.", error);
  return data ?? [];
}

/** Clears interaction state and removes any non-demo accounts. Requires the service-role client. */
export async function resetDemo() {
  const admin = createAdminClient();

  await admin.from("help_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("recommendations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("ventures").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // cascades venture_stages
  await admin.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // cascades team_members

  const { data: nonDemoProfiles } = await admin.from("profiles").select("id").eq("is_demo_persona", false);
  for (const profile of nonDemoProfiles ?? []) {
    await admin.auth.admin.deleteUser(profile.id); // cascades profiles/user_skills/user_resources
  }

  return { ok: true, removedAccounts: nonDemoProfiles?.length ?? 0 };
}

/**
 * Fast-forwards the SIGNED-IN user through onboarding using the Golden Demo's Sipho
 * description (spec §55 step 1), so a presenter can skip manual typing during a live demo.
 */
export async function skipOnboarding(supabase: SupabaseClientType, userId: string) {
  await updateProfileDetails(supabase, userId, {
    province: "Gauteng",
    city: "Johannesburg",
    availability: "full_time",
    situation: "unemployed",
  });
  await interpretAndStageSkills(
    supabase,
    userId,
    "I repair fridges and washing machines. I have worked with my uncle doing electrical work. I can drive and I'm good at fixing things."
  );
  await markSkillsConfirmed(supabase, userId);
  await setUserResources(supabase, userId, ["Tools"]);
  await markOnboardingComplete(supabase, userId);
}

/**
 * Runs the entire Golden Demo journey (spec §32, §55) for the signed-in user in one call:
 * people match -> opportunity recommendation -> team formation -> venture workspace.
 * Intended for the demo panel's "Jump to Golden Demo" shortcut.
 */
export async function fastForwardGoldenDemo(supabase: SupabaseClientType, userId: string) {
  const peopleResult = await recommendPeopleForUser(supabase, userId);
  const topThreeIds = peopleResult.people.slice(0, 3).map((p) => p.profile.id);

  const opportunityResult = await recommendOpportunityForTeam(supabase, userId, topThreeIds);
  const opportunity = await getOpportunity(supabase, opportunityResult.opportunity.id);

  const team = await createTeam(supabase, userId, `Team ${opportunity.name}`, opportunity.id, topThreeIds);
  const venture = await createVenture(supabase, team.id, opportunity.id, `${team.name} — ${opportunity.name}`);

  return { people: peopleResult, opportunity: opportunityResult, team, venture };
}
