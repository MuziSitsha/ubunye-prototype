// Skills Development (spec §28): compares what the selected opportunity needs against
// what the team already has, and recommends learning programmes that close the gap.

import { AppError } from "@/lib/errors";
import { getMatchProfile } from "@/services/profileService";
import { getOpportunity } from "@/services/recommendationService";
import { getTeam } from "@/services/teamService";
import { getVenture } from "@/services/ventureService";
import type { LearningProgramme } from "@/types/domain";
import type { SupabaseClientType, Tables } from "@/types/supabase-helpers";

function toLearningProgramme(
  row: Tables<"learning_programmes">,
  skillName: string | null
): LearningProgramme {
  return {
    id: row.id,
    skillId: row.skill_id,
    skillName,
    title: row.title,
    reason: row.reason,
    provider: row.provider,
    format: row.format as LearningProgramme["format"],
    duration: row.duration,
    url: row.url,
    isDemoData: row.is_demo_data,
  };
}

/** Recommended courses for a venture: skills its opportunity needs that the team doesn't have yet. */
export async function recommendCoursesForVenture(
  supabase: SupabaseClientType,
  ventureId: string
): Promise<LearningProgramme[]> {
  const venture = await getVenture(supabase, ventureId);
  const [opportunity, team] = await Promise.all([
    getOpportunity(supabase, venture.opportunityId),
    getTeam(supabase, venture.teamId),
  ]);

  const teamMatchProfiles = await Promise.all(team.members.map((m) => getMatchProfile(supabase, m.userId)));
  const teamSkillIds = new Set(teamMatchProfiles.flatMap((p) => p.skills.map((s) => s.skillId)));

  const missingSkillIds = [...opportunity.requiredSkills, ...opportunity.preferredSkills]
    .map((s) => s.skillId)
    .filter((id) => !teamSkillIds.has(id));

  const filters = [...new Set(missingSkillIds)].map((id) => `skill_id.eq.${id}`);
  filters.push("skill_id.is.null"); // general courses (e.g. pricing) are always relevant

  const { data, error } = await supabase.from("learning_programmes").select("*, skills(name)").or(filters.join(","));

  if (error) throw new AppError("We couldn't load skills development recommendations. Please try again.", error);

  return (data ?? []).map((row) =>
    toLearningProgramme(row, (row.skills as unknown as { name: string } | null)?.name ?? null)
  );
}

export async function listAllLearningProgrammes(supabase: SupabaseClientType): Promise<LearningProgramme[]> {
  const { data, error } = await supabase.from("learning_programmes").select("*, skills(name)").order("title");
  if (error) throw new AppError("We couldn't load skills development options. Please try again.", error);
  return (data ?? []).map((row) =>
    toLearningProgramme(row, (row.skills as unknown as { name: string } | null)?.name ?? null)
  );
}
