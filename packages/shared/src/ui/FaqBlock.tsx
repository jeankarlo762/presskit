import type { FaqSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

/** Native <details> accordion — keyboard accessible, no JS on the page. */
export function FaqBlock({ title, data }: { title: string; data: FaqSectionData }) {
  const items = data.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>{title}</SectionHeading>
      <div className="flex flex-col divide-y divide-[var(--presskit-border)] border-y border-[var(--presskit-border)]">
        {items.map((item, index) => (
          <details key={index} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden
                className="shrink-0 text-[var(--presskit-accent)] transition group-open:rotate-45"
                style={{ fontSize: "1.5rem", lineHeight: 1 }}
              >
                +
              </span>
            </summary>
            <p className="whitespace-pre-line pt-2 text-[15px] leading-relaxed text-[var(--presskit-muted)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
