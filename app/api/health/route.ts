import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Trivial DB round-trip. Two jobs (build plan §2.1):
 *   1. A daily ping target for the keep-alive workflow (.github/workflows/keep-alive.yml)
 *      that resets Supabase Free's 7-day inactivity pause timer with a 6-day buffer.
 *   2. A fast, no-auth-required liveness check for uptime monitoring.
 * Reads the public `skills` catalogue — always present, never empty, no RLS surprises.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("skills").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
