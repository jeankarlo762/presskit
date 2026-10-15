import type { CSSProperties, ReactNode } from "react";

// Every visual property comes from the template's `--pk-h2-*` variables
// (see templates.ts), so one heading component serves all templates.
const headingStyle: CSSProperties = {
  fontFamily: "var(--presskit-font-heading)",
  fontSize: "var(--pk-h2-size)",
  fontWeight: "var(--pk-h2-weight)" as CSSProperties["fontWeight"],
  textTransform: "var(--pk-h2-transform)" as CSSProperties["textTransform"],
  letterSpacing: "var(--pk-h2-tracking)",
  lineHeight: "var(--pk-h2-leading)",
  color: "var(--pk-h2-color)",
  textAlign: "var(--pk-h2-align)" as CSSProperties["textAlign"],
  fontStyle: "var(--pk-h2-style)",
};

const ruleStyle: CSSProperties = {
  display: "var(--pk-h2-rule)",
  margin: "0.75rem auto 0",
  width: "2.5rem",
  height: "2px",
  backgroundColor: "var(--presskit-accent)",
};

export function SectionHeading({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <h2 style={headingStyle}>
      {children}
      <span aria-hidden style={ruleStyle} />
    </h2>
  );
}
