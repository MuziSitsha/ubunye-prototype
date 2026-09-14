import { apiRoute } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "@/services/authService";

export const POST = apiRoute(async (request) => {
  const { email, password } = (await request.json()) as { email: string; password: string };
  const supabase = await createClient();
  await signIn(supabase, email, password);
  return { ok: true };
});
