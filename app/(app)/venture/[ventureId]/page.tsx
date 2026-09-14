import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getOpportunity } from "@/services/recommendationService";
import { getTeam } from "@/services/teamService";
import { getVenture, getVentureStages } from "@/services/ventureService";
import { VENTURE_STAGE_ORDER } from "@/types/domain";
import { AdvanceStageButton } from "./AdvanceStageButton";

const STAGE_LABELS: Record<string, string> = {
  team_formed: "Team Formed",
  opportunity_selected: "Opportunity Selected",
  validate_opportunity: "Validate Opportunity",
  develop_business: "Develop Business",
  funding_ready: "Funding Ready",
  launch: "Launch",
};

const NEXT_LABELS: Record<string, string> = {
  validate_opportunity: "Mark Opportunity Validated",
  develop_business: "Mark Business Developed",
  funding_ready: "Mark Funding Ready",
};

// UBY-011 — Business Journey (spec §23)
export default async function VenturePage({ params }: { params: Promise<{ ventureId: string }> }) {
  const { ventureId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const venture = await getVenture(supabase, ventureId);
  const [stages, team, opportunity] = await Promise.all([
    getVentureStages(supabase, ventureId),
    getTeam(supabase, venture.teamId),
    getOpportunity(supabase, venture.opportunityId),
  ]);

  const isLaunched = !!venture.launchedAt;

  return (
    <div>
      <TopBar title={venture.name} subtitle={opportunity.name} back="/dashboard" />
      <main className="space-y-5 px-6 py-6">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Journey</h2>
          <ol className="mt-3 space-y-3">
            {VENTURE_STAGE_ORDER.map((stage, index) => {
              const stageState = stages.find((s) => s.stage === stage);
              const status = stageState?.status ?? "pending";
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      status === "complete"
                        ? "bg-green text-white"
                        : status === "active"
                          ? "bg-terracotta text-white"
                          : "bg-sand text-ink-muted"
                    }`}
                  >
                    {status === "complete" ? "✓" : index + 1}
                  </span>
                  <span className={`text-sm ${status === "pending" ? "text-ink-muted" : "font-medium text-ink"}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                </li>
              );
            })}
          </ol>

          {!isLaunched && NEXT_LABELS[venture.currentStage] && (
            <div className="mt-4">
              <AdvanceStageButton ventureId={ventureId} label={NEXT_LABELS[venture.currentStage]} />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Team</h2>
          <ul className="mt-2 space-y-1">
            {team.members.map((m) => (
              <li key={m.userId} className="text-sm text-ink">
                {m.firstName} {m.lastName}
                {m.role && <span className="text-ink-muted"> — {m.role}</span>}
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <JourneyLink href={`/venture/${ventureId}/build`} title="Business Development" description="Concept, customer, operations, money" />
          <JourneyLink href={`/venture/${ventureId}/funding`} title="Funding & Readiness" description="Programmes and your readiness score" />
          <JourneyLink href={`/venture/${ventureId}/learning`} title="Skills Development" description="Courses to close your gaps" />
          <JourneyLink href={`/venture/${ventureId}/help`} title="Ask For Help" description="Get support on any part of the journey" />
        </div>

        {venture.currentStage === "funding_ready" || isLaunched ? (
          <LinkButton href={`/venture/${ventureId}/launch`} size="lg" fullWidth>
            {isLaunched ? "View Launch Status" : "Ready To Launch"}
          </LinkButton>
        ) : null}
      </main>
    </div>
  );
}

function JourneyLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-border bg-surface p-4 hover:bg-sand">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-ink-muted">{description}</p>
    </Link>
  );
}
