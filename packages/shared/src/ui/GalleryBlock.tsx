import type { PublicGalleryPhoto } from "../types/publicPresskit";
import { SectionHeading } from "./SectionHeading";

export function GalleryBlock({ title, photos }: { title: string; photos: PublicGalleryPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>{title}</SectionHeading>
      <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @4xl:grid-cols-4">
        {photos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.caption ?? ""}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            className="aspect-square w-full rounded-[var(--pk-card-radius)] object-cover"
          />
        ))}
      </div>
    </section>
  );
}
