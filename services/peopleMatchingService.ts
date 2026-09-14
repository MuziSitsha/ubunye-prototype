// Pure, synchronous people-matching. No network calls, no AI, no database access.
// Implements docs/decisions.md D1 (gap derivation) and D3 (people match formula).
// This is the second half of Layer 3 in docs/architecture.md.

import { CITY_TO_PROVINCE } from "@/data/southAfricanLocations";
import { availabilityFit } from "@/services/opportunityMatchingService";
import type {
  ExperienceLevel,
  GapItem,
  MatchProfile,
  Opportunity,
  OpportunityScore,
  PeopleScore,
  PeopleScoreComponents,
} from "@/types/domain";

const WEIGHTS = {
  gapCoverage: 0.5,
  location: 0.25,
  availability: 0.15,
  experience: 0.1,
} as const;

const EXPERIENCE_WEIGHT: Record<ExperienceLevel, number> = {
  beginner: 0.25,
  some_experience: 0.5,
  experienced: 0.75,
  expert: 1.0,
};

/**
 * Step 3 of docs/decisions.md D1: derive the gap set from a solo user's top-3
 * solo-scored opportunities. A gap item is anything (required or preferred,
 * skill or resource) those 3 opportunities list that the solo user doesn't
 * already have. Deduplicated by id.
 */
export function deriveGapSet(
  topOpportunities: { opportunity: Opportunity; score: OpportunityScore }[],
  soloProfile: MatchProfile
): GapItem[] {
  const heldSkillIds = new Set(soloProfile.skills.map((s) => s.skillId));
  const heldResourceIds = new Set(soloProfile.resources.map((r) => r.resourceId));

  const gaps = new Map<string, GapItem>();

  for (const { opportunity } of topOpportunities) {
    const allSkills = [...opportunity.requiredSkills, ...opportunity.preferredSkills];
    const allResources = [...opportunity.requiredResources, ...opportunity.preferredResources];

    for (const skill of allSkills) {
      if (!heldSkillIds.has(skill.skillId)) {
        gaps.set(`skill:${skill.skillId}`, { kind: "skill", id: skill.skillId, name: skill.skillName });
      }
    }
    for (const resource of allResources) {
      if (!heldResourceIds.has(resource.resourceId)) {
        gaps.set(`resource:${resource.resourceId}`, {
          kind: "resource",
          id: resource.resourceId,
          name: resource.resourceName,
        });
      }
    }
  }

  return [...gaps.values()];
}

function personLocationFit(
  candidate: Pick<MatchProfile, "city" | "province">,
  reference: Pick<MatchProfile, "city" | "province">
): { score: number; basis: PeopleScoreComponents["location"]["basis"] } {
  if (candidate.city && reference.city && candidate.city.toLowerCase() === reference.city.toLowerCase()) {
    return { score: 1, basis: "same_city" };
  }

  const candidateProvince = candidate.province ?? (candidate.city ? CITY_TO_PROVINCE[candidate.city.toLowerCase()] : null);
  const referenceProvince = reference.province ?? (reference.city ? CITY_TO_PROVINCE[reference.city.toLowerCase()] : null);

  if (candidateProvince && referenceProvince && candidateProvince === referenceProvince) {
    return { score: 0.5, basis: "same_province" };
  }

  return { score: 0.2, basis: "other_province" };
}

/**
 * Ranks candidate users by how well they close the derived gap set
 * (docs/decisions.md D3). `referenceProfile` supplies the location baseline
 * (the solo user asking "who could I build with").
 */
export function rankCandidates(
  candidates: MatchProfile[],
  gapSet: GapItem[],
  referenceProfile: Pick<MatchProfile, "city" | "province">
): PeopleScore[] {
  return candidates
    .map((candidate) => {
      const heldSkillIds = new Set(candidate.skills.map((s) => s.skillId));
      const heldResourceIds = new Set(candidate.resources.map((r) => r.resourceId));

      const closedGaps = gapSet.filter((g) =>
        g.kind === "skill" ? heldSkillIds.has(g.id) : heldResourceIds.has(g.id)
      );

      const gapCoverageScore = gapSet.length === 0 ? 1 : closedGaps.length / gapSet.length;

      const closedSkillGapIds = new Set(
        closedGaps.filter((g) => g.kind === "skill").map((g) => g.id)
      );
      const closingSkills = candidate.skills.filter((s) => closedSkillGapIds.has(s.skillId));
      const experienceScore =
        closingSkills.length > 0
          ? closingSkills.reduce((sum, s) => sum + EXPERIENCE_WEIGHT[s.experienceLevel], 0) /
            closingSkills.length
          : 0.5;

      const location = personLocationFit(candidate, referenceProfile);
      const availability = availabilityFit(candidate.availability);

      const components: PeopleScoreComponents = {
        gap_coverage: { score: gapCoverageScore, closes: closedGaps.map((g) => g.name) },
        location,
        availability,
        experience: {
          score: experienceScore,
          basis:
            closingSkills.length > 0
              ? `avg experience across: ${closingSkills.map((s) => s.skillName).join(", ")}`
              : "neutral — no skill closes a gap",
        },
      };

      const total =
        gapCoverageScore * WEIGHTS.gapCoverage +
        location.score * WEIGHTS.location +
        availability.score * WEIGHTS.availability +
        experienceScore * WEIGHTS.experience;

      return { candidateUserId: candidate.userId, total, components };
    })
    .sort((a, b) => b.total - a.total);
}
