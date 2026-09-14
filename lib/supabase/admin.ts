import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * service_role client. Bypasses RLS entirely — never import this from a Client
 * Component and never let it run anywhere but a Route Handler under app/api/demo/**,
 * gated by ENABLE_DEMO_PANEL. See docs/decisions.md D4.
 */
export function createAdminClient() {
  if (process.env.ENABLE_DEMO_PANEL !== "true") {
    throw new Error(
      "createAdminClient() called while ENABLE_DEMO_PANEL is not \"true\". " +
        "The service-role client is only for the gated /api/demo/** routes."
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
