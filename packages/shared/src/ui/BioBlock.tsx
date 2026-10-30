import type { BioSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

export function BioBlock({
  title,
  data,
  layout = "text",
  imageUrl,
}: {
  title: string;
  data: BioSectionData;
  layout?: string;
  /** Avatar or cover, used by the "split" layout. */
  imageUrl?: string | null;
}) {
  if (!data.shortBio && !data.longBio) return null;

  const text = (
    <>
      {data.shortBio && <p className="max-w-3xl text-lg font-medium leading-relaxed">{data.shortBio}</p>}
      {data.longBio && (
        <p className="max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-[var(--presskit-muted)]">
          {data.longBio}
        </p>
      )}
    </>
  );

  if (layout === "split" && imageUrl) {
    return (
      <section className="flex flex-col gap-4">
        <SectionHeading>{title}</SectionHeading>
        <div className="grid grid-cols-1 items-start gap-5 @3xl:grid-cols-[2fr_3fr] @3xl:gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="aspect-[4/5] w-full rounded-[var(--pk-card-radius)] object-cover" />
          <div className="flex flex-col gap-3">{text}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading>{title}</SectionHeading>
      {text}
    </section>
  );
}
