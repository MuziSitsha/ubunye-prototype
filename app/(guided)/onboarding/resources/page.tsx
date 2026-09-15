"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { fetchJson, ApiError } from "@/lib/fetchJson";

// UBY-006 — What Do You Have Access To? (spec §12)
const RESOURCE_OPTIONS = [
  "Vehicle",
  "Smartphone",
  "Laptop",
  "Tools",
  "Workspace",
  "Kitchen",
  "Machinery",
  "Internet",
  "Storage",
  "Existing Customers",
  "Startup Capital",
  "Professional Certification",
  "Other",
];

export default function ResourcesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await fetchJson("/api/resources", { method: "PUT", body: JSON.stringify({ names: [...selected] }) });
      await fetchJson("/api/profile/onboarding-complete", { method: "POST" });
      router.push("/onboarding/complete");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't save that. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="What do you have access to?" subtitle="Select everything that applies" back="/onboarding/profile" />
      <main className="flex-1 px-6 py-6">
        <div className="flex flex-wrap gap-2">
          {RESOURCE_OPTIONS.map((name) => {
            const active = selected.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "border-gold bg-gold-light text-gold-dark" : "border-border bg-surface text-ink hover:bg-sand"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}

        <Button size="lg" fullWidth className="mt-8" disabled={loading} onClick={handleSubmit}>
          {loading ? "Saving…" : "Continue"}
        </Button>
      </main>
    </div>
  );
}
