// Prototype data disclaimer (spec §47). Rendered wherever simulated market/funding/partner
// data is shown, so it's never mistaken for live intelligence.

export function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="rounded-xl border border-gold/30 bg-gold-light px-3.5 py-2.5 text-xs text-ink-muted">
      <strong className="text-gold font-semibold">Prototype:</strong>{" "}
      {text ??
        "Some recommendations, market signals, funding programmes and partner interactions are simulated for demonstration purposes."}
    </p>
  );
}
