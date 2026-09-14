import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUserResources, getUserSkills } from "@/services/profileService";
import { ProfileEditor } from "./ProfileEditor";

export default async function ProfilePage() {
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
    <div>
      <TopBar title="Your profile" />
      <main className="px-6 py-6">
        <ProfileEditor profile={profile} initialSkills={skills} initialResourceNames={resources.map((r) => r.name)} />
      </main>
    </div>
  );
}
