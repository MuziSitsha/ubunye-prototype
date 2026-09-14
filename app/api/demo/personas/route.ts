import { apiRoute, requireDemoPanel } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { listDemoPersonas } from "@/services/demoService";

/** Unauthenticated on purpose: a presenter picks a persona to log in AS from here. */
export const GET = apiRoute(async () => {
  requireDemoPanel();
  const admin = createAdminClient();
  const personas = await listDemoPersonas(admin);
  return { personas };
});
