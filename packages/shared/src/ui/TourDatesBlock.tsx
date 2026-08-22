import type { PublicTourDate } from "../types/publicPresskit";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function TourDatesBlock({ dates }: { dates: PublicTourDate[] }) {
  if (dates.length === 0) return null;

  const now = Date.now();
  const upcoming = dates.filter((d) => new Date(d.date).getTime() >= now);
  const list = upcoming.length > 0 ? upcoming : dates;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Agenda</h2>
      <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
        {list.map((date) => (
          <li key={date.id} className="flex items-center justify-between gap-4 py-2 text-sm">
            <div>
              <p className="font-medium">{date.venueName}</p>
              <p className="text-neutral-500">{date.city}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-neutral-500">{formatDate(date.date)}</span>
              {date.ticketUrl && (
                <a
                  href={date.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap underline underline-offset-2"
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
