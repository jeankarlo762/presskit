import type { PublicTourDate } from "../types/publicPresskit";
import { SectionHeading } from "./SectionHeading";
import { presskitButtonClass } from "./templates";

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

export function TourDatesBlock({
  title,
  dates,
  ticketsLabel = "Ingressos",
  layout = "list",
}: {
  title: string;
  dates: PublicTourDate[];
  ticketsLabel?: string;
  layout?: string;
}) {
  if (dates.length === 0) return null;

  const now = Date.now();
  const upcoming = dates.filter((d) => new Date(d.date).getTime() >= now);
  const list = upcoming.length > 0 ? upcoming : dates;

  if (layout === "cards") {
    return (
      <section className="flex flex-col gap-4">
        <SectionHeading>{title}</SectionHeading>
        <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @4xl:grid-cols-3">
          {list.map((date) => {
            const day = new Date(date.date);
            return (
              <li
                key={date.id}
                className="flex items-center gap-4 rounded-[var(--pk-card-radius)] border border-[var(--presskit-border)] bg-[var(--presskit-hover)] p-4"
              >
                <div className="flex w-14 shrink-0 flex-col items-center rounded-[var(--pk-btn-radius)] bg-[var(--presskit-accent)] py-2 text-[var(--presskit-on-accent)]">
                  <span className="text-2xl font-bold leading-none">{String(day.getUTCDate()).padStart(2, "0")}</span>
                  <span className="text-[11px] font-semibold uppercase">
                    {day.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{date.venueName}</span>
                  <span className="text-sm text-[var(--presskit-muted)]">{date.city}</span>
                </div>
                {date.ticketUrl && (
                  <a
                    href={date.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="tickets"
                    className={presskitButtonClass("outline", "sm")}
                  >
                    {ticketsLabel}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading>{title}</SectionHeading>
      <ul className="flex flex-col divide-y divide-[var(--presskit-border)]">
        {list.map((date) => (
          <li key={date.id} className="flex items-center justify-between gap-4 py-3 text-sm">
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
                  className={`whitespace-nowrap ${presskitButtonClass("outline", "sm")}`}
                >
                  {ticketsLabel}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
