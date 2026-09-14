import { AppError } from "@/lib/errors";
import { getTeam } from "@/services/teamService";
import { VENTURE_STAGE_ORDER } from "@/types/domain";
import type {
  BusinessConcept,
  CustomerConcept,
  MoneyConcept,
  OperationsConcept,
  Venture,
  VentureStageName,
} from "@/types/domain";
import type { SupabaseClientType, Tables, TablesUpdate } from "@/types/supabase-helpers";

export interface ReadinessChecklist {
  company_registered: boolean;
  bank_account_opened: boolean;
  safety_certification_complete: boolean;
  supporting_documents_ready: boolean;
}

export interface ReadinessItem {
  label: string;
  complete: boolean;
}

export interface Readiness {
  percentage: number;
  items: ReadinessItem[];
  remainingActions: string[];
}

function toVenture(row: Tables<"ventures">): Venture {
  return {
    id: row.id,
    teamId: row.team_id,
    opportunityId: row.opportunity_id,
    name: row.name,
    currentStage: row.current_stage as VentureStageName,
    businessConcept: (row.business_concept ?? {}) as BusinessConcept,
    customer: (row.customer ?? {}) as CustomerConcept,
    operations: (row.operations ?? {}) as OperationsConcept,
    money: (row.money ?? {}) as MoneyConcept,
    readinessScore: Number(row.readiness_score),
    launchedAt: row.launched_at,
  };
}

/**
 * Creates the venture workspace immediately after a team forms around a recommended
 * opportunity (spec §22-23) — Team Formed and Opportunity Selected are both already
 * satisfied at this point, so those two stages start complete.
 */
export async function createVenture(
  supabase: SupabaseClientType,
  teamId: string,
  opportunityId: string,
  name: string
): Promise<Venture> {
  const { data: row, error } = await supabase
    .from("ventures")
    .insert({ team_id: teamId, opportunity_id: opportunityId, name, current_stage: "validate_opportunity" })
    .select("*")
    .single();

  if (error || !row) throw new AppError("We couldn't start your business journey. Please try again.", error);

  const stageRows = VENTURE_STAGE_ORDER.map((stage, index) => ({
    venture_id: row.id,
    stage,
    order_index: index,
    status: index < 2 ? "complete" : index === 2 ? "active" : "pending",
    completed_at: index < 2 ? new Date().toISOString() : null,
  }));

  const { error: stagesError } = await supabase.from("venture_stages").insert(stageRows);
  if (stagesError) throw new AppError("We couldn't start your business journey. Please try again.", stagesError);

  return toVenture(row);
}

export async function getVenture(supabase: SupabaseClientType, ventureId: string): Promise<Venture> {
  const { data, error } = await supabase.from("ventures").select("*").eq("id", ventureId).single();
  if (error || !data) throw new AppError("We couldn't find that business.", error);
  return toVenture(data);
}

export async function getVentureByTeam(supabase: SupabaseClientType, teamId: string): Promise<Venture | null> {
  const { data, error } = await supabase.from("ventures").select("*").eq("team_id", teamId).maybeSingle();
  if (error) throw new AppError("We couldn't find that business.", error);
  return data ? toVenture(data) : null;
}

export async function getVentureForUser(supabase: SupabaseClientType, userId: string): Promise<Venture | null> {
  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);
  if (error) throw new AppError("We couldn't load your business.", error);

  for (const m of memberships ?? []) {
    const venture = await getVentureByTeam(supabase, m.team_id);
    if (venture) return venture;
  }
  return null;
}

export async function getVentureStages(supabase: SupabaseClientType, ventureId: string) {
  const { data, error } = await supabase
    .from("venture_stages")
    .select("*")
    .eq("venture_id", ventureId)
    .order("order_index");
  if (error) throw new AppError("We couldn't load the business journey.", error);
  return (data ?? []).map((row) => ({
    stage: row.stage as VentureStageName,
    status: row.status as "pending" | "active" | "complete",
    completedAt: row.completed_at,
  }));
}

/** Moves the venture to the next stage in the journey (spec §23). */
export async function advanceStage(supabase: SupabaseClientType, ventureId: string): Promise<Venture> {
  const venture = await getVenture(supabase, ventureId);
  const currentIndex = VENTURE_STAGE_ORDER.indexOf(venture.currentStage);
  const nextIndex = Math.min(currentIndex + 1, VENTURE_STAGE_ORDER.length - 1);
  if (nextIndex === currentIndex) return venture;

  const nextStage = VENTURE_STAGE_ORDER[nextIndex];

  await supabase
    .from("venture_stages")
    .update({ status: "complete", completed_at: new Date().toISOString() })
    .eq("venture_id", ventureId)
    .eq("stage", venture.currentStage);

  await supabase.from("venture_stages").update({ status: "active" }).eq("venture_id", ventureId).eq("stage", nextStage);

  const { data, error } = await supabase
    .from("ventures")
    .update({ current_stage: nextStage })
    .eq("id", ventureId)
    .select("*")
    .single();

  if (error || !data) throw new AppError("We couldn't update your business journey. Please try again.", error);
  return toVenture(data);
}

export async function updateBusinessBuilder(
  supabase: SupabaseClientType,
  ventureId: string,
  section: "business_concept" | "customer" | "operations" | "money",
  values: Record<string, string>
): Promise<Venture> {
  const venture = await getVenture(supabase, ventureId);
  const current =
    section === "business_concept"
      ? venture.businessConcept
      : section === "customer"
        ? venture.customer
        : section === "operations"
          ? venture.operations
          : venture.money;

  const payload: TablesUpdate<"ventures"> = { [section]: { ...current, ...values } };
  const { data, error } = await supabase.from("ventures").update(payload).eq("id", ventureId).select("*").single();

  if (error || !data) throw new AppError("We couldn't save your business details. Please try again.", error);
  return toVenture(data);
}

export async function getReadinessChecklist(
  supabase: SupabaseClientType,
  ventureId: string
): Promise<ReadinessChecklist> {
  const { data, error } = await supabase.from("ventures").select("readiness_checklist").eq("id", ventureId).single();
  if (error || !data) throw new AppError("We couldn't load your readiness checklist.", error);
  return data.readiness_checklist as unknown as ReadinessChecklist;
}

export async function updateReadinessChecklist(
  supabase: SupabaseClientType,
  ventureId: string,
  patch: Partial<ReadinessChecklist>
): Promise<ReadinessChecklist> {
  const current = await getReadinessChecklist(supabase, ventureId);
  const next = { ...current, ...patch };
  const { error } = await supabase.from("ventures").update({ readiness_checklist: next }).eq("id", ventureId);
  if (error) throw new AppError("We couldn't save your progress. Please try again.", error);
  return next;
}

/** Funding readiness checklist (spec §27) — 8 items, some derived, some manually toggled. */
export async function computeReadiness(supabase: SupabaseClientType, ventureId: string): Promise<Readiness> {
  const venture = await getVenture(supabase, ventureId);
  const team = await getTeam(supabase, venture.teamId);
  const checklist = await getReadinessChecklist(supabase, ventureId);

  const rolesAssigned = team.members.length > 0 && team.members.every((m) => !!m.role);
  const customerDefined = !!venture.customer.targetCustomer && !!venture.customer.customerProblem;
  const businessPlanComplete =
    !!venture.businessConcept.whatWeSell && !!venture.businessConcept.whoWillBuy && !!venture.businessConcept.whyChooseUs;
  const financialForecastComplete = !!venture.money.startupRequirement && !!venture.money.revenueConcept;

  const items: ReadinessItem[] = [
    { label: "Team formed", complete: true },
    { label: "Business opportunity identified", complete: true },
    { label: "Roles assigned", complete: rolesAssigned },
    { label: "Customer defined", complete: customerDefined },
    { label: "Business plan complete", complete: businessPlanComplete },
    { label: "Financial forecast complete", complete: financialForecastComplete },
    { label: "Company registered", complete: checklist.company_registered },
    { label: "Required supporting documents", complete: checklist.supporting_documents_ready },
  ];

  const percentage = Math.round((items.filter((i) => i.complete).length / items.length) * 100);

  const remainingActions: string[] = [];
  if (!checklist.company_registered) remainingActions.push("Complete registration.");
  if (!checklist.bank_account_opened) remainingActions.push("Open business bank account.");
  if (!checklist.safety_certification_complete) remainingActions.push("Complete safety certification.");
  if (!checklist.supporting_documents_ready) remainingActions.push("Prepare required supporting documents.");

  await supabase.from("ventures").update({ readiness_score: percentage / 100 }).eq("id", ventureId);

  return { percentage, items, remainingActions };
}

export async function launchVenture(supabase: SupabaseClientType, ventureId: string): Promise<Venture> {
  await supabase
    .from("venture_stages")
    .update({ status: "complete", completed_at: new Date().toISOString() })
    .eq("venture_id", ventureId)
    .eq("stage", "launch");

  const { data, error } = await supabase
    .from("ventures")
    .update({ current_stage: "launch", launched_at: new Date().toISOString() })
    .eq("id", ventureId)
    .select("*")
    .single();

  if (error || !data) throw new AppError("We couldn't launch your business. Please try again.", error);
  return toVenture(data);
}
