import type { PublicGalleryPhoto } from "../types/publicPresskit";
import { SectionHeading } from "./SectionHeading";

function Photo({ photo, className }: { photo: PublicGalleryPhoto; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.url}
      alt={photo.caption ?? ""}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      className={className}
    />
  );
}

export function GalleryBlock({
  title,
  photos,
  layout = "grid",
}: {
  title: string;
  photos: PublicGalleryPhoto[];
  layout?: string;
}) {
  if (photos.length === 0) return null;

  let body;
  if (layout === "masonry") {
    // CSS columns keep each photo's own aspect ratio — a mosaic, not a grid.
    body = (
      <div className="columns-2 gap-2 @lg:columns-3 [&>img]:mb-2 [&>img]:break-inside-avoid">
        {photos.map((photo) => (
          <Photo key={photo.id} photo={photo} className="w-full rounded-[var(--pk-card-radius)] object-cover" />
        ))}
      </div>
    );
  } else if (layout === "strip") {
    body = (
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        {photos.map((photo) => (
          <Photo
            key={photo.id}
            photo={photo}
            className="h-56 w-auto max-w-[85%] shrink-0 snap-start rounded-[var(--pk-card-radius)] object-cover @3xl:h-72"
          />
        ))}
      </div>
    );
  } else {
    body = (
      <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @4xl:grid-cols-4">
        {photos.map((photo) => (
          <Photo key={photo.id} photo={photo} className="aspect-square w-full rounded-[var(--pk-card-radius)] object-cover" />
        ))}
      </div>
    );
  }

  return (
    <section className="flex w-full flex-col gap-4">
      <SectionHeading>{title}</SectionHeading>
      {body}
    </section>
  );
}
