import { apiRoute, requireUser } from "@/lib/api";
import { advanceStage } from "@/services/ventureService";

export const POST = apiRoute(async (_request, { params }) => {
  const { supabase } = await requireUser();
  const { ventureId } = await params;
  const venture = await advanceStage(supabase, ventureId);
  return { venture };
});
