import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import { getVenture } from "@/services/ventureService";
import { BusinessBuilderForm } from "./BusinessBuilderForm";

// UBY-012 — Build Your Business (spec §24)
export default async function BusinessBuilderPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const { ventureId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const venture = await getVenture(supabase, ventureId);

  return (
    <div>
      <TopBar title="Build your business" back={`/venture/${ventureId}`} />
      <main className="px-6 py-6">
        <BusinessBuilderForm ventureId={ventureId} venture={venture} />
      </main>
    </div>
  );
}
