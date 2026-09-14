import { apiRoute, requireUser } from "@/lib/api";
import { interpretAndStageSkills } from "@/services/skillInterpreterService";

export const POST = apiRoute(async (request) => {
  const { supabase, userId } = await requireUser();
  const { description } = (await request.json()) as { description: string };
  const skills = await interpretAndStageSkills(supabase, userId, description ?? "");
  return { skills };
});
