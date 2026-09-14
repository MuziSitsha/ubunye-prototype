import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getVentureForUser } from "@/services/ventureService";

export default async function SupportIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const venture = await getVentureForUser(supabase, user.id);
  if (venture) redirect(`/venture/${venture.id}/funding`);

  return (
    <div>
      <TopBar title="Support" />
      <main className="px-6 py-6">
        <EmptyState
          title="Support opens up once you have a business"
          description="Funding programmes, skills development and Ask For Help all become relevant once your team has an opportunity to build toward."
          action={<LinkButton href="/people">Find Opportunities</LinkButton>}
        />
      </main>
    </div>
  );
}
