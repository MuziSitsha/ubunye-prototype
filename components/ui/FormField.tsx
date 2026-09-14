import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const FIELD_BASE =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20";

function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

export function TextField({
  label,
  id,
  className,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} className={clsx(FIELD_BASE, className)} {...props} />
    </div>
  );
}

export function TextAreaField({
  label,
  id,
  className,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} className={clsx(FIELD_BASE, "resize-none", className)} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  id,
  className,
  children,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={clsx(FIELD_BASE, className)} {...props}>
        {children}
      </select>
    </div>
  );
}
