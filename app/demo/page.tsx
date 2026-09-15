"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import type { Profile, Venture } from "@/types/domain";

interface Persona {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string | null;
}

// /demo — Demo Control Panel (spec §31)
export default function DemoPanelPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [venture, setVenture] = useState<Venture | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  async function loadPanelData() {
    const [personasResult, profileResult, ventureResult] = await Promise.all([
      fetchJson<{ personas: Persona[] }>("/api/demo/personas").then(
        (res) => ({ ok: true as const, personas: res.personas }),
        () => ({ ok: false as const, personas: [] as Persona[] })
      ),
      fetchJson<{ profile: Profile }>("/api/profile")
        .then((res) => res.profile)
        .catch(() => null),
      fetchJson<{ venture: Venture | null }>("/api/ventures/mine")
        .then((res) => res.venture)
        .catch(() => null),
    ]);
    return { personasResult, profile: profileResult, venture: ventureResult };
  }

  function applyPanelData(data: Awaited<ReturnType<typeof loadPanelData>>) {
    setEnabled(data.personasResult.ok);
    setPersonas(data.personasResult.personas);
    setProfile(data.profile);
    setVenture(data.venture);
  }

  async function refresh() {
    applyPanelData(await loadPanelData());
  }

  useEffect(() => {
    let cancelled = false;
    loadPanelData().then((data) => {
      if (!cancelled) applyPanelData(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(key: string, action: () => Promise<unknown>, successMessage: string) {
    setError(null);
    setMessage(null);
    setBusy(key);
    try {
      await action();
      setMessage(successMessage);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That action failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (!enabled && personas !== null) {
    return (
      <div className="mx-auto max-w-xl md:max-w-2xl lg:max-w-4xl px-6 py-10">
        <TopBar title="Demo panel" back="/" />
        <p className="mt-6 rounded-xl bg-sand px-4 py-3 text-sm text-ink-muted">
          The demo panel isn&apos;t enabled on this deployment (ENABLE_DEMO_PANEL is not &quot;true&quot;). See
          docs/decisions.md D4.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="Demo control panel" back="/" />
      <main className="space-y-5 px-6 py-6">
        <Disclaimer text="This panel exists to reduce presentation risk during a live demo (spec §31). It is not part of the product a real user would see." />

        {message && <p className="rounded-xl bg-green-light px-3.5 py-2.5 text-sm text-green">{message}</p>}
        {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}

        <Card>
          <h2 className="text-sm font-semibold text-ink">Load demo persona</h2>
          <p className="mt-1 text-xs text-ink-muted">Signs you in as one of the seeded Golden Demo personas (spec §32).</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {(personas ?? []).map((p) => (
              <button
                key={p.id}
                disabled={busy !== null}
                onClick={() =>
                  run(`persona-${p.id}`, () => fetchJson("/api/demo/load-persona", { method: "POST", body: JSON.stringify({ email: p.email }) }), `Signed in as ${p.first_name}.`)
                }
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm hover:bg-sand disabled:opacity-50"
              >
                <span className="block font-medium text-ink">{p.first_name} {p.last_name}</span>
                <span className="block text-xs text-ink-muted">{p.city}</span>
              </button>
            ))}
          </div>
        </Card>

        {profile && (
          <Card>
            <h2 className="text-sm font-semibold text-ink">Current session: {profile.firstName} {profile.lastName}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => run("skip", () => fetchJson("/api/demo/skip-onboarding", { method: "POST" }), "Onboarding skipped using the Golden Demo's Sipho description.")}
              >
                Skip Onboarding
              </Button>
              <Button
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  run("fast-forward", () => fetchJson("/api/demo/fast-forward", { method: "POST" }), "Jumped straight to the venture workspace.")
                }
              >
                Jump to Golden Demo
              </Button>
              {venture && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() =>
                    run("advance", () => fetchJson(`/api/ventures/${venture.id}/advance`, { method: "POST" }), "Business journey advanced.")
                  }
                >
                  Move Business to Next Stage
                </Button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <Link href="/people" className="font-medium text-terracotta">Trigger people match →</Link>
              {venture && (
                <Link href={`/venture/${venture.id}`} className="font-medium text-terracotta">Open venture →</Link>
              )}
            </div>
          </Card>
        )}

        {!profile && (
          <Card>
            <p className="text-sm text-ink-muted">Sign in or load a persona above to unlock session shortcuts.</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => router.push("/login")}>
              Go to sign in
            </Button>
          </Card>
        )}

        <Card className="border-danger/30">
          <h2 className="text-sm font-semibold text-danger">Reset demo</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Clears teams, ventures, recommendations, help requests and notifications, and removes any account that
            isn&apos;t a seeded demo persona. Catalogue data and persona skills/resources are untouched — for a full
            rebuild, run <code className="rounded bg-sand px-1">npm run db:reset</code> instead.
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            disabled={busy !== null}
            onClick={() => run("reset", () => fetchJson("/api/demo/reset", { method: "POST" }), "Demo reset. Session state cleared.")}
          >
            {busy === "reset" ? "Resetting…" : "Reset Demo"}
          </Button>
        </Card>
      </main>
    </div>
  );
}
