import { apiRoute, requireUser } from "@/lib/api";
import { getUserResources, setUserResources } from "@/services/profileService";

export const GET = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  const resources = await getUserResources(supabase, userId);
  return { resources };
});

export const PUT = apiRoute(async (request) => {
  const { supabase, userId } = await requireUser();
  const { names } = (await request.json()) as { names: string[] };
  await setUserResources(supabase, userId, names ?? []);
  return { ok: true };
});
