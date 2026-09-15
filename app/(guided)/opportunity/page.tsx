import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { createClient } from "@/lib/supabase/server";
import { recommendOpportunityForTeam } from "@/services/recommendationService";
import { getProfile } from "@/services/profileService";

// UBY-008 (We Found Something) + UBY-009 (Why Ubunye Recommended This) — spec §19-21
export default async function OpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ members?: string }>;
}) {
  const { members } = await searchParams;
  const memberUserIds = (members ?? "").split(",").filter(Boolean);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (memberUserIds.length === 0) redirect("/people");

  const [{ opportunity, score, explanation }, memberProfiles] = await Promise.all([
    recommendOpportunityForTeam(supabase, user.id, memberUserIds),
    Promise.all(memberUserIds.map((id) => getProfile(supabase, id))),
  ]);

  const matchPercent = Math.round(score.total * 100);
  const { components } = score;

  const checklistItems = [
    ...components.skill_coverage.matched.map((s) => `Your team covers ${s}`),
    ...components.resource_coverage.matched.map((r) => `Your team has access to ${r}`),
    components.demand.score >= 0.6 ? "Demand exists for this in your area (prototype signal)" : null,
    components.location.score >= 0.8 ? "This opportunity fits where your team is based" : null,
  ].filter((x): x is string => !!x);

  const teamParams = new URLSearchParams({ members: memberUserIds.join(","), opportunityId: opportunity.id });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="We found something" back={`/people`} />
      <main className="flex-1 space-y-5 px-6 py-6">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">{opportunity.name}</h2>
            <span className="shrink-0 rounded-full bg-gold px-3 py-1 text-sm font-bold text-on-gold">
              {matchPercent}% Match
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-muted">{opportunity.description}</p>

          <h3 className="mt-4 text-sm font-semibold text-ink">Why this could work</h3>
          <ul className="mt-2 space-y-1.5">
            {checklistItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-0.5 text-green">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ink">Why Ubunye recommended this</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{explanation}</p>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SectionCard title="Your Team">
            <ul className="space-y-0.5 text-sm text-ink-muted">
              {memberProfiles.map((p) => (
                <li key={p.id}>{p.firstName}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="What Customers Need">
            <p className="text-sm text-ink-muted">{opportunity.customerSegment}</p>
          </SectionCard>
          <SectionCard title="What You Already Have">
            <ul className="space-y-0.5 text-sm text-ink-muted">
              {[...components.skill_coverage.matched, ...components.resource_coverage.matched].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="What You Are Missing">
            {components.skill_coverage.missing.length === 0 && components.resource_coverage.missing.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing critical — your team is well matched.</p>
            ) : (
              <ul className="space-y-0.5 text-sm text-ink-muted">
                {[...components.skill_coverage.missing, ...components.resource_coverage.missing].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <Disclaimer text={`${opportunity.marketSignal}: ${opportunity.demandSummary}`} />

        <LinkButton href={`/team/proposed?${teamParams.toString()}`} size="lg" fullWidth>
          Build This Business
        </LinkButton>
      </main>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h4>
      <div className="mt-2">{children}</div>
    </Card>
  );
}
