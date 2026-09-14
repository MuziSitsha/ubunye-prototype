import { apiRoute, requireDemoPanel, requireUser } from "@/lib/api";
import { fastForwardGoldenDemo } from "@/services/demoService";

export const POST = apiRoute(async () => {
  requireDemoPanel();
  const { supabase, userId } = await requireUser();
  const result = await fastForwardGoldenDemo(supabase, userId);
  return result;
});
