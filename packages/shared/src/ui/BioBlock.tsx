import type { BioSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

export function BioBlock({
  title,
  data,
  layout = "text",
  imageUrl,
  stage = false,
}: {
  title: string;
  data: BioSectionData;
  layout?: string;
  /** Avatar or cover, used by the "split" layout. */
  imageUrl?: string | null;
  /** Palco: larger type, and on desktop the title sits beside the text. */
  stage?: boolean;
}) {
  if (!data.shortBio && !data.longBio) return null;

  const text = (
    <>
      {data.shortBio && (
        <p
          className={
            stage
              ? "max-w-3xl text-xl font-semibold leading-snug @4xl:text-3xl"
              : "max-w-3xl text-lg font-medium leading-relaxed"
          }
        >
          {data.shortBio}
        </p>
      )}
      {data.longBio && (
        <p
          className={`max-w-3xl whitespace-pre-line leading-relaxed text-[var(--presskit-muted)] ${stage ? "text-base @4xl:text-xl" : "text-[15px]"}`}
        >
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

  if (stage) {
    return (
      <section className="grid grid-cols-1 gap-5 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @4xl:gap-16">
        <SectionHeading>{title}</SectionHeading>
        <div className="flex flex-col gap-4 @4xl:gap-6">{text}</div>
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
