"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fetchJson, ApiError } from "@/lib/fetchJson";

export function AdvanceStageButton({ ventureId, label }: { ventureId: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      await fetchJson(`/api/ventures/${ventureId}/advance`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't update your journey. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-2 rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      <Button size="md" disabled={loading} onClick={handleClick}>
        {loading ? "Updating…" : label}
      </Button>
    </div>
  );
}
