import { apiRoute, requireUser } from "@/lib/api";
import { listHelpRequests, submitHelpRequest } from "@/services/helpService";
import type { HelpTopic } from "@/types/domain";

export const GET = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  const requests = await listHelpRequests(supabase, userId);
  return { requests };
});

export const POST = apiRoute(async (request) => {
  const { supabase, userId } = await requireUser();
  const { topic, ventureId, message } = (await request.json()) as {
    topic: HelpTopic;
    ventureId?: string;
    message?: string;
  };
  const result = await submitHelpRequest(supabase, userId, topic, { ventureId, message });
  return result;
});
