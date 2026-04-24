// Universal footer disclaimer — must appear on every page.
// Short version per compliance copy-rewrites.md §Universal Footer Disclaimer.
// The "See full disclaimer" link resolves to the static legal page served
// from /public/legal/disclaimer.html (same dark-terminal styling).

export function FooterDisclaimer() {
  return (
    <footer className="mt-8 border-t border-border bg-background/60 px-4 py-3 text-center text-xs text-muted-foreground">
      <p className="mx-auto max-w-3xl leading-relaxed">
        For educational use only. Not investment advice. Trading involves risk of loss.{" "}
        <a
          href="/legal/disclaimer.html"
          className="text-primary underline-offset-2 hover:underline"
        >
          See full disclaimer
        </a>
        .
      </p>
    </footer>
  );
}
