import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "gold" | "green" | "neutral" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  gold: "bg-gold-light text-gold-dark",
  green: "bg-green-light text-green",
  neutral: "bg-sand text-ink-muted",
  danger: "bg-danger-light text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}
