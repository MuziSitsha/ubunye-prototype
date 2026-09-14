import { describe, expect, it } from "vitest";
import { deriveGapSet, rankCandidates } from "@/services/peopleMatchingService";
import { rankOpportunities, scoreOpportunity } from "@/services/opportunityMatchingService";
import type { MatchProfile, Opportunity } from "@/types/domain";

function opportunity(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: "opp",
    name: "Opportunity",
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

describe("deriveGapSet", () => {
  it("collects missing required+preferred skills/resources across the given opportunities, deduplicated", () => {
    const oppA = opportunity({
      id: "a",
      requiredSkills: [{ skillId: "repair", skillName: "Appliance Repair" }],
      preferredSkills: [{ skillId: "cs", skillName: "Customer Service" }],
      requiredResources: [{ resourceId: "vehicle", resourceName: "Vehicle" }],
    });
    const oppB = opportunity({
      id: "b",
      requiredSkills: [
        { skillId: "phone", skillName: "Mobile Phone Repair" },
        { skillId: "repair", skillName: "Appliance Repair" }, // already held — not a gap
      ],
      preferredSkills: [{ skillId: "cs", skillName: "Customer Service" }], // duplicate gap
    });

    const solo: MatchProfile = {
      userId: "u1",
      city: "Johannesburg",
      province: "Gauteng",
      availability: "full_time",
      skills: [{ skillId: "repair", skillName: "Appliance Repair", experienceLevel: "experienced" }],
      resources: [],
    };

    const gaps = deriveGapSet(
      [
        { opportunity: oppA, score: scoreOpportunity(oppA, solo) },
        { opportunity: oppB, score: scoreOpportunity(oppB, solo) },
      ],
      solo
    );

    const names = gaps.map((g) => g.name).sort();
    expect(names).toEqual(["Customer Service", "Mobile Phone Repair", "Vehicle"]);
  });
});

describe("rankCandidates", () => {
  const gapSet = [
    { kind: "skill" as const, id: "cs", name: "Customer Service" },
    { kind: "resource" as const, id: "vehicle", name: "Vehicle" },
  ];
  const reference = { city: "Johannesburg", province: "Gauteng" };

  it("ranks a candidate who closes both gaps above one who closes none", () => {
    const closesBoth: MatchProfile = {
      userId: "closes-both",
      city: "Johannesburg",
      province: "Gauteng",
      availability: "full_time",
      skills: [{ skillId: "cs", skillName: "Customer Service", experienceLevel: "experienced" }],
      resources: [{ resourceId: "vehicle", resourceName: "Vehicle" }],
    };
    const closesNone: MatchProfile = {
      userId: "closes-none",
      city: "Johannesburg",
      province: "Gauteng",
      availability: "full_time",
      skills: [{ skillId: "baking", skillName: "Baking", experienceLevel: "expert" }],
      resources: [],
    };

    const ranked = rankCandidates([closesNone, closesBoth], gapSet, reference);
    expect(ranked[0].candidateUserId).toBe("closes-both");
    expect(ranked[0].components.gap_coverage.score).toBe(1);
    expect(ranked[1].components.gap_coverage.score).toBe(0);
  });

  it("uses a neutral 0.5 experience score when a candidate only closes a resource gap", () => {
    const closesResourceOnly: MatchProfile = {
      userId: "vehicle-owner",
      city: "Johannesburg",
      province: "Gauteng",
      availability: "full_time",
      skills: [],
      resources: [{ resourceId: "vehicle", resourceName: "Vehicle" }],
    };
    const [result] = rankCandidates([closesResourceOnly], gapSet, reference);
    expect(result.components.experience.score).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// Golden Demo scenario (spec §32) — mirrors supabase/seed.sql exactly, as a
// standalone fixture so this test never depends on a running database. If
// this ever breaks, the live demo will show the wrong people/opportunity.
// ---------------------------------------------------------------------------
describe("Golden Demo scenario: Sipho -> Thandi/Kabelo/Naledi -> Mobile Appliance Repair", () => {
  const applianceRepair = opportunity({
    id: "mobile-appliance-repair",
    geography: "Johannesburg",
    demandScore: 0.84,
    requiredSkills: [
      { skillId: "appliance-repair", skillName: "Appliance Repair" },
      { skillId: "electrical-maintenance", skillName: "Electrical Maintenance" },
    ],
    preferredSkills: [
      { skillId: "fault-diagnosis", skillName: "Fault Diagnosis" },
      { skillId: "customer-service", skillName: "Customer Service" },
      { skillId: "bookkeeping", skillName: "Bookkeeping" },
    ],
    requiredResources: [
      { resourceId: "tools", resourceName: "Tools" },
      { resourceId: "vehicle", resourceName: "Vehicle" },
    ],
    preferredResources: [{ resourceId: "smartphone", resourceName: "Smartphone" }],
  });

  const mobilePhoneRepair = opportunity({
    id: "mobile-phone-repair",
    geography: "National",
    demandScore: 0.73,
    requiredSkills: [
      { skillId: "phone-repair", skillName: "Mobile Phone Repair" },
      { skillId: "fault-diagnosis", skillName: "Fault Diagnosis" },
    ],
    preferredSkills: [
      { skillId: "sales", skillName: "Sales" },
      { skillId: "customer-service", skillName: "Customer Service" },
    ],
    requiredResources: [
      { resourceId: "tools", resourceName: "Tools" },
      { resourceId: "smartphone", resourceName: "Smartphone" },
    ],
  });

  const constructionCrew = opportunity({
    id: "construction-crew",
    geography: "National",
    demandScore: 0.7,
    requiredSkills: [
      { skillId: "carpentry", skillName: "Carpentry" },
      { skillId: "construction-painting", skillName: "Construction Painting" },
    ],
    preferredSkills: [
      { skillId: "plumbing", skillName: "Plumbing" },
      { skillId: "electrical-maintenance", skillName: "Electrical Maintenance" },
    ],
    requiredResources: [
      { resourceId: "tools", resourceName: "Tools" },
      { resourceId: "vehicle", resourceName: "Vehicle" },
    ],
  });

  const catalogue = [applianceRepair, mobilePhoneRepair, constructionCrew];

  const sipho: MatchProfile = {
    userId: "sipho",
    city: "Johannesburg",
    province: "Gauteng",
    availability: "full_time",
    skills: [
      { skillId: "appliance-repair", skillName: "Appliance Repair", experienceLevel: "experienced" },
      { skillId: "electrical-maintenance", skillName: "Electrical Maintenance", experienceLevel: "some_experience" },
      { skillId: "fault-diagnosis", skillName: "Fault Diagnosis", experienceLevel: "experienced" },
    ],
    resources: [{ resourceId: "tools", resourceName: "Tools" }],
  };

  const thandi: MatchProfile = {
    userId: "thandi",
    city: "Johannesburg",
    province: "Gauteng",
    availability: "part_time",
    skills: [
      { skillId: "sales", skillName: "Sales", experienceLevel: "experienced" },
      { skillId: "customer-service", skillName: "Customer Service", experienceLevel: "experienced" },
    ],
    resources: [{ resourceId: "smartphone", resourceName: "Smartphone" }],
  };

  const kabelo: MatchProfile = {
    userId: "kabelo",
    city: "Johannesburg",
    province: "Gauteng",
    availability: "full_time",
    skills: [{ skillId: "driving", skillName: "Driving", experienceLevel: "experienced" }],
    resources: [{ resourceId: "vehicle", resourceName: "Vehicle" }],
  };

  const naledi: MatchProfile = {
    userId: "naledi",
    city: "Johannesburg",
    province: "Gauteng",
    availability: "part_time",
    skills: [{ skillId: "bookkeeping", skillName: "Bookkeeping", experienceLevel: "some_experience" }],
    resources: [{ resourceId: "laptop", resourceName: "Laptop" }],
  };

  const themba: MatchProfile = {
    userId: "themba",
    city: "Pretoria",
    province: "Gauteng",
    availability: "weekends",
    skills: [
      { skillId: "carpentry", skillName: "Carpentry", experienceLevel: "experienced" },
      { skillId: "construction-painting", skillName: "Construction Painting", experienceLevel: "some_experience" },
    ],
    resources: [{ resourceId: "vehicle", resourceName: "Vehicle" }],
  };

  const bongani: MatchProfile = {
    userId: "bongani",
    city: "Johannesburg",
    province: "Gauteng",
    availability: "evenings",
    skills: [{ skillId: "administration", skillName: "Administration", experienceLevel: "some_experience" }],
    resources: [{ resourceId: "laptop", resourceName: "Laptop" }],
  };

  it("ranks Mobile Appliance Repair as Sipho's top solo opportunity", () => {
    const ranked = rankOpportunities(catalogue, sipho);
    expect(ranked[0].opportunityId).toBe("mobile-appliance-repair");
  });

  it("derives a gap set from Sipho's top-3 that explains why Thandi, Kabelo and Naledi matter", () => {
    const ranked = rankOpportunities(catalogue, sipho).map((score) => ({
      opportunity: catalogue.find((o) => o.id === score.opportunityId)!,
      score,
    }));

    const gaps = deriveGapSet(ranked, sipho);
    const gapNames = gaps.map((g) => g.name);

    expect(gapNames).toContain("Vehicle"); // -> Kabelo
    expect(gapNames).toContain("Customer Service"); // -> Thandi
    expect(gapNames).toContain("Bookkeeping"); // -> Naledi
  });

  it("ranks Thandi, Kabelo and Naledi as the top 3 people recommendations, in that order", () => {
    const ranked = rankOpportunities(catalogue, sipho).map((score) => ({
      opportunity: catalogue.find((o) => o.id === score.opportunityId)!,
      score,
    }));
    const gaps = deriveGapSet(ranked, sipho);

    const candidates = [thandi, kabelo, naledi, themba, bongani];
    const peopleRanked = rankCandidates(candidates, gaps, sipho);

    expect(peopleRanked.slice(0, 3).map((p) => p.candidateUserId)).toEqual([
      "thandi",
      "kabelo",
      "naledi",
    ]);
    expect(peopleRanked[0].total).toBeGreaterThan(peopleRanked[3].total);
  });

  it("re-scores Mobile Appliance Repair much higher for the full team than for Sipho alone", () => {
    const soloScore = scoreOpportunity(applianceRepair, sipho);

    const team = {
      memberUserIds: ["sipho", "thandi", "kabelo", "naledi"],
      city: "Johannesburg",
      province: "Gauteng",
      availability: "part_time" as const, // min across full_time, part_time, full_time, part_time
      skills: [...sipho.skills, ...thandi.skills, ...kabelo.skills, ...naledi.skills],
      resources: [...sipho.resources, ...thandi.resources, ...kabelo.resources, ...naledi.resources],
    };
    const teamScore = scoreOpportunity(applianceRepair, team);

    expect(teamScore.total).toBeGreaterThan(soloScore.total);
    expect(teamScore.total).toBeGreaterThan(0.85);
    expect(teamScore.components.skill_coverage.score).toBe(1);
    expect(teamScore.components.resource_coverage.score).toBe(1);
  });

  it("still ranks Mobile Appliance Repair as the team's top opportunity, beating the runner-up by a wide margin", () => {
    const team = {
      memberUserIds: ["sipho", "thandi", "kabelo", "naledi"],
      city: "Johannesburg",
      province: "Gauteng",
      availability: "part_time" as const,
      skills: [...sipho.skills, ...thandi.skills, ...kabelo.skills, ...naledi.skills],
      resources: [...sipho.resources, ...thandi.resources, ...kabelo.resources, ...naledi.resources],
    };

    const ranked = rankOpportunities(catalogue, team);
    expect(ranked[0].opportunityId).toBe("mobile-appliance-repair");
    expect(ranked[0].total - ranked[1].total).toBeGreaterThan(0.1);
  });
});
