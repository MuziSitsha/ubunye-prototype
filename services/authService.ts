// Email/password only (spec §41, docs/decisions.md D9). No social login, no MFA.

import { AppError } from "@/lib/errors";
import type { SupabaseClientType } from "@/types/supabase-helpers";

export async function signUp(
  supabase: SupabaseClientType,
  input: { firstName: string; lastName: string; email: string; password: string; mobileNumber?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { first_name: input.firstName, last_name: input.lastName } },
  });

  if (error) throw new AppError(mapAuthError(error.message));
  if (!data.user) throw new AppError("We couldn't create your account. Please try again.");

  if (input.mobileNumber) {
    await supabase.from("profiles").update({ mobile_number: input.mobileNumber }).eq("id", data.user.id);
  }

  return data;
}

export async function signIn(supabase: SupabaseClientType, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AppError(mapAuthError(error.message));
  return data;
}

export async function signOut(supabase: SupabaseClientType) {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AppError("We couldn't sign you out. Please try again.");
}

function mapAuthError(message: string): string {
  if (message.toLowerCase().includes("already registered")) {
    return "That email is already registered. Try signing in instead.";
  }
  if (message.toLowerCase().includes("invalid login")) {
    return "That email or password doesn't match our records.";
  }
  if (message.toLowerCase().includes("password")) {
    return "Your password needs to be at least 6 characters.";
  }
  return "We couldn't complete that step. Please try again.";
}
