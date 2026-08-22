import type { CustomSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

export function CustomBlock({ title, data }: { title: string; data: CustomSectionData }) {
  if (!data.body) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>{title}</SectionHeading>
      <p className="whitespace-pre-line text-sm text-[var(--presskit-muted)]">{data.body}</p>
    </section>
  );
}
