import { apiRoute, requireUser } from "@/lib/api";
import { computeReadiness, updateReadinessChecklist, type ReadinessChecklist } from "@/services/ventureService";

export const GET = apiRoute(async (_request, { params }) => {
  const { supabase } = await requireUser();
  const { ventureId } = await params;
  const readiness = await computeReadiness(supabase, ventureId);
  return { readiness };
});

export const PATCH = apiRoute(async (request, { params }) => {
  const { supabase } = await requireUser();
  const { ventureId } = await params;
  const patch = (await request.json()) as Partial<ReadinessChecklist>;
  await updateReadinessChecklist(supabase, ventureId, patch);
  const readiness = await computeReadiness(supabase, ventureId);
  return { readiness };
});
