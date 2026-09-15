"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/FormField";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import { CITIES_BY_PROVINCE, PROVINCES } from "@/data/southAfricanLocations";
import type { Availability, ExperienceLevel, Situation, UserSkill } from "@/types/domain";

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

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "some_experience", label: "Some experience" },
  { value: "experienced", label: "Experienced" },
  { value: "expert", label: "Expert" },
];

// UBY-005 — About You (spec §11)
export default function AboutYouPage() {
  const router = useRouter();
  const [province, setProvince] = useState<string>("");
  const [city, setCity] = useState("");
  const [availability, setAvailability] = useState<Availability | "">("");
  const [situation, setSituation] = useState<Situation | "">("");
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ skills: UserSkill[] }>("/api/skills")
      .then((res) => setSkills(res.skills))
      .catch(() => setSkills([]));
  }, []);

  async function updateExperience(skillId: string, experienceLevel: ExperienceLevel) {
    setSkills((prev) => prev.map((s) => (s.skillId === skillId ? { ...s, experienceLevel } : s)));
    const skill = skills.find((s) => s.skillId === skillId);
    await fetchJson("/api/skills", {
      method: "POST",
      body: JSON.stringify({ name: skill?.name, experienceLevel }),
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetchJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ province, city, availability, situation }),
      });
      router.push("/onboarding/resources");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't save that. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="About you" subtitle="Location and availability help us match you well" back="/onboarding/skills" />
      <main className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">Location</h2>
            <SelectField
              label="Province"
              id="province"
              required
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setCity("");
              }}
            >
              <option value="" disabled>
                Select a province
              </option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectField>
            {province && (
              <SelectField label="City / suburb" id="city" required value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="" disabled>
                  Select a city
                </option>
                {CITIES_BY_PROVINCE[province as keyof typeof CITIES_BY_PROVINCE]?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={province}>Other in {province}</option>
              </SelectField>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-ink">Availability</h2>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <RadioTile key={opt.value} name="availability" {...opt} selected={availability === opt.value} onSelect={() => setAvailability(opt.value)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-ink">Current situation</h2>
            <div className="space-y-2">
              {SITUATION_OPTIONS.map((opt) => (
                <RadioTile key={opt.value} name="situation" {...opt} selected={situation === opt.value} onSelect={() => setSituation(opt.value)} fullWidth />
              ))}
            </div>
          </div>

          {skills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-ink">How experienced are you?</h2>
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.skillId} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                    <span className="text-sm font-medium text-ink">{skill.name}</span>
                    <select
                      value={skill.experienceLevel}
                      onChange={(e) => updateExperience(skill.skillId, e.target.value as ExperienceLevel)}
                      className="rounded-lg border border-border bg-cream px-2 py-1 text-xs text-ink"
                    >
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" fullWidth disabled={loading || !province || !city || !availability || !situation}>
            {loading ? "Saving…" : "Continue"}
          </Button>
        </form>
      </main>
    </div>
  );
}

function RadioTile({
  label,
  selected,
  onSelect,
  fullWidth,
}: {
  name: string;
  value: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
        fullWidth ? "w-full" : ""
      } ${selected ? "border-gold bg-gold-light text-gold-dark" : "border-border bg-surface text-ink hover:bg-sand"}`}
    >
      {label}
    </button>
  );
}
