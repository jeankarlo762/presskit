import type { PublicPresskit, PublicSection } from "../types/publicPresskit";
import type {
  BioSectionData,
  ContactSectionData,
  CustomSectionData,
  PressSectionData,
  TechRiderSectionData,
} from "../schemas/section";
import { ARTIST_CATEGORY_LABELS } from "../constants/category";
import { BioBlock } from "./BioBlock";
import { ContactBlock } from "./ContactBlock";
import { MediaEmbedBlock } from "./MediaEmbedBlock";
import { GalleryBlock } from "./GalleryBlock";
import { TourDatesBlock } from "./TourDatesBlock";
import { PressBlock } from "./PressBlock";
import { TechRiderBlock } from "./TechRiderBlock";
import { CustomBlock } from "./CustomBlock";

function renderSection(section: PublicSection, presskit: PublicPresskit) {
  switch (section.type) {
    case "BIO":
      return <BioBlock data={section.data as BioSectionData} />;
    case "CONTACT":
      return <ContactBlock data={section.data as ContactSectionData} />;
    case "MEDIA":
      return <MediaEmbedBlock embeds={presskit.mediaEmbeds} />;
    case "GALLERY":
      return <GalleryBlock photos={presskit.galleryPhotos} />;
    case "TOUR_DATES":
      return <TourDatesBlock dates={presskit.tourDates} />;
    case "PRESS":
      return <PressBlock data={section.data as PressSectionData} mentions={presskit.pressMentions} />;
    case "TECH_RIDER":
      return <TechRiderBlock data={section.data as TechRiderSectionData} />;
    case "CUSTOM":
      return <CustomBlock data={section.data as CustomSectionData} />;
    default:
      return null;
  }
}

export function PresskitRenderer({ presskit }: { presskit: PublicPresskit }) {
  const visibleSections = [...presskit.sections]
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {ARTIST_CATEGORY_LABELS[presskit.category]}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{presskit.artistName}</h1>
        {(presskit.city || presskit.state) && (
          <p className="text-sm text-neutral-500">{[presskit.city, presskit.state].filter(Boolean).join(" - ")}</p>
        )}
      </header>

      {visibleSections.map((section) => (
        <div key={section.id}>{renderSection(section, presskit)}</div>
      ))}
    </div>
  );
}
