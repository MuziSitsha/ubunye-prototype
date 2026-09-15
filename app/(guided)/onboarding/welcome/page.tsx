import { LinkButton } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";

// UBY-003 — Welcome (spec §10)
export default function OnboardingWelcomePage() {
  const steps = [
    { title: "Tell us what you do", detail: "In your own words — no CV, no jargon." },
    { title: "Meet your team", detail: "People whose skills fill the gaps in yours." },
    { title: "Get matched", detail: "A real opportunity, with reasons you can check." },
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col px-6 py-10">
      <div className="flex flex-1 flex-col justify-center py-10">
        <BrandMark size={56} className="mb-6" />

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Getting started</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-ink">Let&apos;s start with you.</h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-muted">
          You don&apos;t need a CV or a business idea. Tell us what you know how to do — Ubunye
          does the rest.
        </p>

        <ol className="relative mt-10 space-y-7 border-l border-border pl-6">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-on-gold">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-ink">{step.title}</p>
              <p className="text-sm text-ink-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>

      <LinkButton href="/onboarding/skills" size="lg" fullWidth>
        Tell Ubunye what I can do
      </LinkButton>
    </main>
  );
}
