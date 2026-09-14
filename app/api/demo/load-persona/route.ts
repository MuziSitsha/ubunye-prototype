import { apiRoute, requireDemoPanel } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { signIn } from "@/services/authService";
import { DEMO_PASSWORD, DEMO_PERSONA_EMAILS } from "@/services/demoService";

export const POST = apiRoute(async (request) => {
  requireDemoPanel();
  const { email } = (await request.json()) as { email: string };

  if (!DEMO_PERSONA_EMAILS.includes(email as (typeof DEMO_PERSONA_EMAILS)[number])) {
    throw new AppError("That isn't a recognised demo persona.");
  }

  const supabase = await createClient();
  await signIn(supabase, email, DEMO_PASSWORD);
  return { ok: true };
});
