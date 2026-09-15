import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getMatchProfile, getProfile } from "@/services/profileService";
import { getOpportunity } from "@/services/recommendationService";
import { CreateTeamButton } from "./CreateTeamButton";

// UBY-010 — Proposed Team (spec §22)
export default async function ProposedTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ members?: string; opportunityId?: string }>;
}) {
  const { members, opportunityId } = await searchParams;
  const memberUserIds = (members ?? "").split(",").filter(Boolean);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (memberUserIds.length === 0 || !opportunityId) redirect("/people");

  const allMemberIds = [...new Set([user.id, ...memberUserIds])];

  const [opportunity, profiles, matchProfiles] = await Promise.all([
    getOpportunity(supabase, opportunityId),
    Promise.all(allMemberIds.map((id) => getProfile(supabase, id))),
    Promise.all(allMemberIds.map((id) => getMatchProfile(supabase, id))),
  ]);

  const combinedSkills = [...new Set(matchProfiles.flatMap((p) => p.skills.map((s) => s.skillName)))];
  const teamName = `Team ${opportunity.name.split(" ").slice(0, 2).join(" ")}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="Meet your potential team" back={`/opportunity?members=${memberUserIds.join(",")}`} />
      <main className="flex-1 space-y-5 px-6 py-6">
        <Card>
          <h2 className="text-lg font-bold text-ink">{teamName}</h2>
          <p className="text-sm text-ink-muted">Pursuing: {opportunity.name}</p>

          <ul className="mt-4 space-y-3">
            {profiles.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {p.firstName} {p.lastName}
                    {i === 0 && <span className="ml-2 text-xs font-normal text-ink-muted">(you)</span>}
                  </p>
                  <p className="text-xs text-ink-muted">{matchProfiles[i].skills.map((s) => s.skillName).join(", ") || "—"}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ink">Combined Capability</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {combinedSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-green-light px-2.5 py-1 text-xs font-medium text-green">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        <CreateTeamButton teamName={teamName} opportunityId={opportunity.id} memberUserIds={memberUserIds} />
      </main>
    </div>
  );
}
