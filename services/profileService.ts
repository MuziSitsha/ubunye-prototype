import { AppError } from "@/lib/errors";
import type { Availability, MatchProfile, Profile, Situation, UserSkill } from "@/types/domain";
import type { SupabaseClientType, Tables } from "@/types/supabase-helpers";

function toProfile(row: Tables<"profiles">): Profile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    mobileNumber: row.mobile_number,
    province: row.province,
    city: row.city,
    availability: row.availability as Availability | null,
    situation: row.situation as Situation | null,
    onboardingCompletedAt: row.onboarding_completed_at,
    skillsConfirmedAt: row.skills_confirmed_at,
    isDemoPersona: row.is_demo_persona,
  };
}

export async function getProfile(supabase: SupabaseClientType, userId: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) throw new AppError("We couldn't load your profile. Please try again.", error);
  return toProfile(data);
}

export async function updateProfileDetails(
  supabase: SupabaseClientType,
  userId: string,
  details: {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string | null;
    province?: string;
    city?: string;
    availability?: Availability;
    situation?: Situation;
  }
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: details.firstName,
      last_name: details.lastName,
      mobile_number: details.mobileNumber,
      province: details.province,
      city: details.city,
      availability: details.availability,
      situation: details.situation,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) throw new AppError("We couldn't save your details. Please try again.", error);
  return toProfile(data);
}

export async function markOnboardingComplete(supabase: SupabaseClientType, userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new AppError("We couldn't finish onboarding. Please try again.", error);
}

export async function getUserSkills(supabase: SupabaseClientType, userId: string): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from("user_skills")
    .select("skill_id, confidence, experience_level, source, skills(name)")
    .eq("user_id", userId);

  if (error) throw new AppError("We couldn't load your skills. Please try again.", error);

  return (data ?? []).map((row) => ({
    skillId: row.skill_id,
    name: (row.skills as unknown as { name: string } | null)?.name ?? "Unknown skill",
    confidence: row.confidence,
    experienceLevel: row.experience_level as UserSkill["experienceLevel"],
    source: row.source as UserSkill["source"],
  }));
}

/** Finds an existing skill by case-insensitive name, or creates it. Keeps the catalogue open. */
export async function findOrCreateSkill(
  supabase: SupabaseClientType,
  name: string
): Promise<{ id: string; name: string }> {
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from("skills")
    .select("id, name")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("skills")
    .insert({ name: trimmed })
    .select("id, name")
    .single();

  if (error || !created) throw new AppError("We couldn't save that skill. Please try again.", error);
  return created;
}

export async function findOrCreateResource(
  supabase: SupabaseClientType,
  name: string
): Promise<{ id: string; name: string }> {
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from("resources")
    .select("id, name")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("resources")
    .insert({ name: trimmed })
    .select("id, name")
    .single();

  if (error || !created) throw new AppError("We couldn't save that resource. Please try again.", error);
  return created;
}

export async function removeUserSkill(supabase: SupabaseClientType, userId: string, skillId: string) {
  const { error } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", userId)
    .eq("skill_id", skillId);
  if (error) throw new AppError("We couldn't remove that skill. Please try again.", error);
}

export async function addUserSkill(
  supabase: SupabaseClientType,
  userId: string,
  skillId: string,
  options: { confidence?: number; experienceLevel?: UserSkill["experienceLevel"]; source?: UserSkill["source"] } = {}
) {
  const { error } = await supabase.from("user_skills").upsert(
    {
      user_id: userId,
      skill_id: skillId,
      confidence: options.confidence ?? null,
      experience_level: options.experienceLevel ?? "some_experience",
      source: options.source ?? "manual",
    },
    { onConflict: "user_id,skill_id" }
  );
  if (error) throw new AppError("We couldn't save that skill. Please try again.", error);
}

export async function markSkillsConfirmed(supabase: SupabaseClientType, userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ skills_confirmed_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new AppError("We couldn't confirm your skills. Please try again.", error);
}

export async function getUserResources(
  supabase: SupabaseClientType,
  userId: string
): Promise<{ resourceId: string; name: string }[]> {
  const { data, error } = await supabase
    .from("user_resources")
    .select("resource_id, resources(name)")
    .eq("user_id", userId);
  if (error) throw new AppError("We couldn't load your resources. Please try again.", error);
  return (data ?? []).map((row) => ({
    resourceId: row.resource_id,
    name: (row.resources as unknown as { name: string } | null)?.name ?? "Unknown resource",
  }));
}

/** Replaces the user's full resource set with the given resource names (spec §12: multi-select). */
export async function setUserResources(supabase: SupabaseClientType, userId: string, resourceNames: string[]) {
  const resources = await Promise.all(resourceNames.map((name) => findOrCreateResource(supabase, name)));

  const { error: deleteError } = await supabase.from("user_resources").delete().eq("user_id", userId);
  if (deleteError) throw new AppError("We couldn't save your resources. Please try again.", deleteError);

  if (resources.length === 0) return;

  const { error: insertError } = await supabase
    .from("user_resources")
    .insert(resources.map((r) => ({ user_id: userId, resource_id: r.id })));
  if (insertError) throw new AppError("We couldn't save your resources. Please try again.", insertError);
}

/** Builds the pure MatchProfile the matching engines need (services/*MatchingService.ts). */
export async function getMatchProfile(supabase: SupabaseClientType, userId: string): Promise<MatchProfile> {
  const [profile, skills, resources] = await Promise.all([
    getProfile(supabase, userId),
    getUserSkills(supabase, userId),
    getUserResources(supabase, userId),
  ]);

  return {
    userId,
    city: profile.city,
    province: profile.province,
    availability: profile.availability,
    skills: skills.map((s) => ({ skillId: s.skillId, skillName: s.name, experienceLevel: s.experienceLevel })),
    resources: resources.map((r) => ({ resourceId: r.resourceId, resourceName: r.name })),
  };
}

/** The full candidate pool for people matching: every other user with a confirmed profile. */
export async function listCandidateMatchProfiles(
  supabase: SupabaseClientType,
  excludeUserId: string
): Promise<{ profile: Profile; matchProfile: MatchProfile }[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", excludeUserId)
    .not("onboarding_completed_at", "is", null);

  if (error) throw new AppError("We couldn't load potential teammates. Please try again.", error);

  const results = await Promise.all(
    (profiles ?? []).map(async (row) => {
      const profile = toProfile(row);
      const matchProfile = await getMatchProfile(supabase, profile.id);
      return { profile, matchProfile };
    })
  );

  return results;
}
