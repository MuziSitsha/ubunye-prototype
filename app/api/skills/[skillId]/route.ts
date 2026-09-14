import { apiRoute, requireUser } from "@/lib/api";
import { removeUserSkill } from "@/services/profileService";

export const DELETE = apiRoute(async (_request, { params }) => {
  const { supabase, userId } = await requireUser();
  const { skillId } = await params;
  await removeUserSkill(supabase, userId, skillId);
  return { ok: true };
});
