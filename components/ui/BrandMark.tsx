// Three interlocking rings — people/skills coming together — standing in for a
// wordmark-only "U in a circle" logo. Used small as a logo (landing, top bars)
// and large as decorative hero art on otherwise-sparse screens (onboarding).
// Pure inline SVG so it always matches the live theme tokens, in both colour
// schemes, with no external asset.
export function BrandMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="15" stroke="var(--color-gold)" strokeWidth="3" fillOpacity="0" />
      <circle cx="40" cy="24" r="15" stroke="var(--color-gold-dark)" strokeWidth="3" fillOpacity="0" />
      <circle cx="32" cy="38" r="15" fill="var(--color-gold)" fillOpacity="0.16" stroke="var(--color-ink)" strokeWidth="3" />
    </svg>
  );
}
