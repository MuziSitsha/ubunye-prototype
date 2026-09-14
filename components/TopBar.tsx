import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Header used on every authenticated screen (spec §39: "What is happening?" should be
 * answerable at a glance). `back` links to the logical previous step in the journey.
 */
export function TopBar({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-cream/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        {back && (
          <Link
            href={back}
            aria-label="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-sand"
          >
            ←
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
