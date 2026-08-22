import type { BioSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

export function BioBlock({ title, data }: { title: string; data: BioSectionData }) {
  if (!data.shortBio && !data.longBio) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading>{title}</SectionHeading>
      {data.shortBio && <p className="text-lg font-medium leading-relaxed">{data.shortBio}</p>}
      {data.longBio && (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--presskit-muted)]">
          {data.longBio}
        </p>
      )}
    </section>
  );
}
