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
import {
  BUTTON_STYLE_RADIUS,
  DEFAULT_BUTTON_STYLE,
  FONT_FAMILY_CSS,
  resolveTemplateKey,
  type FontKey,
} from "../constants/theme";
import { presskitButtonClass, TEMPLATE_STYLES, type HeaderVariant } from "./templates";
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

/** CSS url() with a quoted string — JSON.stringify escapes `"` and `\`,
 * which is exactly the set CSS string literals need escaped, so a URL
 * containing `)` or quotes can't close the url() early and inject
 * declarations. The URL itself is server-built (R2 base + key), this is
 * defence in depth for anything already stored. */
function cssUrl(url: string): string {
  return `url(${JSON.stringify(url)})`;
}

/** Black or white, whichever reads better on the accent color. */
function readableOn(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return "#ffffff";
  const n = parseInt(match[1] ?? "000000", 16);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return luminance > 0.4 ? "#111111" : "#ffffff";
}

export type PresskitFontFamilies = Record<FontKey, string>;

function themeStyle(presskit: PublicPresskit, fonts: PresskitFontFamilies, pageBackgroundImage: boolean): CSSProperties {
  const template = TEMPLATE_STYLES[resolveTemplateKey(presskit.templateKey)];
  const bodyFont = fonts[presskit.themeFontKey] ?? FONT_FAMILY_CSS.inter;
  const headingFont = presskit.themeHeadingFontKey ? (fonts[presskit.themeHeadingFontKey] ?? bodyFont) : bodyFont;
  const buttonRadius = BUTTON_STYLE_RADIUS[presskit.themeButtonStyle ?? DEFAULT_BUTTON_STYLE] ?? BUTTON_STYLE_RADIUS.ROUNDED;

  return {
    ...(template.vars as CSSProperties),
    ["--presskit-bg" as string]: presskit.themeBackgroundColor,
    ["--presskit-text" as string]: presskit.themeTextColor,
    ["--presskit-accent" as string]: presskit.themeAccentColor,
    ["--presskit-on-accent" as string]: readableOn(presskit.themeAccentColor),
    ["--presskit-muted" as string]: `color-mix(in srgb, ${presskit.themeTextColor} 65%, transparent)`,
    ["--presskit-border" as string]: `color-mix(in srgb, ${presskit.themeTextColor} 15%, transparent)`,
    ["--presskit-border-strong" as string]: `color-mix(in srgb, ${presskit.themeTextColor} 30%, transparent)`,
    ["--presskit-hover" as string]: `color-mix(in srgb, ${presskit.themeTextColor} 8%, transparent)`,
    ["--presskit-font-body" as string]: bodyFont,
    ["--presskit-font-heading" as string]: headingFont,
    ["--pk-btn-radius" as string]: buttonRadius,
    fontFamily: "var(--presskit-font-body)",
    // Fonts like Bebas Neue / DM Serif ship a single weight — never let the
    // browser fake a bold version of them.
    fontSynthesisWeight: "none",
    backgroundColor: "var(--presskit-bg)",
    color: "var(--presskit-text)",
    backgroundImage:
      pageBackgroundImage && presskit.themeBackgroundImageUrl
        ? `linear-gradient(color-mix(in srgb, var(--presskit-bg) 55%, transparent), var(--presskit-bg)), ${cssUrl(presskit.themeBackgroundImageUrl)}`
        : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };
}

const headingFontStyle: CSSProperties = { fontFamily: "var(--presskit-font-heading)" };

function HeaderActions({ presskit }: { presskit: PublicPresskit }) {
  const visible = (type: PublicSection["type"]) => presskit.sections.find((s) => s.type === type && s.visible);
  const contact = visible("CONTACT")?.data as ContactSectionData | undefined;
  const rider = visible("TECH_RIDER")?.data as TechRiderSectionData | undefined;
  const hasContact = Boolean(contact?.email || contact?.phone);
  if (!hasContact && !rider?.pdfUrl) return null;

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {hasContact && (
        <a href="#contato" className={presskitButtonClass("solid")}>
          Contratar para um evento
        </a>
      )}
      {rider?.pdfUrl && (
        <a href={rider.pdfUrl} target="_blank" rel="noopener noreferrer" className={presskitButtonClass("outline")}>
          Baixar rider técnico
        </a>
      )}
    </div>
  );
}

function Header({ variant, presskit }: { variant: HeaderVariant; presskit: PublicPresskit }) {
  const category = ARTIST_CATEGORY_LABELS[presskit.category];
  const place = [presskit.city, presskit.state].filter(Boolean).join(" - ");
  const actions = <HeaderActions presskit={presskit} />;

  switch (variant) {
    case "stage": {
      const cover = presskit.themeBackgroundImageUrl ?? presskit.galleryPhotos[0]?.url ?? null;
      const heroStyle: CSSProperties = cover
        ? {
            backgroundImage: `linear-gradient(to bottom, color-mix(in srgb, var(--presskit-bg) 25%, transparent) 0%, color-mix(in srgb, var(--presskit-bg) 45%, transparent) 50%, var(--presskit-bg) 100%), ${cssUrl(cover)}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : { backgroundColor: "color-mix(in srgb, var(--presskit-accent) 22%, var(--presskit-bg))" };
      return (
        <header style={heroStyle} className="flex min-h-[26rem] items-end @3xl:min-h-[35rem]">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-10 @3xl:gap-4 @3xl:px-8 @3xl:py-12">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--presskit-accent)] @3xl:text-sm">
              {[category, place].filter(Boolean).join(" · ")}
            </p>
            <h1
              style={{ ...headingFontStyle, fontSize: "clamp(3.25rem, 17cqw, 8.75rem)" }}
              className="break-words font-bold uppercase leading-[0.85]"
            >
              {presskit.artistName}
            </h1>
            {actions}
          </div>
        </header>
      );
    }
    case "minimal":
      return (
        <header className="flex flex-col gap-2">
          <h1 style={headingFontStyle} className="text-2xl font-medium tracking-tight">
            {presskit.artistName}
          </h1>
          <p className="text-sm text-[var(--presskit-muted)]">{[category, place].filter(Boolean).join(" · ")}</p>
          {actions}
        </header>
      );
    case "editorial":
      return (
        <header className="flex flex-col items-center gap-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--presskit-accent)]">{category}</p>
          <span aria-hidden className="h-px w-16 bg-[var(--presskit-border-strong)]" />
          <h1
            style={{ ...headingFontStyle, fontSize: "clamp(2.75rem, 12cqw, 4.5rem)" }}
            className="break-words font-normal leading-[1.02]"
          >
            {presskit.artistName}
          </h1>
          {place && <p className="text-sm italic text-[var(--presskit-muted)]">{place}</p>}
          <div className="flex justify-center">{actions}</div>
        </header>
      );
    default:
      return (
        <header className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-[var(--presskit-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--presskit-accent)]">
            {category}
          </span>
          <h1 style={headingFontStyle} className="text-3xl font-semibold tracking-tight">
            {presskit.artistName}
          </h1>
          {place && <p className="text-sm text-[var(--presskit-muted)]">{place}</p>}
          {actions}
        </header>
      );
  }
}

/**
 * Renders a presskit with its template, colors, fonts and button style.
 *
 * Fonts: the renderer only sets `font-family` values — loading them is the
 * host's job. The dashboard loads all options with a Google Fonts <link>
 * and uses the default FONT_FAMILY_CSS names; ladingpage self-hosts them
 * with next/font and passes its generated family names via `fontFamilies`.
 */
export function PresskitRenderer({
  presskit,
  fontFamilies = FONT_FAMILY_CSS,
}: {
  presskit: PublicPresskit;
  fontFamilies?: PresskitFontFamilies;
}) {
  const templateKey = resolveTemplateKey(presskit.templateKey);
  const template = TEMPLATE_STYLES[templateKey];
  const fullBleedHeader = template.header === "stage";
  const visibleSections = [...presskit.sections]
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

  const header = <Header variant={template.header} presskit={presskit} />;

  return (
    <div
      data-presskit-template={templateKey}
      style={themeStyle(presskit, fontFamilies, !fullBleedHeader)}
      className="@container min-h-screen"
    >
      {fullBleedHeader && header}
      <div className={template.container}>
        {!fullBleedHeader && header}
        {visibleSections.map((section) => (
          <div key={section.id} className={template.section || undefined}>
            {renderSection(section, presskit)}
          </div>
        ))}
      </div>
    </div>
  );
}
