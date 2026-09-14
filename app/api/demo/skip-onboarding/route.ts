import { apiRoute, requireDemoPanel, requireUser } from "@/lib/api";
import { skipOnboarding } from "@/services/demoService";

export const POST = apiRoute(async () => {
  requireDemoPanel();
  const { supabase, userId } = await requireUser();
  await skipOnboarding(supabase, userId);
  return { ok: true };
});
