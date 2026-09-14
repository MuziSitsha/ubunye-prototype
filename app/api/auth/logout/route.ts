import { apiRoute } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/services/authService";

export const POST = apiRoute(async () => {
  const supabase = await createClient();
  await signOut(supabase);
  return { ok: true };
});
