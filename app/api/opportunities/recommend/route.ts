import { apiRoute, requireUser } from "@/lib/api";
import { recommendOpportunityForTeam } from "@/services/recommendationService";

export const POST = apiRoute(async (request) => {
  const { supabase, userId } = await requireUser();
  const { memberUserIds } = (await request.json()) as { memberUserIds: string[] };
  const result = await recommendOpportunityForTeam(supabase, userId, memberUserIds ?? []);
  return result;
});
