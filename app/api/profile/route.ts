import { apiRoute, requireUser } from "@/lib/api";
import { getProfile, updateProfileDetails } from "@/services/profileService";
import type { Availability, Situation } from "@/types/domain";

export const GET = apiRoute(async () => {
  const { supabase, userId } = await requireUser();
  const profile = await getProfile(supabase, userId);
  return { profile };
});

export const PATCH = apiRoute(async (request) => {
  const { supabase, userId } = await requireUser();
  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string | null;
    province?: string;
    city?: string;
    availability?: Availability;
    situation?: Situation;
  };
  const profile = await updateProfileDetails(supabase, userId, body);
  return { profile };
});
