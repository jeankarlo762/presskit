import type { BioSectionData } from "../schemas/section";

export function BioBlock({ data }: { data: BioSectionData }) {
  if (!data.shortBio && !data.longBio) return null;

  return (
    <section className="flex flex-col gap-3">
      {data.shortBio && <p className="text-lg font-medium leading-relaxed">{data.shortBio}</p>}
      {data.longBio && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {data.longBio}
        </p>
      )}
    </section>
  );
}
