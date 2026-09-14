import { apiRoute, requireUser } from "@/lib/api";
import { getOpportunity } from "@/services/recommendationService";
import { getTeam } from "@/services/teamService";
import { computeReadiness, getVenture, getVentureStages } from "@/services/ventureService";

export const GET = apiRoute(async (_request, { params }) => {
  const { supabase } = await requireUser();
  const { ventureId } = await params;

  const venture = await getVenture(supabase, ventureId);
  const [stages, team, opportunity, readiness] = await Promise.all([
    getVentureStages(supabase, ventureId),
    getTeam(supabase, venture.teamId),
    getOpportunity(supabase, venture.opportunityId),
    computeReadiness(supabase, ventureId),
  ]);

  return { venture, stages, team, opportunity, readiness };
});
