import type { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--presskit-accent)]">
      {children}
    </h2>
  );
}
