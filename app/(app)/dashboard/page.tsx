import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUserSkills } from "@/services/profileService";
import { getOpportunity } from "@/services/recommendationService";
import { getTeam } from "@/services/teamService";
import { computeReadiness, getVentureForUser } from "@/services/ventureService";
import { recommendCoursesForVenture } from "@/services/learningService";
import { listSupportProgrammes } from "@/services/fundingService";
import { VENTURE_STAGE_ORDER } from "@/types/domain";

const STAGE_LABELS: Record<string, string> = {
  team_formed: "Team Formed",
  opportunity_selected: "Opportunity Selected",
  validate_opportunity: "Validate Opportunity",
  develop_business: "Develop Business",
  funding_ready: "Funding Ready",
  launch: "Launch",
};

// UBY-017 — Home dashboard (spec §30)
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, skills, venture] = await Promise.all([
    getProfile(supabase, user.id),
    getUserSkills(supabase, user.id),
    getVentureForUser(supabase, user.id),
  ]);

  if (!profile.onboardingCompletedAt) redirect("/onboarding/welcome");

  const [team, opportunity, readiness, courses, programmes] = venture
    ? await Promise.all([
        getTeam(supabase, venture.teamId),
        getOpportunity(supabase, venture.opportunityId),
        computeReadiness(supabase, venture.id),
        recommendCoursesForVenture(supabase, venture.id),
        listSupportProgrammes(supabase, venture.id),
      ])
    : [null, null, null, [], []];

  return (
    <div>
      <TopBar title={`Welcome back, ${profile.firstName}`} />
      <main className="space-y-4 px-6 py-6">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">My Profile</h2>
            <Link href="/profile" className="text-xs font-medium text-terracotta">
              Edit
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink">
            {profile.city}, {profile.province} · {profile.availability?.replace("_", " ")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.slice(0, 6).map((s) => (
              <Badge key={s.skillId} tone="green">
                {s.name}
              </Badge>
            ))}
          </div>
        </Card>

        {venture && team && opportunity && readiness ? (
          <>
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">My Team</h2>
              <p className="mt-1 text-sm font-medium text-ink">{team.name}</p>
              <p className="text-xs text-ink-muted">{team.members.map((m) => m.firstName).join(", ")}</p>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">My Opportunity</h2>
              <p className="mt-1 text-sm font-medium text-ink">{opportunity.name}</p>
              <p className="text-xs text-ink-muted">{opportunity.category}</p>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Business Journey</h2>
                <Link href={`/venture/${venture.id}`} className="text-xs font-medium text-terracotta">
                  Open
                </Link>
              </div>
              <p className="mt-1 text-sm font-medium text-ink">{STAGE_LABELS[venture.currentStage]}</p>
              <p className="text-xs text-ink-muted">
                Stage {VENTURE_STAGE_ORDER.indexOf(venture.currentStage) + 1} of {VENTURE_STAGE_ORDER.length}
              </p>
            </Card>

            <Card>
              <ProgressBar percentage={readiness.percentage} label="Funding readiness" />
              {readiness.remainingActions.length > 0 && (
                <p className="mt-2 text-sm text-ink-muted">
                  Next: <span className="text-ink">{readiness.remainingActions[0]}</span>
                </p>
              )}
              <LinkButton href={`/venture/${venture.id}/funding`} variant="ghost" size="sm" className="mt-3">
                Improve My Readiness
              </LinkButton>
            </Card>

            {courses.length > 0 && (
              <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Skills For You</h2>
                <ul className="mt-2 space-y-1">
                  {courses.slice(0, 3).map((c) => (
                    <li key={c.id} className="text-sm text-ink">
                      {c.title}
                    </li>
                  ))}
                </ul>
                <LinkButton href={`/venture/${venture.id}/learning`} variant="ghost" size="sm" className="mt-3">
                  View all
                </LinkButton>
              </Card>
            )}

            {programmes.length > 0 && (
              <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Support Available</h2>
                <ul className="mt-2 space-y-1">
                  {programmes.slice(0, 3).map((p) => (
                    <li key={p.id} className="text-sm text-ink">
                      {p.programmeName} — {p.provider}
                    </li>
                  ))}
                </ul>
                <LinkButton href={`/venture/${venture.id}/funding`} variant="ghost" size="sm" className="mt-3">
                  View all
                </LinkButton>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <h2 className="text-sm font-semibold text-ink">Recommended action</h2>
            <p className="mt-1 text-sm text-ink-muted">
              You haven&apos;t formed a team yet. See who you could build with and find your opportunity.
            </p>
            <LinkButton href="/people" size="md" className="mt-3">
              Find Opportunities
            </LinkButton>
          </Card>
        )}
      </main>
    </div>
  );
}
