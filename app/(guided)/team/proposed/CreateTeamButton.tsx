"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import type { Team, Venture } from "@/types/domain";

export function CreateTeamButton({
  teamName,
  opportunityId,
  memberUserIds,
}: {
  teamName: string;
  opportunityId: string;
  memberUserIds: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    setLoading(true);
    try {
      const result = await fetchJson<{ team: Team; venture: Venture }>("/api/teams", {
        method: "POST",
        body: JSON.stringify({ teamName, opportunityId, memberUserIds }),
      });
      router.push(`/venture/${result.venture.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't create your team. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      <Button size="lg" fullWidth disabled={loading} onClick={handleCreate}>
        {loading ? "Creating your team…" : "Create Team"}
      </Button>
    </div>
  );
}
