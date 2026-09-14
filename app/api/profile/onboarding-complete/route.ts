import { apiRoute, requireUser } from "@/lib/api";
import { markOnboardingComplete } from "@/services/profileService";

export const POST = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  await markOnboardingComplete(supabase, userId);
  return { ok: true };
});
