export function ProgressBar({ percentage, label }: { percentage: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-ink-muted">{label}</span>
          <span className="font-semibold text-ink">{clamped}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
