import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { createClient } from "@/lib/supabase/server";
import { computeReadiness, getReadinessChecklist, getVenture } from "@/services/ventureService";
import { listSupportProgrammes } from "@/services/fundingService";
import { ReadinessChecklistPanel } from "./ReadinessChecklistPanel";

const CATEGORY_LABELS: Record<string, string> = {
  bank: "Banks",
  government: "Government Programmes",
  development_agency: "Development Agencies",
  corporate_enterprise_development: "Corporate Enterprise Development",
  grant: "Grants",
  incubator: "Incubators",
  business_competition: "Business Competitions",
  training_provider: "Training Providers",
};

// UBY-014 — Funding & Support (spec §26) + Funding Readiness (spec §27)
export default async function FundingPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const { ventureId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await getVenture(supabase, ventureId);
  const [readiness, checklist, programmes] = await Promise.all([
    computeReadiness(supabase, ventureId),
    getReadinessChecklist(supabase, ventureId),
    listSupportProgrammes(supabase, ventureId),
  ]);

  return (
    <div>
      <TopBar title="Funding & Support" back={`/venture/${ventureId}`} />
      <main className="space-y-5 px-6 py-6">
        <Card>
          <ProgressBar percentage={readiness.percentage} label="Your Funding Readiness" />
          <ul className="mt-4 space-y-1.5">
            {readiness.items.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                <span className={item.complete ? "text-green" : "text-ink-muted"}>{item.complete ? "✓" : "○"}</span>
                <span className={item.complete ? "text-ink" : "text-ink-muted"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <ReadinessChecklistPanel ventureId={ventureId} checklist={checklist} />

        <Disclaimer />

        {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
          const items = programmes.filter((p) => p.category === category);
          if (items.length === 0) return null;
          return (
            <div key={category}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">{label}</h2>
              <div className="space-y-3">
                {items.map((programme) => (
                  <Card key={programme.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{programme.programmeName}</h3>
                        <p className="text-xs text-ink-muted">{programme.provider}</p>
                      </div>
                      <Badge tone="gold">{programme.amountRange}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-ink-muted">{programme.description}</p>
                    <dl className="mt-3 space-y-1 text-xs text-ink-muted">
                      <div>
                        <dt className="inline font-medium text-ink">Support type: </dt>
                        <dd className="inline">{programme.supportType}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Typical eligibility: </dt>
                        <dd className="inline">{programme.typicalEligibility}</dd>
                      </div>
                      {programme.closingDate && (
                        <div>
                          <dt className="inline font-medium text-ink">Closing date: </dt>
                          <dd className="inline">{programme.closingDate}</dd>
                        </div>
                      )}
                    </dl>
                    {programme.whyItMatches && (
                      <p className="mt-3 rounded-lg bg-green-light px-3 py-2 text-xs text-green">
                        <strong>Why it matches:</strong> {programme.whyItMatches}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
