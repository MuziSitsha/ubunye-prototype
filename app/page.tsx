import { LinkButton } from "@/components/ui/Button";

// UBY-001 — Landing Screen (spec §9)
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl md:max-w-2xl lg:max-w-4xl flex-col justify-between px-6 py-10">
      <div>
        <div className="mb-10 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-sm font-bold text-white">
            U
          </span>
          <span className="text-lg font-semibold text-ink">Ubunye</span>
        </div>

        <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">
          You don&apos;t need a business idea to start.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">Tell us what you can do.</p>

        <p className="mt-8 text-sm leading-relaxed text-ink-muted">
          Ubunye finds people whose abilities complement yours, matches you to a real
          opportunity, explains why, and helps your team build a business — one step at a
          time.
        </p>

        <ol className="mt-8 space-y-3 text-sm text-ink">
          {[
            "Tell Ubunye what you can do",
            "Meet people who complement your skills",
            "Get matched to a real opportunity, with reasons",
            "Build the business together",
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-light text-xs font-semibold text-green">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 space-y-3">
        <LinkButton href="/register" size="lg" fullWidth>
          Get Started
        </LinkButton>
        <LinkButton href="/login" variant="ghost" size="lg" fullWidth>
          Sign In
        </LinkButton>
        <LinkButton href="/demo" variant="secondary" size="lg" fullWidth>
          View Demo
        </LinkButton>
      </div>
    </main>
  );
}
