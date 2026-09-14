import { apiRoute, requireUser } from "@/lib/api";
import { listAllLearningProgrammes, recommendCoursesForVenture } from "@/services/learningService";

export const GET = apiRoute(async (request) => {
  const { supabase } = await requireUser();
  const ventureId = new URL(request.url).searchParams.get("ventureId");
  const programmes = ventureId
    ? await recommendCoursesForVenture(supabase, ventureId)
    : await listAllLearningProgrammes(supabase);
  return { programmes };
});
