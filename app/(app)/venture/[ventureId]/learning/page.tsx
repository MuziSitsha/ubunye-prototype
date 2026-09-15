import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getVenture } from "@/services/ventureService";
import { recommendCoursesForVenture } from "@/services/learningService";

const FORMAT_LABELS: Record<string, string> = { online: "Online", in_person: "In person", hybrid: "Hybrid" };

// UBY-015 — Build Your Skills (spec §28)
export default async function LearningPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const { ventureId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await getVenture(supabase, ventureId);
  const courses = await recommendCoursesForVenture(supabase, ventureId);

  return (
    <div>
      <TopBar title="Build your skills" subtitle="What your opportunity needs vs. what your team has" back={`/venture/${ventureId}`} />
      <main className="space-y-3 px-6 py-6">
        {courses.length === 0 ? (
          <EmptyState title="No gaps found" description="Your team already covers everything this opportunity needs." />
        ) : (
          courses.map((course) => (
            <Card key={course.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{course.title}</h3>
                {course.skillName && <Badge tone="gold">{course.skillName}</Badge>}
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                <span className="font-medium text-ink">Reason: </span>
                {course.reason}
              </p>
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <div>
                  <dt className="inline font-medium text-ink">Provider: </dt>
                  <dd className="inline">{course.provider}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-ink">Format: </dt>
                  <dd className="inline">{FORMAT_LABELS[course.format]}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-ink">Duration: </dt>
                  <dd className="inline">{course.duration}</dd>
                </div>
              </dl>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
