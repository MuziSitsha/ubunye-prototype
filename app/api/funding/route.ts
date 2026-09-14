import { apiRoute, requireUser } from "@/lib/api";
import { listSupportProgrammes } from "@/services/fundingService";

export const GET = apiRoute(async (request) => {
  const { supabase } = await requireUser();
  const ventureId = new URL(request.url).searchParams.get("ventureId") ?? undefined;
  const programmes = await listSupportProgrammes(supabase, ventureId);
  return { programmes };
});
