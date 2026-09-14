import { apiRoute, requireUser } from "@/lib/api";
import { getVentureForUser } from "@/services/ventureService";

export const GET = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  const venture = await getVentureForUser(supabase, userId);
  return { venture };
});
