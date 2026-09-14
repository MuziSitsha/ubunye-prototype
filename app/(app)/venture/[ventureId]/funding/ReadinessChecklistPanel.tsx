"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { fetchJson } from "@/lib/fetchJson";
import type { ReadinessChecklist } from "@/services/ventureService";

const LABELS: { key: keyof ReadinessChecklist; label: string }[] = [
  { key: "company_registered", label: "Complete registration" },
  { key: "bank_account_opened", label: "Open business bank account" },
  { key: "safety_certification_complete", label: "Complete safety certification" },
  { key: "supporting_documents_ready", label: "Prepare required supporting documents" },
];

/**
 * These four items are manually toggled by the team (spec §5 — no real registration/
 * banking/compliance integration exists in this prototype). Marking one complete is a
 * simulated action, matching the "Request submitted" pattern used elsewhere.
 */
export function ReadinessChecklistPanel({ ventureId, checklist }: { ventureId: string; checklist: ReadinessChecklist }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(key: keyof ReadinessChecklist) {
    setPending(key);
    try {
      await fetchJson(`/api/ventures/${ventureId}/readiness`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: !checklist[key] }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">Remaining Actions</h2>
      <ul className="mt-2 space-y-2">
        {LABELS.map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between gap-3">
            <span className={`text-sm ${checklist[key] ? "text-ink line-through" : "text-ink"}`}>{label}</span>
            <button
              type="button"
              disabled={pending === key}
              onClick={() => toggle(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                checklist[key] ? "bg-green-light text-green" : "border border-border text-ink-muted hover:bg-sand"
              }`}
            >
              {checklist[key] ? "Done" : "Mark done"}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
