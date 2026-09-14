// Pure, synchronous opportunity scoring. No network calls, no AI, no database access.
// Formula: spec §18. Component definitions: docs/decisions.md D2, D5.
// This is Layer 3 of docs/architecture.md — "Data + rules decide, AI explains."

import { CITY_TO_PROVINCE } from "@/data/southAfricanLocations";
import type {
  Availability,
  MatchProfile,
  Opportunity,
  OpportunityScore,
  OpportunityScoreComponents,
  TeamMatchProfile,
} from "@/types/domain";

const WEIGHTS = {
  skillCoverage: 0.35,
  resourceCoverage: 0.2,
  demand: 0.2,
  location: 0.15,
  availability: 0.1,
} as const;

const PREFERRED_BONUS = 0.02;

const AVAILABILITY_WEIGHT: Record<Availability, number> = {
  full_time: 1.0,
  part_time: 0.75,
  evenings: 0.6,
  weekends: 0.5,
};

type ScoredProfile = MatchProfile | TeamMatchProfile;

function profileSkillIds(profile: ScoredProfile): Set<string> {
  return new Set(profile.skills.map((s) => s.skillId));
}

function profileResourceIds(profile: ScoredProfile): Set<string> {
  return new Set(profile.resources.map((r) => r.resourceId));
}

function coverage(
  required: { id: string; name: string }[],
  preferred: { id: string; name: string }[],
  held: Set<string>
): { score: number; matched: string[]; missing: string[] } {
  if (required.length === 0) {
    // Nothing required: coverage is trivially satisfied, but preferred matches still add credit.
    const preferredMatched = preferred.filter((p) => held.has(p.id));
    return {
      score: Math.min(1, preferredMatched.length * PREFERRED_BONUS),
      matched: preferredMatched.map((p) => p.name),
      missing: [],
    };
  }

  const matchedRequired = required.filter((r) => held.has(r.id));
  const missingRequired = required.filter((r) => !held.has(r.id));
  const preferredMatched = preferred.filter((p) => held.has(p.id));

  const base = matchedRequired.length / required.length;
  const bonus = preferredMatched.length * PREFERRED_BONUS;

  return {
    score: Math.min(1, base + bonus),
    matched: [...matchedRequired, ...preferredMatched].map((r) => r.name),
    missing: missingRequired.map((r) => r.name),
  };
}

export function locationFit(
  geography: string,
  city: string | null,
  province: string | null
): { score: number; basis: OpportunityScoreComponents["location"]["basis"] } {
  if (geography.trim().toLowerCase() === "national") {
    return { score: 1, basis: "national" };
  }

  if (city && geography.trim().toLowerCase() === city.trim().toLowerCase()) {
    return { score: 1, basis: "same_city" };
  }

  const opportunityProvince = CITY_TO_PROVINCE[geography.trim().toLowerCase()];
  if (opportunityProvince && province && opportunityProvince === province) {
    return { score: 0.5, basis: "same_province" };
  }

  return { score: 0.2, basis: "other_province" };
}

export function availabilityFit(
  availability: Availability | null
): { score: number; basis: Availability | "unknown" } {
  if (!availability) return { score: 0.5, basis: "unknown" };
  return { score: AVAILABILITY_WEIGHT[availability], basis: availability };
}

export function scoreOpportunity(
  opportunity: Opportunity,
  profile: ScoredProfile
): OpportunityScore {
  const heldSkills = profileSkillIds(profile);
  const heldResources = profileResourceIds(profile);

  const skillResult = coverage(
    opportunity.requiredSkills.map((s) => ({ id: s.skillId, name: s.skillName })),
    opportunity.preferredSkills.map((s) => ({ id: s.skillId, name: s.skillName })),
    heldSkills
  );

  const resourceResult = coverage(
    opportunity.requiredResources.map((r) => ({ id: r.resourceId, name: r.resourceName })),
    opportunity.preferredResources.map((r) => ({ id: r.resourceId, name: r.resourceName })),
    heldResources
  );

  const location = locationFit(opportunity.geography, profile.city, profile.province);
  const availability = availabilityFit(profile.availability);

  const components: OpportunityScoreComponents = {
    skill_coverage: skillResult,
    resource_coverage: resourceResult,
    demand: { score: opportunity.demandScore, signal_id: opportunity.id },
    location,
    availability,
  };

  const total =
    skillResult.score * WEIGHTS.skillCoverage +
    resourceResult.score * WEIGHTS.resourceCoverage +
    opportunity.demandScore * WEIGHTS.demand +
    location.score * WEIGHTS.location +
    availability.score * WEIGHTS.availability;

  return { opportunityId: opportunity.id, total, components };
}

/** Scores every opportunity in the catalogue and returns them ranked highest-first. */
export function rankOpportunities(
  opportunities: Opportunity[],
  profile: ScoredProfile
): OpportunityScore[] {
  return opportunities
    .map((o) => scoreOpportunity(o, profile))
    .sort((a, b) => b.total - a.total);
}

/** Merges individual MatchProfiles into a single TeamMatchProfile (docs/decisions.md D2). */
export function mergeProfilesIntoTeam(profiles: MatchProfile[]): TeamMatchProfile {
  const skillsMap = new Map<string, { skillId: string; skillName: string; experienceLevel: MatchProfile["skills"][number]["experienceLevel"] }>();
  const resourcesMap = new Map<string, { resourceId: string; resourceName: string }>();

  for (const p of profiles) {
    for (const s of p.skills) {
      const existing = skillsMap.get(s.skillId);
      // Keep the highest experience level seen for a given skill across the team.
      const rank = { beginner: 0, some_experience: 1, experienced: 2, expert: 3 };
      if (!existing || rank[s.experienceLevel] > rank[existing.experienceLevel]) {
        skillsMap.set(s.skillId, s);
      }
    }
    for (const r of p.resources) {
      resourcesMap.set(r.resourceId, r);
    }
  }

  const availabilities = profiles.map((p) => p.availability).filter((a): a is Availability => !!a);
  const minAvailability = availabilities.length
    ? availabilities.reduce((min, a) =>
        AVAILABILITY_WEIGHT[a] < AVAILABILITY_WEIGHT[min] ? a : min
      )
    : null;

  // Team location: the most common city among members (ties broken by first occurrence).
  const cityCounts = new Map<string, number>();
  for (const p of profiles) {
    if (p.city) cityCounts.set(p.city, (cityCounts.get(p.city) ?? 0) + 1);
  }
  let teamCity: string | null = null;
  let teamProvince: string | null = null;
  let bestCount = 0;
  for (const p of profiles) {
    if (!p.city) continue;
    const count = cityCounts.get(p.city) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      teamCity = p.city;
      teamProvince = p.province;
    }
  }

  return {
    memberUserIds: profiles.map((p) => p.userId),
    city: teamCity,
    province: teamProvince,
    availability: minAvailability,
    skills: [...skillsMap.values()],
    resources: [...resourcesMap.values()],
  };
}
