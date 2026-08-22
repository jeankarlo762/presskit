import type { CustomSectionData } from "../schemas/section";

export function CustomBlock({ data }: { data: CustomSectionData }) {
  if (!data.title && !data.body) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{data.title}</h2>
      <p className="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">{data.body}</p>
    </section>
  );
}
