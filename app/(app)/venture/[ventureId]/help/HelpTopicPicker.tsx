"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import { HELP_TOPICS } from "@/services/helpService";
import type { HelpTopic } from "@/types/domain";

export function HelpTopicPicker({ ventureId }: { ventureId: string }) {
  const [submitted, setSubmitted] = useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = useState<HelpTopic | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(topic: HelpTopic) {
    setError(null);
    setLoading(topic);
    try {
      const result = await fetchJson<{ topicInfo: { title: string; description: string } }>("/api/help", {
        method: "POST",
        body: JSON.stringify({ topic, ventureId }),
      });
      setSubmitted(result.topicInfo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't submit that. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (submitted) {
    return (
      <Card>
        <h2 className="text-base font-semibold text-ink">{submitted.title}</h2>
        <p className="mt-2 text-sm text-ink-muted">{submitted.description}</p>
        <p className="mt-4 rounded-xl bg-green-light px-3.5 py-2.5 text-sm font-medium text-green">Request submitted</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSubmitted(null)}>
          Ask about something else
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      {HELP_TOPICS.map((topic) => (
        <button
          key={topic.value}
          type="button"
          disabled={loading !== null}
          onClick={() => handleRequest(topic.value)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-ink hover:bg-sand disabled:opacity-50"
        >
          {topic.label}
          <span className="text-ink-muted">{loading === topic.value ? "…" : "→"}</span>
        </button>
      ))}
    </div>
  );
}
