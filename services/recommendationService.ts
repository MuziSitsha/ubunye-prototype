// Orchestrates the two pure matching engines against real data and persists every
// scoring component (docs/architecture.md §3) so explanations are always a read of
// stored evidence, never a regeneration. Implements the 5-step flow from
// docs/decisions.md D1.

import { AppError } from "@/lib/errors";
import { getAIService } from "@/services/aiService";
import { deriveGapSet, rankCandidates } from "@/services/peopleMatchingService";
import {
  mergeProfilesIntoTeam,
  rankOpportunities,
  scoreOpportunity,
} from "@/services/opportunityMatchingService";
import { getMatchProfile, getProfile, listCandidateMatchProfiles } from "@/services/profileService";
import type {
  GapItem,
  MatchProfile,
  Opportunity,
  OpportunityScore,
  PeopleScore,
  Profile,
} from "@/types/domain";
import type { SupabaseClientType, Tables } from "@/types/supabase-helpers";
import type { Json } from "@/types/database";

/** Scoring components are plain JSON-shaped objects; this cast just satisfies the jsonb column type. */
function toJson<T>(value: T): Json {
  return value as unknown as Json;
}

const TOP_N_FOR_GAP_ANALYSIS = 3;
const PEOPLE_RESULTS_LIMIT = 6;

type OppRow = Tables<"opportunities">;

function toOpportunity(
  row: OppRow,
  skillLinks: { skill_id: string; requirement_type: string; skills: { name: string } | null }[],
  resourceLinks: { resource_id: string; requirement_type: string; resources: { name: string } | null }[]
): Opportunity {
  const skillOf = (link: { skill_id: string; skills: { name: string } | null }) => ({
    skillId: link.skill_id,
    skillName: link.skills?.name ?? "Unknown skill",
  });
  const resourceOf = (link: { resource_id: string; resources: { name: string } | null }) => ({
    resourceId: link.resource_id,
    resourceName: link.resources?.name ?? "Unknown resource",
  });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    geography: row.geography,
    estimatedStartupLevel: row.estimated_startup_level as Opportunity["estimatedStartupLevel"],
    customerSegment: row.customer_segment,
    demandSummary: row.demand_summary,
    demandScore: Number(row.demand_score),
    marketSignal: row.market_signal,
    whyNow: row.why_now,
    prototypeOnly: row.prototype_only,
    requiredSkills: skillLinks.filter((l) => l.requirement_type === "required").map(skillOf),
    preferredSkills: skillLinks.filter((l) => l.requirement_type === "preferred").map(skillOf),
    requiredResources: resourceLinks.filter((l) => l.requirement_type === "required").map(resourceOf),
    preferredResources: resourceLinks.filter((l) => l.requirement_type === "preferred").map(resourceOf),
  };
}

export async function getOpportunityCatalogue(supabase: SupabaseClientType): Promise<Opportunity[]> {
  const [{ data: opportunities, error: oppError }, { data: skillLinks, error: skillError }, { data: resourceLinks, error: resourceError }] =
    await Promise.all([
      supabase.from("opportunities").select("*").order("name"),
      supabase.from("opportunity_skills").select("opportunity_id, skill_id, requirement_type, skills(name)"),
      supabase.from("opportunity_resources").select("opportunity_id, resource_id, requirement_type, resources(name)"),
    ]);

  if (oppError || skillError || resourceError || !opportunities) {
    throw new AppError("We couldn't load the opportunity catalogue. Please try again.", oppError ?? skillError ?? resourceError);
  }

  return opportunities.map((row) =>
    toOpportunity(
      row,
      (skillLinks ?? []).filter((l) => l.opportunity_id === row.id) as never,
      (resourceLinks ?? []).filter((l) => l.opportunity_id === row.id) as never
    )
  );
}

export async function getOpportunity(supabase: SupabaseClientType, opportunityId: string): Promise<Opportunity> {
  const catalogue = await getOpportunityCatalogue(supabase);
  const found = catalogue.find((o) => o.id === opportunityId);
  if (!found) throw new AppError("That opportunity could not be found.");
  return found;
}

export interface PeopleRecommendationResult {
  gapSet: GapItem[];
  topOpportunityNames: string[];
  people: { profile: Profile; score: PeopleScore }[];
}

/**
 * Step 1-4 of docs/decisions.md D1: score the catalogue against the solo user, take the
 * top 3, derive the gap set, and rank every other onboarded user against it. This is
 * UBY-007's data source.
 */
export async function recommendPeopleForUser(
  supabase: SupabaseClientType,
  userId: string
): Promise<PeopleRecommendationResult> {
  const [soloProfile, catalogue, candidates] = await Promise.all([
    getMatchProfile(supabase, userId),
    getOpportunityCatalogue(supabase),
    listCandidateMatchProfiles(supabase, userId),
  ]);

  const rankedOpportunities = rankOpportunities(catalogue, soloProfile);
  const top3 = rankedOpportunities.slice(0, TOP_N_FOR_GAP_ANALYSIS).map((score) => ({
    opportunity: catalogue.find((o) => o.id === score.opportunityId)!,
    score,
  }));

  const gapSet = deriveGapSet(top3, soloProfile);

  const peopleScores = rankCandidates(
    candidates.map((c) => c.matchProfile),
    gapSet,
    soloProfile
  ).slice(0, PEOPLE_RESULTS_LIMIT);

  const profileById = new Map(candidates.map((c) => [c.profile.id, c.profile]));

  // Persist for traceability (docs/architecture.md §3) — every card on UBY-007 traces to a row.
  const rows = peopleScores.map((score) => ({
    kind: "person" as const,
    subject_user_id: userId,
    candidate_user_id: score.candidateUserId,
    opportunity_id: null,
    team_id: null,
    total: score.total,
    components: toJson(score.components),
  }));
  if (rows.length > 0) {
    await supabase.from("recommendations").insert(rows);
  }

  return {
    gapSet,
    topOpportunityNames: top3.map((t) => t.opportunity.name),
    people: peopleScores
      .map((score) => ({ profile: profileById.get(score.candidateUserId)!, score }))
      .filter((p) => !!p.profile),
  };
}

export interface OpportunityRecommendationResult {
  opportunity: Opportunity;
  score: OpportunityScore;
  explanation: string;
  runnerUp: { opportunity: Opportunity; score: OpportunityScore } | null;
}

/**
 * Step 5 of docs/decisions.md D1: re-score the full catalogue against the combined
 * profile of the user + the people they selected from UBY-007. This is UBY-008/009's
 * data source. `requestingUserId` is who the recommendation is recorded against.
 */
export async function recommendOpportunityForTeam(
  supabase: SupabaseClientType,
  requestingUserId: string,
  memberUserIds: string[]
): Promise<OpportunityRecommendationResult> {
  const allMemberIds = [...new Set([requestingUserId, ...memberUserIds])];

  const [catalogue, memberProfiles, matchProfiles] = await Promise.all([
    getOpportunityCatalogue(supabase),
    Promise.all(allMemberIds.map((id) => getProfile(supabase, id))),
    Promise.all(allMemberIds.map((id) => getMatchProfile(supabase, id))),
  ]);

  const teamProfile = mergeProfilesIntoTeam(matchProfiles);
  const ranked = rankOpportunities(catalogue, teamProfile);

  const top = ranked[0];
  const topOpportunity = catalogue.find((o) => o.id === top.opportunityId)!;
  const runnerUpScore = ranked[1];
  const runnerUp = runnerUpScore
    ? { opportunity: catalogue.find((o) => o.id === runnerUpScore.opportunityId)!, score: runnerUpScore }
    : null;

  const explanation = await getAIService().explainRecommendation({
    opportunityName: topOpportunity.name,
    opportunityDescription: topOpportunity.description,
    total: top.total,
    components: top.components,
    teamMemberNames: memberProfiles.map((p) => p.firstName),
  });

  await supabase.from("recommendations").insert({
    kind: "opportunity",
    subject_user_id: requestingUserId,
    candidate_user_id: null,
    opportunity_id: topOpportunity.id,
    team_id: null,
    total: top.total,
    components: toJson(top.components),
  });

  return { opportunity: topOpportunity, score: top, explanation, runnerUp };
}

/** Re-scores a single already-selected opportunity for a team — used inside the venture workspace. */
export async function scoreOpportunityForMembers(
  supabase: SupabaseClientType,
  opportunityId: string,
  memberUserIds: string[]
): Promise<{ opportunity: Opportunity; score: OpportunityScore }> {
  const [opportunity, matchProfiles] = await Promise.all([
    getOpportunity(supabase, opportunityId),
    Promise.all(memberUserIds.map((id) => getMatchProfile(supabase, id))),
  ]);
  const teamProfile: MatchProfile | ReturnType<typeof mergeProfilesIntoTeam> =
    matchProfiles.length === 1 ? matchProfiles[0] : mergeProfilesIntoTeam(matchProfiles);
  return { opportunity, score: scoreOpportunity(opportunity, teamProfile) };
}
