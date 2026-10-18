import type { StatsSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

export function StatsBlock({ title, data, layout }: { title: string; data: StatsSectionData; layout: string }) {
  const items = data.items ?? [];
  if (items.length === 0) return null;
  const cards = layout === "cards";

  return (
    <section className="flex flex-col gap-5">
      <SectionHeading>{title}</SectionHeading>
      <dl
        className={
          cards
            ? "grid grid-cols-2 gap-3 @3xl:grid-cols-3"
            : "flex flex-wrap gap-x-10 gap-y-6"
        }
      >
        {items.map((item) => (
          <div
            key={`${item.label}:${item.value}`}
            className={
              cards
                ? "flex flex-col gap-1 rounded-[var(--pk-card-radius)] border border-[var(--presskit-border)] bg-[var(--presskit-hover)] p-5"
                : "flex flex-col gap-1"
            }
          >
            <dd
              style={{ fontFamily: "var(--presskit-font-heading)" }}
              className="text-4xl font-bold leading-none tracking-tight text-[var(--presskit-accent)] @3xl:text-5xl"
            >
              {item.value}
            </dd>
            <dt className="text-sm text-[var(--presskit-muted)]">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
