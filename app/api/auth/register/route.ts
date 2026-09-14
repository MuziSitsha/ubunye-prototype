import { apiRoute } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { signUp } from "@/services/authService";

export const POST = apiRoute(async (request) => {
  const body = (await request.json()) as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobileNumber?: string;
  };
  const supabase = await createClient();
  await signUp(supabase, body);
  return { ok: true };
});
