import type { TestimonialsSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

export function TestimonialsBlock({
  title,
  data,
  layout,
}: {
  title: string;
  data: TestimonialsSectionData;
  layout: string;
}) {
  const items = data.items ?? [];
  if (items.length === 0) return null;

  if (layout === "quotes") {
    return (
      <section className="flex flex-col gap-8">
        <SectionHeading>{title}</SectionHeading>
        {items.map((item, index) => (
          <figure key={index} className="flex flex-col gap-3">
            <blockquote
              style={{ fontFamily: "var(--presskit-font-heading)" }}
              className="text-2xl leading-snug @3xl:text-3xl"
            >
              “{item.quote}”
            </blockquote>
            <figcaption className="text-sm text-[var(--presskit-muted)]">
              <span className="font-semibold text-[var(--presskit-text)]">{item.author}</span>
              {item.role && ` · ${item.role}`}
            </figcaption>
          </figure>
        ))}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <SectionHeading>{title}</SectionHeading>
      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2">
        {items.map((item, index) => (
          <figure
            key={index}
            className="flex flex-col gap-3 rounded-[var(--pk-card-radius)] border border-[var(--presskit-border)] bg-[var(--presskit-hover)] p-5"
          >
            <span aria-hidden className="text-3xl leading-none text-[var(--presskit-accent)]">
              “
            </span>
            <blockquote className="text-[15px] leading-relaxed">{item.quote}</blockquote>
            <figcaption className="text-sm text-[var(--presskit-muted)]">
              <span className="font-semibold text-[var(--presskit-text)]">{item.author}</span>
              {item.role && ` · ${item.role}`}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
