import { describe, expect, it } from "vitest";
import {
  locationFit,
  availabilityFit,
  scoreOpportunity,
  rankOpportunities,
  mergeProfilesIntoTeam,
} from "@/services/opportunityMatchingService";
import type { MatchProfile, Opportunity } from "@/types/domain";

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opp-1",
    name: "Test Opportunity",
    category: "repairs",
    description: "desc",
    geography: "National",
    estimatedStartupLevel: "low",
    customerSegment: "segment",
    demandSummary: "summary",
    demandScore: 0.8,
    marketSignal: "signal",
    whyNow: "why",
    prototypeOnly: true,
    requiredSkills: [],
    preferredSkills: [],
    requiredResources: [],
    preferredResources: [],
    ...overrides,
  };
}

function profile(overrides: Partial<MatchProfile> = {}): MatchProfile {
  return {
    userId: "user-1",
    city: "Johannesburg",
    province: "Gauteng",
    availability: "full_time",
    skills: [],
    resources: [],
    ...overrides,
  };
}

describe("locationFit", () => {
  it("scores 1.0 for a national opportunity regardless of location", () => {
    expect(locationFit("National", "Cape Town", "Western Cape")).toEqual({
      score: 1,
      basis: "national",
    });
  });

  it("scores 1.0 for an exact city match", () => {
    expect(locationFit("Johannesburg", "Johannesburg", "Gauteng")).toEqual({
      score: 1,
      basis: "same_city",
    });
  });

  it("scores 0.5 for same-province different-city", () => {
    expect(locationFit("Johannesburg", "Pretoria", "Gauteng")).toEqual({
      score: 0.5,
      basis: "same_province",
    });
  });

  it("scores 0.2 for a different province", () => {
    expect(locationFit("Johannesburg", "Cape Town", "Western Cape")).toEqual({
      score: 0.2,
      basis: "other_province",
    });
  });
});

describe("availabilityFit", () => {
  it("ranks full_time above part_time above evenings above weekends", () => {
    expect(availabilityFit("full_time").score).toBe(1);
    expect(availabilityFit("part_time").score).toBe(0.75);
    expect(availabilityFit("evenings").score).toBe(0.6);
    expect(availabilityFit("weekends").score).toBe(0.5);
  });

  it("defaults to a neutral 0.5 when availability is unknown", () => {
    expect(availabilityFit(null)).toEqual({ score: 0.5, basis: "unknown" });
  });
});

describe("scoreOpportunity", () => {
  it("computes the weighted total using the spec §18 formula", () => {
    const opp = opportunity({
      demandScore: 0.8,
      geography: "National",
      requiredSkills: [{ skillId: "s1", skillName: "Appliance Repair" }],
      requiredResources: [{ resourceId: "r1", resourceName: "Tools" }],
    });
    const p = profile({
      availability: "full_time",
      skills: [{ skillId: "s1", skillName: "Appliance Repair", experienceLevel: "experienced" }],
      resources: [{ resourceId: "r1", resourceName: "Tools" }],
    });

    const result = scoreOpportunity(opp, p);

    // skill 1.0*0.35 + resource 1.0*0.20 + demand 0.8*0.20 + location(national) 1.0*0.15 + availability 1.0*0.10
    expect(result.total).toBeCloseTo(0.35 + 0.2 + 0.16 + 0.15 + 0.1, 5);
    expect(result.components.skill_coverage.matched).toEqual(["Appliance Repair"]);
    expect(result.components.skill_coverage.missing).toEqual([]);
  });

  it("lists missing required skills/resources so the recommendation is explainable", () => {
    const opp = opportunity({
      requiredSkills: [
        { skillId: "s1", skillName: "Appliance Repair" },
        { skillId: "s2", skillName: "Electrical Maintenance" },
      ],
      requiredResources: [{ resourceId: "r1", resourceName: "Vehicle" }],
    });
    const p = profile({
      skills: [{ skillId: "s1", skillName: "Appliance Repair", experienceLevel: "experienced" }],
      resources: [],
    });

    const result = scoreOpportunity(opp, p);

    expect(result.components.skill_coverage.score).toBeCloseTo(0.5, 5);
    expect(result.components.skill_coverage.missing).toEqual(["Electrical Maintenance"]);
    expect(result.components.resource_coverage.score).toBe(0);
    expect(result.components.resource_coverage.missing).toEqual(["Vehicle"]);
  });

  it("gives a small bonus for matched preferred skills without exceeding 1.0", () => {
    const opp = opportunity({
      requiredSkills: [{ skillId: "s1", skillName: "Appliance Repair" }],
      preferredSkills: [
        { skillId: "s2", skillName: "Fault Diagnosis" },
        { skillId: "s3", skillName: "Customer Service" },
      ],
    });
    const p = profile({
      skills: [
        { skillId: "s1", skillName: "Appliance Repair", experienceLevel: "experienced" },
        { skillId: "s2", skillName: "Fault Diagnosis", experienceLevel: "experienced" },
        { skillId: "s3", skillName: "Customer Service", experienceLevel: "experienced" },
      ],
    });

    const result = scoreOpportunity(opp, p);
    // base 1.0 + 2 preferred bonuses of 0.02 each, capped at 1.0
    expect(result.components.skill_coverage.score).toBe(1);
  });

  it("is a pure function: identical inputs produce identical output", () => {
    const opp = opportunity();
    const p = profile();
    expect(scoreOpportunity(opp, p)).toEqual(scoreOpportunity(opp, p));
  });
});

describe("rankOpportunities", () => {
  it("sorts highest score first", () => {
    const strong = opportunity({
      id: "strong",
      requiredSkills: [{ skillId: "s1", skillName: "Appliance Repair" }],
    });
    const weak = opportunity({
      id: "weak",
      requiredSkills: [{ skillId: "s99", skillName: "Something Else" }],
    });
    const p = profile({
      skills: [{ skillId: "s1", skillName: "Appliance Repair", experienceLevel: "experienced" }],
    });

    const ranked = rankOpportunities([weak, strong], p);
    expect(ranked[0].opportunityId).toBe("strong");
  });
});

describe("mergeProfilesIntoTeam", () => {
  it("unions skills and resources and takes the minimum availability", () => {
    const a = profile({
      userId: "a",
      availability: "full_time",
      skills: [{ skillId: "s1", skillName: "Appliance Repair", experienceLevel: "experienced" }],
      resources: [{ resourceId: "r1", resourceName: "Tools" }],
    });
    const b = profile({
      userId: "b",
      availability: "part_time",
      skills: [{ skillId: "s2", skillName: "Sales", experienceLevel: "experienced" }],
      resources: [{ resourceId: "r2", resourceName: "Vehicle" }],
    });

    const team = mergeProfilesIntoTeam([a, b]);

    expect(team.availability).toBe("part_time");
    expect(team.skills.map((s) => s.skillId).sort()).toEqual(["s1", "s2"]);
    expect(team.resources.map((r) => r.resourceId).sort()).toEqual(["r1", "r2"]);
    expect(team.memberUserIds).toEqual(["a", "b"]);
  });

  it("keeps the highest experience level when members share a skill", () => {
    const a = profile({
      userId: "a",
      skills: [{ skillId: "s1", skillName: "Appliance Repair", experienceLevel: "beginner" }],
    });
    const b = profile({
      userId: "b",
      skills: [{ skillId: "s1", skillName: "Appliance Repair", experienceLevel: "expert" }],
    });

    const team = mergeProfilesIntoTeam([a, b]);
    expect(team.skills).toHaveLength(1);
    expect(team.skills[0].experienceLevel).toBe("expert");
  });
});
