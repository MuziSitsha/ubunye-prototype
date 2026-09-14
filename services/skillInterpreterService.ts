// Wraps AIService.interpretSkills (spec §14) and resolves the interpreted names against
// the skills catalogue, staging them as unconfirmed user_skills for the UBY-004 "Here's
// what we understood" confirm/edit/remove step. Confirmation itself is profileService's job.

import { getAIService } from "@/services/aiService";
import { addUserSkill, findOrCreateSkill } from "@/services/profileService";
import type { UserSkill } from "@/types/domain";
import type { SupabaseClientType } from "@/types/supabase-helpers";

export async function interpretSkills(description: string) {
  if (!description.trim()) {
    return { skills: [] };
  }
  return getAIService().interpretSkills(description);
}

/**
 * Interprets free-text, resolves each result to a skill row (creating new ones as needed),
 * and stages them as ai_interpreted user_skills. Returns the staged skills for the user to
 * confirm/edit/remove client-side before profileService.markSkillsConfirmed is called.
 */
export async function interpretAndStageSkills(
  supabase: SupabaseClientType,
  userId: string,
  description: string
): Promise<UserSkill[]> {
  const interpretation = await interpretSkills(description);

  const staged: UserSkill[] = [];
  for (const s of interpretation.skills) {
    const skill = await findOrCreateSkill(supabase, s.name);
    await addUserSkill(supabase, userId, skill.id, {
      confidence: s.confidence,
      experienceLevel: "some_experience",
      source: "ai_interpreted",
    });
    staged.push({
      skillId: skill.id,
      name: skill.name,
      confidence: s.confidence,
      experienceLevel: "some_experience",
      source: "ai_interpreted",
    });
  }

  return staged;
}
