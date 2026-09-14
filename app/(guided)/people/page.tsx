import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatList } from "@/lib/format";
import { recommendPeopleForUser } from "@/services/recommendationService";
import { getVentureForUser } from "@/services/ventureService";
import { PeopleList } from "./PeopleList";

// UBY-007 — People You Could Build With (spec §16)
export default async function PeoplePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const existingVenture = await getVentureForUser(supabase, user.id);
  if (existingVenture) redirect(`/venture/${existingVenture.id}`);

  const result = await recommendPeopleForUser(supabase, user.id);

  const people = result.people.map(({ profile, score }) => ({
    userId: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    city: profile.city,
    total: score.total,
    whyMatched:
      score.components.gap_coverage.closes.length > 0
        ? `${profile.firstName} has ${formatList(score.components.gap_coverage.closes)} that your potential team currently lacks.`
        : `${profile.firstName} could still bring complementary experience to your team.`,
  }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <TopBar title="People you could build with" subtitle="Pick 2 or 3 people to explore an opportunity with" back="/onboarding/complete" />
      <main className="flex-1 space-y-4 px-6 py-6">
        <Disclaimer text="These are the other people seeded into this demonstration — in production, Ubunye's real user base would populate this list." />

        {result.people.length === 0 ? (
          <EmptyState
            title="No matches yet"
            description="There's no one else in the catalogue right now who closes your gaps. Try the demo panel to load more personas."
            action={<LinkButton href="/demo">Open demo panel</LinkButton>}
          />
        ) : (
          <PeopleList people={people} />
        )}
      </main>
    </div>
  );
}
