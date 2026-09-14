import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import { getVenture } from "@/services/ventureService";
import { HelpTopicPicker } from "./HelpTopicPicker";

// UBY-013 — Ask For Help (spec §25)
export default async function HelpPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const { ventureId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await getVenture(supabase, ventureId); // 404s via AppError if not found/accessible

  return (
    <div>
      <TopBar title="Ask for help" subtitle="What do you need help with?" back={`/venture/${ventureId}`} />
      <main className="px-6 py-6">
        <HelpTopicPicker ventureId={ventureId} />
      </main>
    </div>
  );
}
