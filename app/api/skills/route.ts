import { apiRoute, requireUser } from "@/lib/api";
import { addUserSkill, findOrCreateSkill, getUserSkills } from "@/services/profileService";

export const GET = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  const skills = await getUserSkills(supabase, userId);
  return { skills };
});

export const POST = apiRoute(async (request) => {
  const { supabase, userId } = await requireUser();
  const { name, experienceLevel } = (await request.json()) as {
    name: string;
    experienceLevel?: "beginner" | "some_experience" | "experienced" | "expert";
  };
  const skill = await findOrCreateSkill(supabase, name);
  await addUserSkill(supabase, userId, skill.id, {
    experienceLevel: experienceLevel ?? "some_experience",
    source: "manual",
  });
  return { skill };
});
