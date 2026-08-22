import type { TechRiderSectionData } from "../schemas/section";

export function TechRiderBlock({ data }: { data: TechRiderSectionData }) {
  if (!data.text && !data.pdfUrl) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Rider técnico</h2>
      {data.text && (
        <p className="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">{data.text}</p>
      )}
      {data.pdfUrl && (
        <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-2">
          Baixar rider em PDF
        </a>
      )}
    </section>
  );
}
