"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fetchJson, ApiError } from "@/lib/fetchJson";

export function LaunchButton({ ventureId }: { ventureId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLaunch() {
    setError(null);
    setLoading(true);
    try {
      await fetchJson(`/api/ventures/${ventureId}/launch`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't launch your business. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      <Button size="lg" fullWidth disabled={loading} onClick={handleLaunch}>
        {loading ? "Launching…" : "Launch Business"}
      </Button>
    </div>
  );
}
