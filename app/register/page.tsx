"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { fetchJson, ApiError } from "@/lib/fetchJson";

// UBY-002 — Registration (spec §9)
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", mobileNumber: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetchJson("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push("/onboarding/welcome");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't complete that step. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="Create your account" back="/" />
      <main className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="First name"
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <TextField
              label="Last name"
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <TextField
            label="Email"
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Password"
            id="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <TextField
            label="Mobile number (optional)"
            id="mobileNumber"
            type="tel"
            value={form.mobileNumber}
            onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
          />

          {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Creating your account…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gold">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
