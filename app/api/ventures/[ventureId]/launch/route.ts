import { apiRoute, requireUser } from "@/lib/api";
import { launchVenture } from "@/services/ventureService";

export const POST = apiRoute(async (_request, { params }) => {
  const { supabase } = await requireUser();
  const { ventureId } = await params;
  const venture = await launchVenture(supabase, ventureId);
  return { venture };
});
