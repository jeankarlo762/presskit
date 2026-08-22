import type { PublicTourDate } from "../types/publicPresskit";
import { SectionHeading } from "./SectionHeading";

// TourDate.date is a date-only value stored as midnight UTC — formatting it
// with the viewer's local timezone (as toLocaleDateString does by default)
// shifts it back a day for anyone west of UTC (e.g. Brazil, UTC-3). Pinning
// timeZone: "UTC" formats the calendar date that was actually stored.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function TourDatesBlock({ title, dates }: { title: string; dates: PublicTourDate[] }) {
  if (dates.length === 0) return null;

  const now = Date.now();
  const upcoming = dates.filter((d) => new Date(d.date).getTime() >= now);
  const list = upcoming.length > 0 ? upcoming : dates;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading>{title}</SectionHeading>
      <ul className="flex flex-col divide-y divide-[var(--presskit-border)]">
        {list.map((date) => (
          <li key={date.id} className="flex items-center justify-between gap-4 py-2 text-sm">
            <div>
              <p className="font-medium">{date.venueName}</p>
              <p className="text-[var(--presskit-muted)]">{date.city}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[var(--presskit-muted)]">{formatDate(date.date)}</span>
              {date.ticketUrl && (
                <a
                  href={date.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-[var(--presskit-accent)] underline underline-offset-2"
                >
                  Ingressos
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
