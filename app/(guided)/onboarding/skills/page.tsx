"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import type { UserSkill } from "@/types/domain";

// UBY-004 — Skills Conversation (spec §14)
export default function SkillsPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [interpreted, setInterpreted] = useState(false);
  const [manualSkill, setManualSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInterpret(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await fetchJson<{ skills: UserSkill[] }>("/api/skills/interpret", {
        method: "POST",
        body: JSON.stringify({ description }),
      });
      setSkills((prev) => [...prev, ...result.skills.filter((s) => !prev.some((p) => p.skillId === s.skillId))]);
      setInterpreted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't understand that. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(skillId: string) {
    setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    await fetchJson(`/api/skills/${skillId}`, { method: "DELETE" }).catch(() => {});
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualSkill.trim()) return;
    try {
      const result = await fetchJson<{ skill: { id: string; name: string } }>("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: manualSkill }),
      });
      setSkills((prev) => [
        ...prev,
        { skillId: result.skill.id, name: result.skill.name, confidence: null, experienceLevel: "some_experience", source: "manual" },
      ]);
      setManualSkill("");
    } catch {
      // Non-critical — the field just stays filled so the user can retry.
    }
  }

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await fetchJson("/api/skills/confirm", { method: "POST" });
      router.push("/onboarding/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't save your skills. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="What can you do?" subtitle="Tell Ubunye in your own words" back="/onboarding/welcome" />
      <main className="flex-1 space-y-6 px-6 py-6">
        {!interpreted && (
          <form onSubmit={handleInterpret} className="space-y-4">
            <TextAreaField
              label="Describe what you can do"
              id="description"
              rows={6}
              required
              placeholder="I repair fridges and washing machines. I have worked with my uncle doing electrical work. I can drive and I'm good at fixing things."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" fullWidth disabled={loading || !description.trim()}>
              {loading ? "Understanding…" : "Continue"}
            </Button>
          </form>
        )}

        {interpreted && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-ink">Here&apos;s what we understood</h2>
              <p className="mt-1 text-sm text-ink-muted">Remove anything that&apos;s not right, or add something we missed.</p>
            </div>

            {skills.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-muted">
                We couldn&apos;t pick anything out of that description yet. Try adding a skill below, or go back and
                describe a bit more.
              </p>
            ) : (
              <ul className="space-y-2">
                {skills.map((skill) => (
                  <li
                    key={skill.skillId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{skill.name}</p>
                      {skill.confidence != null && (
                        <p className="text-xs text-ink-muted">{Math.round(skill.confidence * 100)}% confidence</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {skill.source === "ai_interpreted" ? <Badge tone="green">Understood</Badge> : <Badge>Added</Badge>}
                      <button
                        type="button"
                        onClick={() => handleRemove(skill.skillId)}
                        aria-label={`Remove ${skill.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-sand hover:text-ink"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddManual} className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  label="Add a skill we missed"
                  id="manualSkill"
                  placeholder="e.g. Baking"
                  value={manualSkill}
                  onChange={(e) => setManualSkill(e.target.value)}
                />
              </div>
              <Button type="submit" variant="ghost">
                Add
              </Button>
            </form>

            {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}

            <Button size="lg" fullWidth disabled={loading || skills.length === 0} onClick={handleConfirm}>
              {loading ? "Saving…" : "Confirm My Skills"}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
