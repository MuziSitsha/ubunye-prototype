import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getOpportunity } from "@/services/recommendationService";
import { getTeam } from "@/services/teamService";
import { computeReadiness, getVenture } from "@/services/ventureService";
import { LaunchButton } from "./LaunchButton";

// UBY-016 — Ready To Launch (spec §29)
export default async function LaunchPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const { ventureId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const venture = await getVenture(supabase, ventureId);
  const [team, opportunity, readiness] = await Promise.all([
    getTeam(supabase, venture.teamId),
    getOpportunity(supabase, venture.opportunityId),
    computeReadiness(supabase, ventureId),
  ]);

  const isLaunched = !!venture.launchedAt;

  return (
    <div>
      <TopBar title="Ready to launch" back={`/venture/${ventureId}`} />
      <main className="space-y-5 px-6 py-6">
        {isLaunched ? (
          <Card className="text-center">
            <p className="text-2xl">🎉</p>
            <h2 className="mt-2 text-lg font-bold text-ink">Congratulations</h2>
            <p className="mt-1 text-sm text-ink-muted">Your team has reached launch readiness.</p>
          </Card>
        ) : (
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Business</h2>
            <p className="text-lg font-bold text-ink">{venture.name}</p>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-ink-muted">Team</p>
                <p className="text-sm font-semibold text-ink">{team.members.length} members</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Opportunity</p>
                <p className="text-sm font-semibold text-ink">{opportunity.category}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Readiness</p>
                <p className="text-sm font-semibold text-ink">{readiness.percentage}%</p>
              </div>
            </div>

            {readiness.remainingActions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-ink">Remaining Actions</h3>
                <ul className="mt-1 space-y-1">
                  {readiness.remainingActions.map((action) => (
                    <li key={action} className="text-sm text-ink-muted">
                      • {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {!isLaunched && <LaunchButton ventureId={ventureId} />}
      </main>
    </div>
  );
}
