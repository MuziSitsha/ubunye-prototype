// Funding & Support ecosystem (spec §26). Every provider name is fictional
// (docs/decisions.md D7) — is_demo_data is always true in this prototype.

import { AppError } from "@/lib/errors";
import { getOpportunity } from "@/services/recommendationService";
import type { SupportCategory, SupportProgramme } from "@/types/domain";
import type { SupabaseClientType, Tables } from "@/types/supabase-helpers";

function whyProgrammeMatches(category: SupportCategory, opportunityName: string, ventureName: string): string {
  switch (category) {
    case "bank":
      return `A blended loan and mentorship option for when ${ventureName} needs working capital to grow.`;
    case "government":
      return `Aimed at early-stage teams who have identified a real opportunity — like ${opportunityName}.`;
    case "development_agency":
      return `Bridges the gap between a validated opportunity and a funding-ready business plan.`;
    case "corporate_enterprise_development":
      return `Useful once your business can reliably deliver ${opportunityName.toLowerCase()} at scale.`;
    case "grant":
      return `A once-off grant aimed at first-time entrepreneurs building their first formal business.`;
    case "incubator":
      return `Structured support for teams who have just formed and selected an opportunity — exactly where ${ventureName} is now.`;
    case "business_competition":
      return `A chance to raise visibility and prize funding once your business plan is ready.`;
    case "training_provider":
      return `Builds the business fundamentals every team benefits from early in the journey.`;
  }
}

function toSupportProgramme(row: Tables<"support_programmes">, whyItMatches?: string): SupportProgramme {
  return {
    id: row.id,
    category: row.category as SupportCategory,
    provider: row.provider,
    programmeName: row.programme_name,
    supportType: row.support_type,
    typicalEligibility: row.typical_eligibility,
    amountRange: row.amount_range,
    closingDate: row.closing_date,
    description: row.description,
    isDemoData: row.is_demo_data,
    whyItMatches,
  };
}

export async function listSupportProgrammes(
  supabase: SupabaseClientType,
  ventureId?: string
): Promise<SupportProgramme[]> {
  const { data, error } = await supabase.from("support_programmes").select("*").order("category");
  if (error) throw new AppError("We couldn't load funding and support options. Please try again.", error);

  if (!ventureId) return (data ?? []).map((row) => toSupportProgramme(row));

  const { data: venture } = await supabase.from("ventures").select("name, opportunity_id").eq("id", ventureId).single();
  if (!venture) return (data ?? []).map((row) => toSupportProgramme(row));

  const opportunity = await getOpportunity(supabase, venture.opportunity_id);

  return (data ?? []).map((row) =>
    toSupportProgramme(row, whyProgrammeMatches(row.category as SupportCategory, opportunity.name, venture.name))
  );
}
