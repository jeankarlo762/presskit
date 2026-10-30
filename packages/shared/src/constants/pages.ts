import { resolveTemplateKey } from "./theme";

/** Pages a multi-page presskit has besides its home (/<slug>), in nav
 * order. The values are the URL segments: /<slug>/musicas etc. */
export const PRESSKIT_SUBPAGES = ["musicas", "agenda", "midia"] as const;
export type PresskitSubpage = (typeof PRESSKIT_SUBPAGES)[number];
export type PresskitPage = "home" | PresskitSubpage;

export function isPresskitSubpage(value: string): value is PresskitSubpage {
  return (PRESSKIT_SUBPAGES as readonly string[]).includes(value);
}

/** Palco is a small site (Home, Músicas, Agenda, Mídia); the other
 * templates stay a single scrolling page. */
export function isMultiPageTemplate(templateKey: string | null | undefined): boolean {
  return resolveTemplateKey(templateKey) === "palco";
}

/** Today's calendar date (YYYY-MM-DD) in Brazil — tour dates are stored as
 * date-only values, so "from today on" compares calendar dates, not
 * instants (an event tonight must still be listed after midnight UTC). */
export function todayIsoDate(timeZone = "America/Sao_Paulo"): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Events from today on, soonest first. */
export function upcomingTourDates<T extends { date: string }>(dates: T[], today = todayIsoDate()): T[] {
  return dates.filter((d) => d.date.slice(0, 10) >= today).sort((a, b) => a.date.localeCompare(b.date));
}
