"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { fetchJson, ApiError } from "@/lib/fetchJson";

interface Persona {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    fetchJson<{ personas: Persona[] }>("/api/demo/personas")
      .then((res) => setPersonas(res.personas))
      .catch(() => setPersonas([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetchJson("/api/auth/login", { method: "POST", body: JSON.stringify(form) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't complete that step. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loginAsPersona(email: string) {
    setError(null);
    setLoading(true);
    try {
      await fetchJson("/api/demo/load-persona", { method: "POST", body: JSON.stringify({ email }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't complete that step. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="Sign in" back="/" />
      <main className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to Ubunye?{" "}
          <Link href="/register" className="font-medium text-gold">
            Create an account
          </Link>
        </p>

        {personas.length > 0 && (
          <div className="mt-10">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-ink-muted">
              Demo personas — Golden Demo (spec §32)
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {personas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={loading}
                  onClick={() => loginAsPersona(p.email)}
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm hover:bg-sand disabled:opacity-50"
                >
                  <span className="block font-medium text-ink">
                    {p.first_name} {p.last_name}
                  </span>
                  <span className="block text-xs text-ink-muted">{p.city}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
