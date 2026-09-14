import { apiRoute, requireUser } from "@/lib/api";
import { updateBusinessBuilder } from "@/services/ventureService";

export const PATCH = apiRoute(async (request, { params }) => {
  const { supabase } = await requireUser();
  const { ventureId } = await params;
  const { section, values } = (await request.json()) as {
    section: "business_concept" | "customer" | "operations" | "money";
    values: Record<string, string>;
  };
  const venture = await updateBusinessBuilder(supabase, ventureId, section, values);
  return { venture };
});
