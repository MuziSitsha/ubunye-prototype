import { apiRoute, requireUser } from "@/lib/api";
import { getOpportunity } from "@/services/recommendationService";
import { createTeam } from "@/services/teamService";
import { createVenture } from "@/services/ventureService";

/** Forms the team and immediately opens its venture workspace (spec UBY-010 -> UBY-011). */
export const POST = apiRoute(async (request) => {
  const { supabase, userId } = await requireUser();
  const { teamName, opportunityId, memberUserIds } = (await request.json()) as {
    teamName: string;
    opportunityId: string;
    memberUserIds: string[];
  };

  const opportunity = await getOpportunity(supabase, opportunityId);
  const team = await createTeam(supabase, userId, teamName, opportunityId, memberUserIds ?? []);
  const venture = await createVenture(supabase, team.id, opportunityId, `${teamName} — ${opportunity.name}`);

  return { team, venture };
});
