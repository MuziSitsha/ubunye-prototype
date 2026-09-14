import { apiRoute, requireUser } from "@/lib/api";
import { recommendPeopleForUser } from "@/services/recommendationService";

export const GET = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  const result = await recommendPeopleForUser(supabase, userId);
  return result;
});
