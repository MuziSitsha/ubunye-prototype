import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-terracotta text-white hover:bg-terracotta-dark disabled:opacity-50",
  secondary: "bg-green-light text-green hover:bg-green hover:text-white disabled:opacity-50",
  ghost: "bg-transparent text-ink border border-border hover:bg-sand disabled:opacity-50",
  danger: "bg-danger-light text-danger hover:bg-danger hover:text-white disabled:opacity-50",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors cursor-pointer disabled:cursor-not-allowed";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", size = "md", fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], fullWidth && "w-full", className)}
      {...props}
    />
  );
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export function LinkButton({ href, variant = "primary", size = "md", fullWidth, className, children }: LinkButtonProps) {
  return (
    <Link href={href} className={clsx(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], fullWidth && "w-full", className)}>
      {children}
    </Link>
  );
}
