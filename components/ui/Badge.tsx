import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "terracotta" | "green" | "gold" | "neutral" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  terracotta: "bg-terracotta-light text-terracotta-dark",
  green: "bg-green-light text-green",
  gold: "bg-gold-light text-gold",
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
