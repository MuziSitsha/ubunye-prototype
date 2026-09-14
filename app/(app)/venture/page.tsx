import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getVentureForUser } from "@/services/ventureService";

export default async function VentureIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const venture = await getVentureForUser(supabase, user.id);
  if (venture) redirect(`/venture/${venture.id}`);

  return (
    <div>
      <TopBar title="Business" />
      <main className="px-6 py-6">
        <EmptyState
          title="No business yet"
          description="Once you find people to build with and land on an opportunity together, your business journey opens up here."
          action={<LinkButton href="/people">Find Opportunities</LinkButton>}
        />
      </main>
    </div>
  );
}
