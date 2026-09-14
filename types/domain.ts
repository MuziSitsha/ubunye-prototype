// Domain types shared across services and UI. These are the "nice" shapes the
// app works with — services translate database rows (types/database.ts) into
// these, and UI components only ever see these.

export type Availability = "full_time" | "part_time" | "weekends" | "evenings";

export type Situation =
  | "unemployed"
  | "under_employed"
  | "informally_employed"
  | "employed_seeking";

export type ExperienceLevel = "beginner" | "some_experience" | "experienced" | "expert";

export type RequirementType = "required" | "preferred";

export type StartupLevel = "low" | "low_medium" | "medium" | "medium_high" | "high";

export type VentureStageName =
  | "team_formed"
  | "opportunity_selected"
  | "validate_opportunity"
  | "develop_business"
  | "funding_ready"
  | "launch";

export const VENTURE_STAGE_ORDER: VentureStageName[] = [
  "team_formed",
  "opportunity_selected",
  "validate_opportunity",
  "develop_business",
  "funding_ready",
  "launch",
];

export interface Skill {
  id: string;
  name: string;
  category: string | null;
}

export interface UserSkill {
  skillId: string;
  name: string;
  confidence: number | null;
  experienceLevel: ExperienceLevel;
  source: "ai_interpreted" | "manual";
}

export interface Resource {
  id: string;
  name: string;
  category: string | null;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string | null;
  province: string | null;
  city: string | null;
  availability: Availability | null;
  situation: Situation | null;
  onboardingCompletedAt: string | null;
  skillsConfirmedAt: string | null;
  isDemoPersona: boolean;
}

/** Everything the matching engines need about a single person. Pure input type. */
export interface MatchProfile {
  userId: string;
  city: string | null;
  province: string | null;
  availability: Availability | null;
  skills: { skillId: string; skillName: string; experienceLevel: ExperienceLevel }[];
  resources: { resourceId: string; resourceName: string }[];
}

/** A team's combined profile, derived by merging member MatchProfiles. */
export interface TeamMatchProfile {
  memberUserIds: string[];
  city: string | null;
  province: string | null;
  /** Minimum availability across members (docs/decisions.md D2). */
  availability: Availability | null;
  skills: { skillId: string; skillName: string; experienceLevel: ExperienceLevel }[];
  resources: { resourceId: string; resourceName: string }[];
}

export interface Opportunity {
  id: string;
  name: string;
  category: string;
  description: string;
  geography: string;
  estimatedStartupLevel: StartupLevel;
  customerSegment: string;
  demandSummary: string;
  demandScore: number;
  marketSignal: string;
  whyNow: string;
  prototypeOnly: boolean;
  requiredSkills: { skillId: string; skillName: string }[];
  preferredSkills: { skillId: string; skillName: string }[];
  requiredResources: { resourceId: string; resourceName: string }[];
  preferredResources: { resourceId: string; resourceName: string }[];
}

// ---------------------------------------------------------------------------
// Scoring — see docs/architecture.md §3 and docs/decisions.md D2/D3/D5.
// ---------------------------------------------------------------------------

export interface OpportunityScoreComponents {
  skill_coverage: { score: number; matched: string[]; missing: string[] };
  resource_coverage: { score: number; matched: string[]; missing: string[] };
  demand: { score: number; signal_id: string };
  location: { score: number; basis: "national" | "same_city" | "same_province" | "other_province" };
  availability: { score: number; basis: Availability | "unknown" };
}

export interface OpportunityScore {
  opportunityId: string;
  total: number;
  components: OpportunityScoreComponents;
}

export interface PeopleScoreComponents {
  gap_coverage: { score: number; closes: string[] };
  location: { score: number; basis: "national" | "same_city" | "same_province" | "other_province" };
  availability: { score: number; basis: Availability | "unknown" };
  experience: { score: number; basis: string };
}

export interface PeopleScore {
  candidateUserId: string;
  total: number;
  components: PeopleScoreComponents;
}

/** The gap set derived in recommendationService.recommendForUser (docs/decisions.md D1). */
export interface GapItem {
  kind: "skill" | "resource";
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// AI service (spec §36)
// ---------------------------------------------------------------------------

export interface InterpretedSkill {
  name: string;
  confidence: number;
}

export interface SkillInterpretation {
  skills: InterpretedSkill[];
}

export interface RecommendationContext {
  opportunityName: string;
  opportunityDescription: string;
  total: number;
  components: OpportunityScoreComponents;
  teamMemberNames: string[];
}

export interface VentureContext {
  ventureName: string;
  opportunityName: string;
  teamMemberNames: string[];
  businessConcept: { whatWeSell?: string; whoWillBuy?: string; whyChooseUs?: string };
  stage: VentureStageName;
}

export interface AIService {
  interpretSkills(input: string): Promise<SkillInterpretation>;
  explainRecommendation(recommendation: RecommendationContext): Promise<string>;
  generateBusinessSummary(venture: VentureContext): Promise<string>;
}

// ---------------------------------------------------------------------------
// Teams / ventures
// ---------------------------------------------------------------------------

export interface TeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  role: string | null;
}

export interface Team {
  id: string;
  name: string;
  createdBy: string;
  opportunityId: string | null;
  status: "proposed" | "formed";
  members: TeamMember[];
}

export interface BusinessConcept {
  whatWeSell?: string;
  whoWillBuy?: string;
  whyChooseUs?: string;
}

export interface CustomerConcept {
  targetCustomer?: string;
  customerProblem?: string;
}

export interface OperationsConcept {
  needs?: string;
}

export interface MoneyConcept {
  startupRequirement?: string;
  revenueConcept?: string;
}

export interface Venture {
  id: string;
  teamId: string;
  opportunityId: string;
  name: string;
  currentStage: VentureStageName;
  businessConcept: BusinessConcept;
  customer: CustomerConcept;
  operations: OperationsConcept;
  money: MoneyConcept;
  readinessScore: number;
  launchedAt: string | null;
}

export type HelpTopic =
  | "business_plan"
  | "financial_plan"
  | "funding_application"
  | "marketing"
  | "pricing"
  | "registration"
  | "compliance"
  | "business_banking"
  | "contracts"
  | "general_advice";

export type SupportCategory =
  | "bank"
  | "government"
  | "development_agency"
  | "corporate_enterprise_development"
  | "grant"
  | "incubator"
  | "business_competition"
  | "training_provider";

export interface SupportProgramme {
  id: string;
  category: SupportCategory;
  provider: string;
  programmeName: string;
  supportType: string;
  typicalEligibility: string;
  amountRange: string;
  closingDate: string | null;
  description: string;
  isDemoData: boolean;
  whyItMatches?: string;
}

export interface LearningProgramme {
  id: string;
  skillId: string | null;
  skillName: string | null;
  title: string;
  reason: string;
  provider: string;
  format: "online" | "in_person" | "hybrid";
  duration: string;
  url: string | null;
  isDemoData: boolean;
}
