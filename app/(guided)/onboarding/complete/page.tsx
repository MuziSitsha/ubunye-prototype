import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUserResources, getUserSkills } from "@/services/profileService";

// Profile completion (spec §13 — "Your Ubunye Profile")
export default async function ProfileCompletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, skills, resources] = await Promise.all([
    getProfile(supabase, user.id),
    getUserSkills(supabase, user.id),
    getUserResources(supabase, user.id),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col">
      <TopBar title="Your Ubunye Profile" back="/onboarding/resources" />
      <main className="flex-1 space-y-4 px-6 py-6">
        <Card>
          <h2 className="text-xl font-semibold text-ink">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {profile.city}
            {profile.province ? `, ${profile.province}` : ""}
          </p>

          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Badge key={s.skillId} tone="green">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Resources</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {resources.map((r) => (
                <Badge key={r.resourceId} tone="gold">
                  {r.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Availability</h3>
            <p className="mt-1 text-sm capitalize text-ink">{profile.availability?.replace("_", " ")}</p>
          </div>
        </Card>

        <LinkButton href="/people" size="lg" fullWidth>
          Find Opportunities
        </LinkButton>
      </main>
    </div>
  );
}
