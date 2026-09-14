"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SelectField, TextField } from "@/components/ui/FormField";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import { CITIES_BY_PROVINCE, PROVINCES } from "@/data/southAfricanLocations";
import type { Availability, Profile, Situation, UserSkill } from "@/types/domain";

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "weekends", label: "Weekends" },
  { value: "evenings", label: "Evenings" },
];

const SITUATION_OPTIONS: { value: Situation; label: string }[] = [
  { value: "unemployed", label: "Unemployed" },
  { value: "under_employed", label: "Under-employed" },
  { value: "informally_employed", label: "Informally employed" },
  { value: "employed_seeking", label: "Employed but seeking additional opportunity" },
];

const RESOURCE_OPTIONS = [
  "Vehicle", "Smartphone", "Laptop", "Tools", "Workspace", "Kitchen", "Machinery",
  "Internet", "Storage", "Existing Customers", "Startup Capital", "Professional Certification", "Other",
];

export function ProfileEditor({
  profile,
  initialSkills,
  initialResourceNames,
}: {
  profile: Profile;
  initialSkills: UserSkill[];
  initialResourceNames: string[];
}) {
  const router = useRouter();
  const [province, setProvince] = useState(profile.province ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [availability, setAvailability] = useState<Availability | "">(profile.availability ?? "");
  const [situation, setSituation] = useState<Situation | "">(profile.situation ?? "");
  const [skills, setSkills] = useState(initialSkills);
  const [newSkill, setNewSkill] = useState("");
  const [resources, setResources] = useState<Set<string>>(new Set(initialResourceNames));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingResources, setSavingResources] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function saveProfile() {
    setError(null);
    setSavingProfile(true);
    try {
      await fetchJson("/api/profile", { method: "PATCH", body: JSON.stringify({ province, city, availability, situation }) });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't save that. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function addSkill() {
    if (!newSkill.trim()) return;
    try {
      const result = await fetchJson<{ skill: { id: string; name: string } }>("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: newSkill }),
      });
      setSkills((prev) => [
        ...prev,
        { skillId: result.skill.id, name: result.skill.name, confidence: null, experienceLevel: "some_experience", source: "manual" },
      ]);
      setNewSkill("");
    } catch {
      // Field stays filled so the user can retry.
    }
  }

  async function removeSkill(skillId: string) {
    setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    await fetchJson(`/api/skills/${skillId}`, { method: "DELETE" }).catch(() => {});
  }

  function toggleResource(name: string) {
    setResources((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function saveResources() {
    setSavingResources(true);
    try {
      await fetchJson("/api/resources", { method: "PUT", body: JSON.stringify({ names: [...resources] }) });
      router.refresh();
    } finally {
      setSavingResources(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await fetchJson("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-sm font-semibold text-ink">
          {profile.firstName} {profile.lastName}
        </h2>
        <p className="text-sm text-ink-muted">{profile.email}</p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Location & availability</h2>
        <div className="mt-3 space-y-3">
          <SelectField label="Province" id="province" value={province} onChange={(e) => { setProvince(e.target.value); setCity(""); }}>
            <option value="" disabled>Select a province</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </SelectField>
          {province && (
            <SelectField label="City / suburb" id="city" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="" disabled>Select a city</option>
              {CITIES_BY_PROVINCE[province as keyof typeof CITIES_BY_PROVINCE]?.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={province}>Other in {province}</option>
            </SelectField>
          )}
          <SelectField label="Availability" id="availability" value={availability} onChange={(e) => setAvailability(e.target.value as Availability)}>
            <option value="" disabled>Select availability</option>
            {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </SelectField>
          <SelectField label="Current situation" id="situation" value={situation} onChange={(e) => setSituation(e.target.value as Situation)}>
            <option value="" disabled>Select your situation</option>
            {SITUATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </SelectField>
        </div>
        {error && <p className="mt-3 rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
        <Button size="sm" variant="secondary" className="mt-3" disabled={savingProfile} onClick={saveProfile}>
          {savingProfile ? "Saving…" : "Save"}
        </Button>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Skills</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s.skillId} className="inline-flex items-center gap-1.5 rounded-full bg-green-light px-2.5 py-1 text-xs font-medium text-green">
              {s.name}
              <button type="button" onClick={() => removeSkill(s.skillId)} aria-label={`Remove ${s.name}`} className="text-green/70 hover:text-green">
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <TextField label="Add a skill" id="newSkill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
          </div>
          <Button size="sm" variant="ghost" onClick={addSkill}>Add</Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Resources</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {RESOURCE_OPTIONS.map((name) => {
            const active = resources.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleResource(name)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "border-terracotta bg-terracotta-light text-terracotta-dark" : "border-border bg-surface text-ink hover:bg-sand"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
        <Button size="sm" variant="secondary" className="mt-3" disabled={savingResources} onClick={saveResources}>
          {savingResources ? "Saving…" : "Save"}
        </Button>
      </Card>

      <Badge tone={profile.isDemoPersona ? "gold" : "neutral"}>
        {profile.isDemoPersona ? "Demo persona account" : "Your account"}
      </Badge>

      <Button variant="danger" fullWidth disabled={signingOut} onClick={handleSignOut}>
        {signingOut ? "Signing out…" : "Sign Out"}
      </Button>
    </div>
  );
}
