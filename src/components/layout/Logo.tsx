// Inline SVG logo — generated bespoke for MomentumScan.
// A minimal chart glyph: rising line with breakout tick.
// Uses currentColor so it inherits the text color everywhere.

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-label="MomentumScan logo"
        role="img"
      >
        <rect x="0.5" y="0.5" width="31" height="31" rx="6" stroke="currentColor" strokeOpacity="0.25" />
        <path
          d="M5 22 L11 14 L15 18 L21 10 L27 18"
          stroke="#00d18f"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="27" cy="18" r="1.8" fill="#00d18f" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-mono text-sm font-bold tracking-tight text-foreground">
          MomentumScan
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          v0.1 · research
        </span>
      </div>
    </div>
  );
}
