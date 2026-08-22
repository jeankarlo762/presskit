import type { CSSProperties } from "react";
import type { PublicPresskit, PublicSection } from "../types/publicPresskit";
import type {
  BioSectionData,
  ContactSectionData,
  CustomSectionData,
  PressSectionData,
  TechRiderSectionData,
} from "../schemas/section";
import { ARTIST_CATEGORY_LABELS, SECTION_DEFAULT_TITLES } from "../constants/category";
import { BioBlock } from "./BioBlock";
import { ContactBlock } from "./ContactBlock";
import { AUDIO_PROVIDERS, MediaEmbedBlock, VIDEO_PROVIDERS } from "./MediaEmbedBlock";
import { GalleryBlock } from "./GalleryBlock";
import { TourDatesBlock } from "./TourDatesBlock";
import { PressBlock } from "./PressBlock";
import { TechRiderBlock } from "./TechRiderBlock";
import { CustomBlock } from "./CustomBlock";

function renderSection(section: PublicSection, presskit: PublicPresskit) {
  const title = section.title?.trim() || SECTION_DEFAULT_TITLES[section.type];

  switch (section.type) {
    case "BIO":
      return <BioBlock title={title} data={section.data as BioSectionData} />;
    case "CONTACT":
      return <ContactBlock title={title} data={section.data as ContactSectionData} />;
    case "MUSIC":
      return (
        <MediaEmbedBlock
          title={title}
          embeds={presskit.mediaEmbeds.filter((e) => AUDIO_PROVIDERS.includes(e.provider))}
        />
      );
    case "VIDEO":
      return (
        <MediaEmbedBlock
          title={title}
          embeds={presskit.mediaEmbeds.filter((e) => VIDEO_PROVIDERS.includes(e.provider))}
        />
      );
    case "GALLERY":
      return <GalleryBlock title={title} photos={presskit.galleryPhotos} />;
    case "TOUR_DATES":
      return <TourDatesBlock title={title} dates={presskit.tourDates} />;
    case "PRESS":
      return <PressBlock title={title} data={section.data as PressSectionData} mentions={presskit.pressMentions} />;
    case "TECH_RIDER":
      return <TechRiderBlock title={title} data={section.data as TechRiderSectionData} />;
    case "CUSTOM":
      return <CustomBlock title={title} data={section.data as CustomSectionData} />;
    default:
      return null;
  }
}

/** Colors are the only thing this component drives — font-family is
 * deliberately left to the caller (apps/site applies it via a next/font
 * className wrapper for self-hosted, optimized loading; the dashboard
 * preview applies a plain CSS font-family from FONT_FAMILY_CSS). Mixing a
 * hardcoded font-family here would fight whichever mechanism the host app
 * uses. */
function themeStyle(presskit: PublicPresskit): CSSProperties {
  return {
    ["--presskit-bg" as string]: presskit.themeBackgroundColor,
    ["--presskit-text" as string]: presskit.themeTextColor,
    ["--presskit-accent" as string]: presskit.themeAccentColor,
    ["--presskit-muted" as string]: `color-mix(in srgb, ${presskit.themeTextColor} 65%, transparent)`,
    ["--presskit-border" as string]: `color-mix(in srgb, ${presskit.themeTextColor} 15%, transparent)`,
    backgroundColor: "var(--presskit-bg)",
    color: "var(--presskit-text)",
    backgroundImage: presskit.themeBackgroundImageUrl
      ? `linear-gradient(color-mix(in srgb, var(--presskit-bg) 55%, transparent), var(--presskit-bg)), url(${presskit.themeBackgroundImageUrl})`
      : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };
}

export function PresskitRenderer({ presskit }: { presskit: PublicPresskit }) {
  const visibleSections = [...presskit.sections]
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={themeStyle(presskit)} className="min-h-screen">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--presskit-accent)]">
            {ARTIST_CATEGORY_LABELS[presskit.category]}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{presskit.artistName}</h1>
          {(presskit.city || presskit.state) && (
            <p className="text-sm text-[var(--presskit-muted)]">
              {[presskit.city, presskit.state].filter(Boolean).join(" - ")}
            </p>
          )}
        </header>

        {visibleSections.map((section) => (
          <div key={section.id}>{renderSection(section, presskit)}</div>
        ))}
      </div>
    </div>
  );
}
