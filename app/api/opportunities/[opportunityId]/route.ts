import { apiRoute, requireUser } from "@/lib/api";
import { getOpportunity } from "@/services/recommendationService";

export const GET = apiRoute(async (_request, { params }) => {
  const { supabase } = await requireUser();
  const { opportunityId } = await params;
  const opportunity = await getOpportunity(supabase, opportunityId);
  return { opportunity };
});
