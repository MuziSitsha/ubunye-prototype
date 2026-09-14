import { apiRoute, requireUser } from "@/lib/api";
import { markSkillsConfirmed } from "@/services/profileService";

export const POST = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  await markSkillsConfirmed(supabase, userId);
  return { ok: true };
});
