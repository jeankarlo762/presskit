import type { SectionPadding, SectionWidth, TemplateKey } from "../constants/theme";

export type HeaderVariant = "classic" | "stage" | "minimal" | "editorial";

/**
 * Everything that differs between templates, in one table — the blocks
 * themselves are shared and read the per-template values through CSS custom
 * properties (`--pk-*`) set on the renderer root. CSS variables instead of a
 * React context because the public page renders this as a Server Component,
 * where context isn't available.
 *
 * Sizes use `cqw` (container query width, the renderer root is an inline
 * container) so the dashboard's phone-sized preview scales exactly like a
 * real phone would, independent of the browser window width.
 */
export type TemplateStyle = {
  header: HeaderVariant;
  /** Content column (below the header). */
  container: string;
  /** Section nav row: same width as the content column and padding that
   * lines the first tab's label up with the section text below it. */
  nav: string;
  /** Extra classes on each section shell (e.g. a top rule). */
  section: string;
  /** Horizontal padding + vertical gap inside every section shell. */
  sectionInner: string;
  /** Defaults a section inherits until the artist overrides them. */
  sectionWidth: SectionWidth;
  sectionPadding: SectionPadding;
  vars: {
    "--pk-h2-size": string;
    "--pk-h2-weight": string;
    "--pk-h2-transform": string;
    "--pk-h2-tracking": string;
    "--pk-h2-leading": string;
    "--pk-h2-color": string;
    "--pk-h2-align": string;
    "--pk-h2-style": string;
    /** `block` shows a short accent rule under section titles. */
    "--pk-h2-rule": string;
    "--pk-card-radius": string;
  };
};

export const TEMPLATE_STYLES: Record<TemplateKey, TemplateStyle> = {
  default: {
    header: "classic",
    container: "mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pt-10 pb-4 @4xl:max-w-4xl @4xl:pt-14 @4xl:pb-8",
    nav: "max-w-2xl px-1 @4xl:max-w-4xl",
    section: "",
    sectionInner: "gap-6 px-4",
    sectionWidth: "normal",
    sectionPadding: "normal",
    vars: {
      "--pk-h2-size": "0.75rem",
      "--pk-h2-weight": "600",
      "--pk-h2-transform": "uppercase",
      "--pk-h2-tracking": "0.15em",
      "--pk-h2-leading": "1.4",
      "--pk-h2-color": "var(--presskit-accent)",
      "--pk-h2-align": "left",
      "--pk-h2-style": "normal",
      "--pk-h2-rule": "none",
      "--pk-card-radius": "1.5rem",
    },
  },
  palco: {
    header: "stage",
    container: "mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 py-12 @3xl:gap-14 @3xl:px-8 @3xl:py-14 @7xl:max-w-6xl",
    nav: "max-w-5xl px-2 @3xl:px-5 @7xl:max-w-6xl",
    section: "",
    sectionInner: "gap-8 px-5 @3xl:px-8",
    sectionWidth: "wide",
    sectionPadding: "normal",
    vars: {
      "--pk-h2-size": "clamp(3rem, 14cqw, 7.5rem)",
      "--pk-h2-weight": "700",
      "--pk-h2-transform": "uppercase",
      "--pk-h2-tracking": "0.01em",
      "--pk-h2-leading": "0.9",
      "--pk-h2-color": "var(--presskit-accent)",
      "--pk-h2-align": "left",
      "--pk-h2-style": "normal",
      "--pk-h2-rule": "none",
      "--pk-card-radius": "12px",
    },
  },
  minimal: {
    header: "minimal",
    container: "mx-auto flex w-full max-w-xl flex-col gap-10 px-6 pt-16 pb-6 @3xl:pt-24 @4xl:max-w-3xl",
    nav: "max-w-xl px-3 @4xl:max-w-3xl",
    section: "border-t border-[var(--presskit-border)]",
    sectionInner: "gap-6 px-6",
    sectionWidth: "narrow",
    sectionPadding: "normal",
    vars: {
      "--pk-h2-size": "0.875rem",
      "--pk-h2-weight": "600",
      "--pk-h2-transform": "none",
      "--pk-h2-tracking": "0",
      "--pk-h2-leading": "1.4",
      "--pk-h2-color": "var(--presskit-text)",
      "--pk-h2-align": "left",
      "--pk-h2-style": "normal",
      "--pk-h2-rule": "none",
      "--pk-card-radius": "4px",
    },
  },
  editorial: {
    header: "editorial",
    container: "mx-auto flex w-full max-w-2xl flex-col gap-14 px-6 pt-14 pb-4 @3xl:gap-20 @3xl:px-10 @3xl:pt-20 @4xl:max-w-4xl",
    // Centered like the headings; the auto margins (not justify-center) keep
    // the first tabs reachable when the row overflows and scrolls.
    nav: "max-w-2xl px-3 @3xl:px-7 @4xl:max-w-4xl [&>a:first-child]:ml-auto [&>a:last-child]:mr-auto",
    section: "",
    sectionInner: "gap-8 px-6 @3xl:px-10",
    sectionWidth: "normal",
    sectionPadding: "spacious",
    vars: {
      "--pk-h2-size": "clamp(1.75rem, 7cqw, 2.375rem)",
      "--pk-h2-weight": "400",
      "--pk-h2-transform": "none",
      "--pk-h2-tracking": "0",
      "--pk-h2-leading": "1.1",
      "--pk-h2-color": "var(--presskit-text)",
      "--pk-h2-align": "center",
      "--pk-h2-style": "italic",
      "--pk-h2-rule": "block",
      "--pk-card-radius": "0px",
    },
  },
};

/** Buttons follow the artist's button style through `--pk-btn-radius`. */
export function presskitButtonClass(variant: "solid" | "outline" = "solid", size: "md" | "sm" = "md") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[var(--pk-btn-radius)] font-bold no-underline transition";
  const sizes = size === "md" ? "min-h-11 px-5 py-2.5 text-[15px]" : "min-h-9 px-3.5 py-1.5 text-sm";
  const variants =
    variant === "solid"
      ? "bg-[var(--presskit-accent)] text-[var(--presskit-on-accent)] hover:opacity-90"
      : "border border-[var(--presskit-border-strong)] text-[var(--presskit-text)] hover:bg-[var(--presskit-hover)]";
  return `${base} ${sizes} ${variants}`;
}
