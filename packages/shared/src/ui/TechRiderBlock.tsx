import type { TechRiderSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

export function TechRiderBlock({ title, data }: { title: string; data: TechRiderSectionData }) {
  if (!data.text && !data.pdfUrl) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>{title}</SectionHeading>
      {data.text && (
        <p className="whitespace-pre-line text-sm text-[var(--presskit-muted)]">{data.text}</p>
      )}
      {data.pdfUrl && (
        <a
          href={data.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--presskit-accent)] underline underline-offset-2"
        >
          Baixar rider em PDF
        </a>
      )}
    </section>
  );
}
