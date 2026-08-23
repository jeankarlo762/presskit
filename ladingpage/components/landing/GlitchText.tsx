import type { ReactNode } from "react";

/** Pure CSS hover effect (no client JS needed) — the real text stays
 * selectable/accessible, the glitch layers are decorative duplicates read
 * from data-text via ::before/::after. */
export function GlitchText({ text, className = "", as: Tag = "span" }: { text: string; className?: string; as?: "span" | "h1" | "h2" }) {
  return (
    <Tag className={`glitch-hover ${className}`} data-text={text}>
      {text as ReactNode}
    </Tag>
  );
}
