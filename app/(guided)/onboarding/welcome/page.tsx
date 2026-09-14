import { LinkButton } from "@/components/ui/Button";

// UBY-003 — Welcome (spec §10)
export default function OnboardingWelcomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-between px-6 py-10">
      <div className="pt-10">
        <h1 className="text-3xl font-bold leading-tight text-ink">Let&apos;s start with you.</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          You don&apos;t need a CV or a business idea. Tell us what you know how to do.
        </p>
      </div>
      <LinkButton href="/onboarding/skills" size="lg" fullWidth>
        Tell Ubunye what I can do
      </LinkButton>
    </main>
  );
}
