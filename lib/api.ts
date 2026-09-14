import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, toUserMessage } from "@/lib/errors";

/** Guards every /api/demo/** route (docs/decisions.md D4). */
export function requireDemoPanel() {
  if (process.env.ENABLE_DEMO_PANEL !== "true") {
    throw new AppError("The demo panel is not enabled on this deployment.");
  }
}

/** Resolves the signed-in user for a Route Handler, or throws a human-readable AppError. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new AppError("Please sign in to continue.");
  return { supabase, userId: user.id };
}

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Wraps a Route Handler body: catches anything thrown, logs the real error server-side
 * (spec §51 — never logs secrets, just what failed), and always returns a human-readable
 * message to the client (spec §50) instead of a stack trace or raw DB error.
 */
export function apiRoute<T>(handler: (request: Request, context: RouteContext) => Promise<T>) {
  return async (request: Request, context: RouteContext) => {
    try {
      const result = await handler(request, context);
      return NextResponse.json(result ?? {});
    } catch (error) {
      if (!(error instanceof AppError)) {
        console.error("[api]", error);
      }
      const status = error instanceof AppError && error.message === "Please sign in to continue." ? 401 : 400;
      return NextResponse.json({ error: toUserMessage(error) }, { status });
    }
  };
}
