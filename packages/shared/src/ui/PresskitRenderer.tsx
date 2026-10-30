import type { CSSProperties } from "react";
import type { PublicPresskit, PublicSection } from "../types/publicPresskit";
import type {
  BioSectionData,
  ContactSectionData,
  CustomSectionData,
  DownloadsSectionData,
  FaqSectionData,
  PressSectionData,
  SectionStyle,
  StatsSectionData,
  TechRiderSectionData,
  TestimonialsSectionData,
} from "../schemas/section";
import type { QuickLink } from "../schemas/presskit";
import { ARTIST_CATEGORY_LABELS, SECTION_ANCHORS, SECTION_DEFAULT_TITLES } from "../constants/category";
import {
  BACKGROUND_BLUR_MAX,
  BACKGROUND_OVERLAY_MAX,
  BUTTON_STYLE_RADIUS,
  DEFAULT_BUTTON_STYLE,
  FONT_FAMILY_CSS,
  resolveBackgroundPreset,
  resolveSectionLayout,
  resolveTemplateKey,
  SECTION_PADDING_CLASS,
  SECTION_WIDTH_CLASS,
  type FontKey,
  type SectionPadding,
  type SectionWidth,
} from "../constants/theme";
import {
  ARTIST_CATEGORY_LABELS_EN,
  PUBLIC_STRINGS,
  SECTION_DEFAULT_TITLES_EN,
  type PresskitLanguage,
} from "../constants/i18n";
import { whatsappUrl } from "../constants/quickLinks";
import { upcomingTourDates, type PresskitPage } from "../constants/pages";
import { heroVideoEmbedSrc } from "../media/parseMediaUrl";
import { presskitButtonClass, TEMPLATE_STYLES, type HeaderVariant, type TemplateStyle } from "./templates";
import { RosterBlock } from "./RosterBlock";
import { BioBlock } from "./BioBlock";
import { ContactBlock } from "./ContactBlock";
import { AUDIO_PROVIDERS, MediaEmbedBlock, VIDEO_PROVIDERS } from "./MediaEmbedBlock";
import { GalleryBlock } from "./GalleryBlock";
import { TourDatesBlock } from "./TourDatesBlock";
import { PressBlock } from "./PressBlock";
import { TechRiderBlock } from "./TechRiderBlock";
import { CustomBlock } from "./CustomBlock";
import { StatsBlock } from "./StatsBlock";
import { TestimonialsBlock } from "./TestimonialsBlock";
import { FaqBlock } from "./FaqBlock";
import { DownloadsBlock } from "./DownloadsBlock";
import { BrandIcon, QuickLinksBar } from "./QuickLinksBar";

// ---------------------------------------------------------------------------
// Language: English values override Portuguese ones field by field, so a
// half-translated section still renders fully.
// ---------------------------------------------------------------------------

type LocalizedSection = { title: string; data: unknown };

function localizeSection(section: PublicSection, lang: PresskitLanguage): LocalizedSection {
  const base = (section.data ?? {}) as Record<string, unknown>;
  if (lang !== "en") {
    return { title: section.title?.trim() || SECTION_DEFAULT_TITLES[section.type], data: base };
  }
  const en = (section.dataEn ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(en)) {
    if (typeof value === "string" ? value.trim() !== "" : value !== undefined && value !== null) merged[key] = value;
  }
  const title = section.titleEn?.trim() || section.title?.trim() || SECTION_DEFAULT_TITLES_EN[section.type];
  return { title, data: merged };
}

function renderSection(
  section: PublicSection,
  presskit: PublicPresskit,
  lang: PresskitLanguage,
  siteBaseUrl: string | undefined,
  /** Palco: bigger, poster-like versions of bio, dates and contact. */
  stage: boolean,
) {
  const { title, data } = localizeSection(section, lang);
  const t = PUBLIC_STRINGS[lang]!;
  const layout = resolveSectionLayout(section.type, section.layout);

  switch (section.type) {
    case "BIO":
      return (
        <BioBlock
          title={title}
          data={data as BioSectionData}
          layout={layout}
          imageUrl={presskit.avatarImageUrl ?? presskit.coverImageUrl ?? presskit.galleryPhotos[0]?.url ?? null}
          stage={stage}
        />
      );
    case "CONTACT":
      return (
        <ContactBlock
          title={title}
          data={data as ContactSectionData}
          stageHeadline={stage ? t.contactHeadline?.replace("{name}", presskit.artistName) : undefined}
        />
      );
    case "MUSIC":
      return (
        <MediaEmbedBlock
          title={title}
          layout={layout}
          embeds={presskit.mediaEmbeds.filter((e) => AUDIO_PROVIDERS.includes(e.provider))}
        />
      );
    case "VIDEO":
      return (
        <MediaEmbedBlock
          title={title}
          layout={layout}
          embeds={presskit.mediaEmbeds.filter((e) => VIDEO_PROVIDERS.includes(e.provider))}
        />
      );
    case "GALLERY":
      return <GalleryBlock title={title} photos={presskit.galleryPhotos} layout={layout} />;
    case "TOUR_DATES":
      return (
        <TourDatesBlock
          title={title}
          dates={presskit.tourDates}
          ticketsLabel={t.tickets}
          ticketsSoonLabel={t.ticketsSoon}
          layout={layout}
          stage={stage}
        />
      );
    case "PRESS":
      return <PressBlock title={title} data={data as PressSectionData} mentions={presskit.pressMentions} />;
    case "TECH_RIDER":
      return <TechRiderBlock title={title} data={data as TechRiderSectionData} />;
    case "CUSTOM":
      return <CustomBlock title={title} data={data as CustomSectionData} />;
    case "STATS":
      return <StatsBlock title={title} data={data as StatsSectionData} layout={layout} />;
    case "TESTIMONIALS":
      return <TestimonialsBlock title={title} data={data as TestimonialsSectionData} layout={layout} />;
    case "FAQ":
      return <FaqBlock title={title} data={data as FaqSectionData} />;
    case "ROSTER":
      return (
        <RosterBlock
          title={title}
          artists={presskit.roster ?? []}
          layout={layout}
          lang={lang}
          baseUrl={siteBaseUrl}
          seeLabel={t.seeArtist ?? "Ver página"}
        />
      );
    case "DOWNLOADS":
      return (
        <DownloadsBlock title={title} data={data as DownloadsSectionData} layout={layout} downloadLabel={t.download ?? "Baixar"} />
      );
    default:
      return null;
  }
}

/** Sections with nothing to show are skipped entirely — otherwise an empty
 * section would still leave a nav tab and a blank band on the page. */
function sectionHasContent(section: PublicSection, presskit: PublicPresskit): boolean {
  const data = (section.data ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items : [];
  switch (section.type) {
    case "BIO":
      return Boolean((data.shortBio as string)?.trim() || (data.longBio as string)?.trim());
    case "CONTACT":
      return Boolean(data.email || data.phone || (Array.isArray(data.socialLinks) && data.socialLinks.length > 0));
    case "MUSIC":
      return presskit.mediaEmbeds.some((e) => AUDIO_PROVIDERS.includes(e.provider));
    case "VIDEO":
      return presskit.mediaEmbeds.some((e) => VIDEO_PROVIDERS.includes(e.provider));
    case "GALLERY":
      return presskit.galleryPhotos.length > 0;
    case "TOUR_DATES":
      return presskit.tourDates.length > 0;
    case "PRESS":
      return Boolean(data.highlightStats) || presskit.pressMentions.length > 0;
    case "TECH_RIDER":
      return Boolean(data.text || data.pdfUrl);
    case "CUSTOM":
      return Boolean((data.body as string)?.trim());
    case "STATS":
    case "TESTIMONIALS":
    case "FAQ":
    case "DOWNLOADS":
      return items.length > 0;
    case "ROSTER":
      return (presskit.roster?.length ?? 0) > 0;
    default:
      return false;
  }
}

/** CSS url() with a quoted string — JSON.stringify escapes `"` and `\`,
 * which is exactly the set CSS string literals need escaped, so a URL
 * containing `)` or quotes can't close the url() early and inject
 * declarations. The URL itself is server-built (API base + key), this is
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

function clamp(value: number | null | undefined, fallback: number, max: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(max, value));
}

/** The derived tones every block uses, computed from a text color. */
function derivedTones(textColor: string): Record<string, string> {
  return {
    "--presskit-muted": `color-mix(in srgb, ${textColor} 65%, transparent)`,
    "--presskit-border": `color-mix(in srgb, ${textColor} 15%, transparent)`,
    "--presskit-border-strong": `color-mix(in srgb, ${textColor} 30%, transparent)`,
    "--presskit-hover": `color-mix(in srgb, ${textColor} 8%, transparent)`,
  };
}

export type PresskitFontFamilies = Record<FontKey, string>;

function themeStyle(presskit: PublicPresskit, fonts: PresskitFontFamilies): CSSProperties {
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
    ...(derivedTones(presskit.themeTextColor) as CSSProperties),
    ["--presskit-font-body" as string]: bodyFont,
    ["--presskit-font-heading" as string]: headingFont,
    ["--pk-btn-radius" as string]: buttonRadius,
    fontFamily: "var(--presskit-font-body)",
    // Fonts like Bebas Neue / DM Serif ship a single weight — never let the
    // browser fake a bold version of them.
    fontSynthesisWeight: "none",
    backgroundColor: "var(--presskit-bg)",
    color: "var(--presskit-text)",
  };
}

// ---------------------------------------------------------------------------
// Background: image (with focus, blur, tiling) + preset (gradient/texture)
// + darkening overlay, stacked behind the content. "Fixed" is done with a
// sticky zero-height layer rather than background-attachment: fixed, which
// iOS ignores and which breaks inside the dashboard's scaled preview.
// ---------------------------------------------------------------------------

function BackgroundLayers({ presskit, skipImage }: { presskit: PublicPresskit; skipImage: boolean }) {
  const preset = resolveBackgroundPreset(presskit.themeBackgroundPreset);
  const image = skipImage ? null : presskit.themeBackgroundImageUrl;
  if (!image && !preset.css) return null;

  const overlay = clamp(presskit.themeBackgroundOverlay, 55, BACKGROUND_OVERLAY_MAX);
  const blur = clamp(presskit.themeBackgroundBlur, 0, BACKGROUND_BLUR_MAX);
  const position = presskit.themeBackgroundPosition ?? "center";
  const fixed = (presskit.themeBackgroundAttachment ?? "FIXED") === "FIXED";
  const repeat = Boolean(presskit.themeBackgroundRepeat);

  const layers = (
    <>
      {image && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: cssUrl(image),
            backgroundSize: repeat ? "auto" : "cover",
            backgroundRepeat: repeat ? "repeat" : "no-repeat",
            backgroundPosition: position,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            // Blur bleeds transparent edges in; a slight zoom hides them.
            transform: blur > 0 ? "scale(1.06)" : undefined,
          }}
        />
      )}
      {image && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, var(--presskit-bg) ${overlay}%, transparent) 0%, color-mix(in srgb, var(--presskit-bg) ${Math.min(100, overlay + 30)}%, transparent) 100%)`,
          }}
        />
      )}
      {preset.css && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: preset.css,
            backgroundSize: preset.size ?? "cover",
            backgroundRepeat: preset.size ? "repeat" : "no-repeat",
          }}
        />
      )}
    </>
  );

  if (fixed) {
    return (
      <div aria-hidden className="pointer-events-none sticky top-0 z-0 h-0 w-full">
        <div className="relative h-screen w-full overflow-hidden">{layers}</div>
      </div>
    );
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {layers}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header pieces
// ---------------------------------------------------------------------------

const headingFontStyle: CSSProperties = { fontFamily: "var(--presskit-font-heading)" };

function HeroVideo({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      title="Vídeo de fundo"
      aria-hidden
      tabIndex={-1}
      allow="autoplay; encrypted-media"
      className="pointer-events-none absolute left-1/2 top-1/2 aspect-video h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
    />
  );
}

function Avatar({ presskit, size, className = "" }: { presskit: PublicPresskit; size: "md" | "lg"; className?: string }) {
  if (!presskit.avatarImageUrl) return null;
  const dimension = size === "lg" ? "h-28 w-28 @3xl:h-36 @3xl:w-36" : "h-20 w-20";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={presskit.avatarImageUrl}
      alt=""
      className={`${dimension} ${className} shrink-0 rounded-full border-2 border-[var(--presskit-border-strong)] object-cover shadow-lg`}
    />
  );
}

/** The artist's name — as their logo when one was uploaded (the text stays
 * for screen readers and search engines), as styled text otherwise. */
function ArtistName({ presskit, className, style }: { presskit: PublicPresskit; className: string; style?: CSSProperties }) {
  if (presskit.logoImageUrl) {
    return (
      <h1 className="flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={presskit.logoImageUrl} alt={presskit.artistName} className="max-h-24 w-auto max-w-full object-contain @3xl:max-h-32" />
        <span className="sr-only">{presskit.artistName}</span>
      </h1>
    );
  }
  return (
    <h1 style={{ ...headingFontStyle, ...style }} className={className}>
      {presskit.artistName}
    </h1>
  );
}

function Tagline({ presskit, className }: { presskit: PublicPresskit; className?: string }) {
  if (!presskit.tagline?.trim()) return null;
  return <p className={className ?? "text-base text-[var(--presskit-muted)] @3xl:text-lg"}>{presskit.tagline}</p>;
}

/** On a roster page: "Artista de <agência>", linking to the agency page. */
function AgencyLine({ presskit, lang, siteBaseUrl = "" }: { presskit: PublicPresskit; lang: PresskitLanguage; siteBaseUrl?: string }) {
  if (!presskit.agency) return null;
  const t = PUBLIC_STRINGS[lang]!;
  return (
    <p className="text-sm text-[var(--presskit-muted)]">
      {t.agencyOf}{" "}
      <a
        href={`${siteBaseUrl.replace(/\/+$/, "")}/${presskit.agency.slug}`}
        data-track="agency"
        className="font-semibold text-[var(--presskit-text)] underline decoration-[var(--presskit-accent)] underline-offset-4"
      >
        {presskit.agency.name}
      </a>
    </p>
  );
}

function HeaderActions({
  presskit,
  lang,
  showRider = true,
}: {
  presskit: PublicPresskit;
  lang: PresskitLanguage;
  /** Palco keeps its hero to the booking buttons only. */
  showRider?: boolean;
}) {
  const t = PUBLIC_STRINGS[lang]!;
  const visible = (type: PublicSection["type"]) => presskit.sections.find((s) => s.type === type && s.visible);
  const contact = visible("CONTACT")?.data as ContactSectionData | undefined;
  const rider = showRider ? (visible("TECH_RIDER")?.data as TechRiderSectionData | undefined) : undefined;
  const hasContact = Boolean(contact?.email || contact?.phone);
  const whatsapp = presskit.whatsappNumber ? whatsappUrl(presskit.whatsappNumber, presskit.whatsappMessage) : null;
  if (!hasContact && !rider?.pdfUrl && !whatsapp) return null;

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {whatsapp ? (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" data-track="whatsapp" className={presskitButtonClass("solid")}>
          <BrandIcon platform="WHATSAPP" size={16} />
          {t.whatsapp}
        </a>
      ) : (
        hasContact && (
          <a href="#contato" data-track="contact" className={presskitButtonClass("solid")}>
            {t.bookCta}
          </a>
        )
      )}
      {whatsapp && hasContact && (
        <a href="#contato" data-track="contact" className={presskitButtonClass("outline")}>
          {t.bookCta}
        </a>
      )}
      {rider?.pdfUrl && (
        <a href={rider.pdfUrl} target="_blank" rel="noopener noreferrer" data-track="rider" className={presskitButtonClass("outline")}>
          {t.riderCta}
        </a>
      )}
    </div>
  );
}

function LanguageSwitch({
  presskit,
  lang,
  languageHref,
}: {
  presskit: PublicPresskit;
  lang: PresskitLanguage;
  languageHref?: (lang: PresskitLanguage) => string;
}) {
  if (!presskit.languages?.includes("en") || !languageHref) return null;
  const other: PresskitLanguage = lang === "en" ? "pt" : "en";
  return (
    <a
      href={languageHref(other)}
      hrefLang={other}
      className="absolute right-4 top-4 z-20 rounded-full border border-[var(--presskit-border-strong)] bg-[color-mix(in_srgb,var(--presskit-bg)_70%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--presskit-text)] backdrop-blur hover:bg-[var(--presskit-hover)]"
    >
      {PUBLIC_STRINGS[lang]!.switchLanguage}
    </a>
  );
}

function Header({
  variant,
  presskit,
  lang,
  siteBaseUrl,
}: {
  variant: HeaderVariant;
  presskit: PublicPresskit;
  lang: PresskitLanguage;
  siteBaseUrl?: string;
}) {
  const agencyLine = <AgencyLine presskit={presskit} lang={lang} siteBaseUrl={siteBaseUrl} />;
  const category = (lang === "en" ? ARTIST_CATEGORY_LABELS_EN : ARTIST_CATEGORY_LABELS)[presskit.category];
  const place = [presskit.city, presskit.state].filter(Boolean).join(" - ");
  const actions = <HeaderActions presskit={presskit} lang={lang} showRider={variant !== "stage"} />;
  const quickLinks = (presskit.quickLinks ?? []) as QuickLink[];
  const videoSrc = heroVideoEmbedSrc(presskit.heroVideoUrl);
  const cover = presskit.coverImageUrl ?? null;

  switch (variant) {
    case "stage": {
      // Big photo + giant name, like a show poster: the photo sits on top on
      // a phone and fills the right half on desktop, fading into the page.
      const image =
        cover ?? presskit.themeBackgroundImageUrl ?? presskit.avatarImageUrl ?? presskit.galleryPhotos[0]?.url ?? null;
      const hasVisual = Boolean(videoSrc || image);
      const overline = [category, place].filter(Boolean).join(" · ");
      return (
        <header className="relative @4xl:grid @4xl:min-h-[44rem] @4xl:grid-cols-2">
          {presskit.logoImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={presskit.logoImageUrl}
              alt=""
              className="absolute left-5 top-4 z-20 h-8 w-auto max-w-[45%] object-contain @4xl:left-12 @4xl:top-7 @4xl:h-11 @7xl:left-[max(3rem,calc((100cqw-72rem)/2+2rem))]"
            />
          )}
          {hasVisual ? (
            <div className="relative aspect-[4/5] max-h-[34rem] w-full overflow-hidden @4xl:order-2 @4xl:aspect-auto @4xl:h-full @4xl:max-h-none">
              {videoSrc ? (
                <HeroVideo src={videoSrc} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image!} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
              )}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2 @4xl:hidden"
                style={{ background: "linear-gradient(to top, var(--presskit-bg), transparent)" }}
              />
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 hidden w-2/5 @4xl:block"
                style={{ background: "linear-gradient(to right, var(--presskit-bg), transparent)" }}
              />
            </div>
          ) : (
            <div aria-hidden className="h-20 @4xl:hidden" />
          )}
          <div
            className={`relative z-10 flex min-w-0 flex-col gap-4 px-5 pb-10 @4xl:order-1 @4xl:justify-end @4xl:gap-6 @4xl:pb-20 @4xl:pl-12 @4xl:pr-8 @4xl:pt-28 @7xl:pl-[max(3rem,calc((100cqw-72rem)/2+2rem))] ${hasVisual ? "-mt-24 @4xl:mt-0" : ""}`}
          >
            {overline && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--presskit-accent)] @4xl:text-sm">{overline}</p>
            )}
            <h1
              style={headingFontStyle}
              className="break-words text-[clamp(3.5rem,26cqw,6.75rem)] font-bold uppercase leading-[0.86] @4xl:text-[clamp(5rem,10cqw,11rem)]"
            >
              {presskit.artistName}
            </h1>
            <Tagline presskit={presskit} className="max-w-xl text-base text-[var(--presskit-muted)] @4xl:text-xl" />
            {agencyLine}
            {actions}
            <QuickLinksBar links={quickLinks} />
          </div>
        </header>
      );
    }
    case "minimal":
      return (
        <header className="flex flex-col gap-3">
          <HeroBanner cover={cover} videoSrc={videoSrc} />
          <div className="flex items-center gap-4">
            <Avatar presskit={presskit} size="md" />
            <div className="flex min-w-0 flex-col gap-1">
              <ArtistName presskit={presskit} className="text-2xl font-medium tracking-tight @4xl:text-4xl" />
              <p className="text-sm text-[var(--presskit-muted)]">{[category, place].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <Tagline presskit={presskit} />
            {agencyLine}
          <QuickLinksBar links={quickLinks} />
          {actions}
        </header>
      );
    case "editorial":
      return (
        <header className="flex flex-col items-center gap-4 text-center">
          <HeroBanner cover={cover} videoSrc={videoSrc} />
          <Avatar presskit={presskit} size="md" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--presskit-accent)]">{category}</p>
          <span aria-hidden className="h-px w-16 bg-[var(--presskit-border-strong)]" />
          <ArtistName
            presskit={presskit}
            style={{ fontSize: "clamp(2.75rem, 12cqw, 4.5rem)" }}
            className="break-words font-normal leading-[1.02]"
          />
          <Tagline presskit={presskit} className="max-w-xl italic text-[var(--presskit-muted)]" />
            {agencyLine}
          {place && <p className="text-sm italic text-[var(--presskit-muted)]">{place}</p>}
          <QuickLinksBar links={quickLinks} align="center" />
          <div className="flex justify-center">{actions}</div>
        </header>
      );
    default: {
      // Desktop: the cover sits beside the name instead of above it, so the
      // header uses the width and a portrait photo isn't cropped to a strip.
      const split = Boolean(cover || videoSrc);
      return (
        <header
          className={`flex flex-col gap-3 ${split ? "@4xl:grid @4xl:grid-cols-2 @4xl:items-center @4xl:gap-12" : ""}`}
        >
          <HeroBanner cover={cover} videoSrc={videoSrc} desktopAspect={videoSrc ? "@4xl:aspect-video" : "@4xl:aspect-[4/5]"} />
          <div className="flex min-w-0 flex-col gap-3 @4xl:gap-4">
            <div className="flex items-center gap-4">
              {/* Beside the cover photo the avatar would just repeat it. */}
              <Avatar presskit={presskit} size="md" className={split ? "@4xl:hidden" : ""} />
              <div className="flex min-w-0 flex-col gap-2">
                <span className="w-fit rounded-full border border-[var(--presskit-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--presskit-accent)]">
                  {category}
                </span>
                <ArtistName presskit={presskit} className="text-3xl font-semibold tracking-tight @4xl:text-5xl" />
                {place && <p className="text-sm text-[var(--presskit-muted)]">{place}</p>}
              </div>
            </div>
            <Tagline presskit={presskit} />
            {agencyLine}
            <QuickLinksBar links={quickLinks} />
            {actions}
          </div>
        </header>
      );
    }
  }
}

/** Cover photo or hero video as a banner above the header in the
 * non-full-bleed templates (Palco uses them as the full header instead). */
function HeroBanner({
  cover,
  videoSrc,
  desktopAspect = "",
}: {
  cover: string | null;
  videoSrc: string | null;
  /** Aspect override once the page is desktop-wide (an `@4xl:` class). */
  desktopAspect?: string;
}) {
  if (!cover && !videoSrc) return null;
  return (
    <div
      className={`relative aspect-[21/9] w-full overflow-hidden rounded-[var(--pk-card-radius)] bg-[var(--presskit-hover)] ${desktopAspect}`}
    >
      {videoSrc ? (
        <HeroVideo src={videoSrc} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover!} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}

/** Where a "book this artist" button goes: WhatsApp when set up, else the
 * contact section. Null when the page offers neither. */
function bookingHref(
  presskit: PublicPresskit,
  /** Where the contact section lives: "" on the page itself, the home URL
   * on Palco's other pages. */
  contactPage = "",
): { href: string; track: string; external: boolean } | null {
  if (presskit.whatsappNumber) {
    return { href: whatsappUrl(presskit.whatsappNumber, presskit.whatsappMessage), track: "whatsapp", external: true };
  }
  const contact = presskit.sections.find((s) => s.type === "CONTACT" && s.visible)?.data as ContactSectionData | undefined;
  if (contact?.email || contact?.phone) return { href: `${contactPage}#contato`, track: "contact", external: false };
  return null;
}

function BookingLink({
  presskit,
  lang,
  className,
  contactPage,
}: {
  presskit: PublicPresskit;
  lang: PresskitLanguage;
  className: string;
  contactPage?: string;
}) {
  const target = bookingHref(presskit, contactPage);
  if (!target) return null;
  return (
    <a
      href={target.href}
      data-track={target.track}
      {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={className}
    >
      {target.track === "whatsapp" && <BrandIcon platform="WHATSAPP" size={16} />}
      {PUBLIC_STRINGS[lang]!.bookShort}
    </a>
  );
}

/** Palco on a phone: a booking bar that stays at the bottom of the screen. */
function StageBookingBar({
  presskit,
  lang,
  contactPage,
}: {
  presskit: PublicPresskit;
  lang: PresskitLanguage;
  contactPage?: string;
}) {
  if (!bookingHref(presskit)) return null;
  return (
    <div className="pointer-events-none sticky bottom-3 z-20 px-3 @4xl:hidden">
      <div className="pointer-events-auto flex rounded-[calc(var(--pk-btn-radius)+0.5rem)] border border-[var(--presskit-border)] bg-[color-mix(in_srgb,var(--presskit-bg)_88%,transparent)] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur">
        <BookingLink
          presskit={presskit}
          lang={lang}
          contactPage={contactPage}
          className={`flex-1 ${presskitButtonClass("solid")}`}
        />
      </div>
    </div>
  );
}

function WhatsAppFloating({ presskit, lang }: { presskit: PublicPresskit; lang: PresskitLanguage }) {
  if (!presskit.whatsappNumber) return null;
  return (
    <div className="pointer-events-none sticky bottom-5 z-20 flex justify-end px-5">
      <a
        href={whatsappUrl(presskit.whatsappNumber, presskit.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        data-track="whatsapp"
        aria-label={PUBLIC_STRINGS[lang]!.whatsapp}
        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:scale-105"
      >
        <BrandIcon platform="WHATSAPP" size={28} />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Site structure: nav bar + one shell per section carrying its own look
// ---------------------------------------------------------------------------

/** A nav link: a section anchor on single-page sites, a page URL (`href`)
 * on Palco's multi-page site. */
type NavEntry = { anchor: string; label: string; href?: string; current?: boolean };

function SiteNav({
  entries,
  tabs,
  width,
  cta,
  strong = false,
}: {
  entries: NavEntry[];
  tabs: boolean;
  width: string;
  /** Shown at the end of the bar (Palco puts the booking button there). */
  cta?: React.ReactNode;
  /** Palco: an opaque bar with full-color, larger links. */
  strong?: boolean;
}) {
  if (entries.length < 2) return null;
  return (
    <nav
      aria-label="Seções"
      className={`pk-nav sticky top-0 z-30 border-b border-[var(--presskit-border)] backdrop-blur ${strong ? "bg-[color-mix(in_srgb,var(--presskit-bg)_96%,transparent)] shadow-[0_6px_24px_rgba(0,0,0,0.25)]" : "bg-[color-mix(in_srgb,var(--presskit-bg)_82%,transparent)]"}`}
    >
      <div
        className={`mx-auto flex w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${strong ? "py-2.5 @4xl:py-3" : "py-2"} ${width}`}
      >
        {entries.map((entry) => (
          <a
            key={entry.anchor}
            href={entry.href ?? `#${entry.anchor}`}
            {...(entry.current ? { "aria-current": "page" as const } : {})}
            className={`pk-nav-link shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold transition ${
              entry.current
                ? "bg-[var(--presskit-hover)] text-[var(--presskit-text)] underline decoration-[var(--presskit-accent)] decoration-2 underline-offset-[6px]"
                : ""
            } ${strong ? "text-[15px] text-[var(--presskit-text)] hover:bg-[var(--presskit-hover)] @4xl:px-4 @4xl:text-base" : "text-sm text-[var(--presskit-muted)] hover:text-[var(--presskit-text)]"}`}
            {...(tabs ? { role: "tab" } : {})}
          >
            {entry.label}
          </a>
        ))}
        {cta}
      </div>
    </nav>
  );
}

/** CSS for tab mode: only the :target section is shown (the first one when
 * nothing is targeted), and the matching nav link gets the accent. Pure
 * CSS so the public page ships no JS and the dashboard preview works too. */
function tabsCss(anchors: string[]): string {
  const active = "background:var(--presskit-accent);color:var(--presskit-on-accent)";
  const rules = [
    ".pk-tabs>.pk-tab{display:none}",
    ".pk-tabs>.pk-tab:target{display:block}",
    ".pk-tabs:not(:has(>.pk-tab:target))>.pk-tab:first-of-type{display:block}",
    `.pk-site:not(:has(.pk-tab:target)) .pk-nav-link:first-of-type{${active}}`,
    ...anchors.map((anchor) => `.pk-site:has(#${anchor}:target) .pk-nav-link[href="#${anchor}"]{${active}}`),
  ];
  return rules.join("\n");
}

function sectionOverrides(style: SectionStyle, align: "left" | "center"): CSSProperties {
  const vars: Record<string, string> = {};
  if (style.backgroundColor) vars["--presskit-bg"] = style.backgroundColor;
  if (style.textColor) {
    vars["--presskit-text"] = style.textColor;
    Object.assign(vars, derivedTones(style.textColor));
  }
  if (style.accentColor) {
    vars["--presskit-accent"] = style.accentColor;
    vars["--presskit-on-accent"] = readableOn(style.accentColor);
  }
  if (align === "center") vars["--pk-h2-align"] = "center";
  return vars as CSSProperties;
}

function SectionShell({
  section,
  template,
  tabs,
  children,
}: {
  section: PublicSection;
  template: TemplateStyle;
  tabs: boolean;
  children: React.ReactNode;
}) {
  const style = (section.style ?? {}) as SectionStyle;
  const anchor = SECTION_ANCHORS[section.type];
  const width = SECTION_WIDTH_CLASS[(style.width as SectionWidth) ?? template.sectionWidth];
  const padding = SECTION_PADDING_CLASS[(style.padding as SectionPadding) ?? template.sectionPadding];
  const align = style.align === "center" ? "center" : "left";
  const preset = resolveBackgroundPreset(style.backgroundPreset);
  const image = style.backgroundImageUrl ?? null;
  const paintsOwnBackground = Boolean(style.backgroundColor || image || preset.css);
  const overlay = clamp(style.backgroundOverlay, 55, BACKGROUND_OVERLAY_MAX);

  return (
    <section
      id={anchor}
      data-section={section.type}
      style={{
        ...sectionOverrides(style, align),
        backgroundColor: paintsOwnBackground ? "var(--presskit-bg)" : undefined,
        color: style.textColor ? "var(--presskit-text)" : undefined,
        scrollMarginTop: "3.5rem",
      }}
      className={
        `pk-section relative ${tabs ? "pk-tab" : ""} ` +
        (style.divider ? "border-t border-[var(--presskit-border)] " : "") +
        (template.section ? `${template.section} ` : "")
      }
    >
      {(image || preset.css) && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {image && (
            <div className="absolute inset-0" style={{ backgroundImage: cssUrl(image), backgroundSize: "cover", backgroundPosition: "center" }} />
          )}
          {image && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `color-mix(in srgb, var(--presskit-bg) ${overlay}%, transparent)` }}
            />
          )}
          {preset.css && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: preset.css,
                backgroundSize: preset.size ?? "cover",
                backgroundRepeat: preset.size ? "repeat" : "no-repeat",
              }}
            />
          )}
        </div>
      )}
      <div
        className={`relative mx-auto flex w-full flex-col ${width} ${template.sectionInner} ${padding} ${align === "center" ? "items-center text-center" : ""}`}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Renders a presskit as the artist's site: template, colors, fonts,
 * background layers, identity images, a section nav (anchors or CSS tabs)
 * and one shell per section carrying that section's own look.
 *
 * Fonts: the renderer only sets `font-family` values — loading them is the
 * host's job. The dashboard loads all options with a Google Fonts <link>
 * and uses the default FONT_FAMILY_CSS names; ladingpage self-hosts them
 * with next/font and passes its generated family names via `fontFamilies`.
 *
 * `lang` picks the English variants (when the artist offers them);
 * `languageHref` makes the switch link appear — omit it in previews.
 */
function MoreLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className={`self-start ${presskitButtonClass("outline")}`}>
      {label}
      <span aria-hidden>→</span>
    </a>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-lg text-[var(--presskit-muted)]">{children}</p>;
}

/** Title block of Palco's inner pages: the artist's name (back to home)
 * over the page name in poster letters. */
function StagePageHeader({ presskit, title, homeHref }: { presskit: PublicPresskit; title: string; homeHref: string }) {
  return (
    <header className={`mx-auto flex w-full flex-col gap-3 px-5 pb-6 pt-10 @3xl:px-8 @4xl:pb-10 @4xl:pt-16 ${SECTION_WIDTH_CLASS.wide}`}>
      <a href={homeHref} className="flex w-fit items-center gap-3 no-underline">
        {presskit.logoImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={presskit.logoImageUrl} alt={presskit.artistName} className="h-8 w-auto max-w-[60%] object-contain @4xl:h-10" />
        ) : (
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--presskit-accent)] @4xl:text-sm">
            {presskit.artistName}
          </span>
        )}
      </a>
      <h1
        style={headingFontStyle}
        className="break-words text-[clamp(3.5rem,20cqw,6rem)] font-bold uppercase leading-[0.86] @4xl:text-[clamp(5rem,10cqw,10rem)]"
      >
        {title}
      </h1>
    </header>
  );
}

/** Smaller section titles inside an inner page, under its poster title. */
const innerHeadingVars = { "--pk-h2-size": "clamp(2rem, 9cqw, 3.5rem)" } as CSSProperties;

export function PresskitRenderer({
  presskit,
  fontFamilies = FONT_FAMILY_CSS,
  lang = "pt",
  languageHref,
  siteBaseUrl,
  page = "home",
  pageHref,
}: {
  presskit: PublicPresskit;
  fontFamilies?: PresskitFontFamilies;
  lang?: PresskitLanguage;
  languageHref?: (lang: PresskitLanguage) => string;
  /** Origin for links to other pages of the site (roster cards, agency
   * line). Empty/omitted = relative, which is right on presskitai.com.br. */
  siteBaseUrl?: string;
  /** Which page of a multi-page (Palco) site to render. */
  page?: PresskitPage;
  /** URL of each page of the site. Given = Palco renders as a site with
   * Home, Músicas, Agenda and Mídia; omitted (dashboard preview, other
   * templates) = one scrolling page. */
  pageHref?: (page: PresskitPage) => string;
}) {
  const templateKey = resolveTemplateKey(presskit.templateKey);
  const template = TEMPLATE_STYLES[templateKey];
  const fullBleedHeader = template.header === "stage";
  const multiPage = fullBleedHeader && Boolean(pageHref);
  const t = PUBLIC_STRINGS[lang]!;
  const tabs = presskit.navMode === "TABS" && !multiPage;

  const visibleSection = (type: PublicSection["type"]) => presskit.sections.some((s) => s.type === type && s.visible);
  const audio = visibleSection("MUSIC") ? presskit.mediaEmbeds.filter((e) => AUDIO_PROVIDERS.includes(e.provider)) : [];
  const videos = visibleSection("VIDEO") ? presskit.mediaEmbeds.filter((e) => VIDEO_PROVIDERS.includes(e.provider)) : [];
  const photos = visibleSection("GALLERY") ? presskit.galleryPhotos : [];
  const upcoming = upcomingTourDates(presskit.tourDates);
  const href = (target: PresskitPage) => pageHref?.(target) ?? "";
  const homeHref = href("home");
  const contactPage = multiPage && page !== "home" ? homeHref : "";

  // Home of a multi-page site: music, dates and media show a preview with a
  // link to their own page; photos and videos share one "Mídia" preview,
  // shown where whichever of the two comes first sits.
  const firstMediaType = [...presskit.sections]
    .filter((s) => (s.type === "GALLERY" && photos.length > 0) || (s.type === "VIDEO" && videos.length > 0))
    .sort((a, b) => a.order - b.order)[0]?.type;
  const homePreview = (section: PublicSection): React.ReactNode | undefined => {
    switch (section.type) {
      case "MUSIC":
        return audio.length === 0 ? null : (
          <>
            <MediaEmbedBlock title={localizeSection(section, lang).title} embeds={audio.slice(0, 1)} />
            <MoreLink href={href("musicas")} label={t.seeAllMusic!} />
          </>
        );
      case "TOUR_DATES":
        return upcoming.length === 0 ? null : (
          <>
            <TourDatesBlock
              title={localizeSection(section, lang).title}
              dates={presskit.tourDates}
              ticketsLabel={t.tickets}
              ticketsSoonLabel={t.ticketsSoon}
              stage
              limit={3}
            />
            <MoreLink href={href("agenda")} label={t.seeFullAgenda!} />
          </>
        );
      case "GALLERY":
      case "VIDEO":
        if (section.type !== firstMediaType) return null;
        return (
          <>
            {photos.length > 0 ? (
              <GalleryBlock title={t.pageMedia!} photos={photos.slice(0, 4)} />
            ) : (
              <MediaEmbedBlock title={t.pageMedia!} embeds={videos.slice(0, 1)} />
            )}
            <MoreLink href={href("midia")} label={t.seeAllMedia!} />
          </>
        );
      default:
        return undefined;
    }
  };

  const sections = [...presskit.sections]
    .filter((section) => section.visible && sectionHasContent(section, presskit))
    // Palco keeps the page about the show: no download-cards section.
    .filter((section) => !(fullBleedHeader && section.type === "DOWNLOADS"))
    .filter((section) => !multiPage || homePreview(section) !== null)
    .sort((a, b) => a.order - b.order);

  const navEntries: NavEntry[] = multiPage
    ? (
        [
          { page: "home", label: t.pageHome!, show: true },
          { page: "musicas", label: t.pageMusic!, show: audio.length > 0 },
          { page: "agenda", label: t.pageAgenda!, show: visibleSection("TOUR_DATES") },
          { page: "midia", label: t.pageMedia!, show: photos.length > 0 || videos.length > 0 },
        ] as const
      )
        .filter((entry) => entry.show)
        .map((entry) => ({ anchor: entry.page, label: entry.label, href: href(entry.page), current: entry.page === page }))
    : sections.map((section) => ({
        anchor: SECTION_ANCHORS[section.type],
        label: localizeSection(section, lang).title,
      }));
  const showNav = (presskit.showNav ?? true) && navEntries.length >= 2;

  const header = <Header variant={template.header} presskit={presskit} lang={lang} siteBaseUrl={siteBaseUrl} />;

  return (
    <div
      data-presskit-template={templateKey}
      lang={lang === "en" ? "en" : "pt-BR"}
      style={themeStyle(presskit, fontFamilies)}
      className="pk-site @container relative isolate min-h-screen"
    >
      {tabs && <style dangerouslySetInnerHTML={{ __html: tabsCss(navEntries.map((e) => e.anchor)) }} />}
      {/* Palco's header already paints the background image as its cover —
          the page layer then only carries the preset/overlay. */}
      <BackgroundLayers presskit={presskit} skipImage={fullBleedHeader && !presskit.coverImageUrl} />
      <LanguageSwitch presskit={presskit} lang={lang} languageHref={languageHref} />
      <div className="relative z-10">
        {multiPage && page !== "home" ? null : fullBleedHeader ? header : <div className={template.container}>{header}</div>}
        {showNav && (
          <SiteNav
            entries={navEntries}
            tabs={tabs}
            width={template.nav}
            strong={fullBleedHeader}
            cta={
              fullBleedHeader ? (
                // Desktop only: phones get the bottom booking bar instead.
                <span className="ml-auto hidden shrink-0 @4xl:flex">
                  <BookingLink
                    presskit={presskit}
                    lang={lang}
                    contactPage={contactPage}
                    className={`shadow-[0_6px_20px_color-mix(in_srgb,var(--presskit-accent)_45%,transparent)] ${presskitButtonClass("solid")}`}
                  />
                </span>
              ) : undefined
            }
          />
        )}
        {multiPage && page !== "home" ? (
          <>
            <StagePageHeader
              presskit={presskit}
              homeHref={homeHref}
              title={{ musicas: t.pageMusic!, agenda: t.pageAgenda!, midia: t.pageMedia! }[page]}
            />
            <div
              style={innerHeadingVars}
              className={`mx-auto flex w-full flex-col gap-12 px-5 pb-20 @3xl:px-8 @4xl:gap-16 ${SECTION_WIDTH_CLASS.wide}`}
            >
              {page === "musicas" &&
                (audio.length > 0 ? (
                  <MediaEmbedBlock title="" embeds={audio} layout="grid" />
                ) : (
                  <EmptyNote>{t.noMusic}</EmptyNote>
                ))}
              {page === "agenda" &&
                (upcoming.length > 0 ? (
                  <TourDatesBlock
                    title=""
                    dates={presskit.tourDates}
                    ticketsLabel={t.tickets}
                    ticketsSoonLabel={t.ticketsSoon}
                    stage
                  />
                ) : (
                  <EmptyNote>{t.noEvents}</EmptyNote>
                ))}
              {page === "midia" && (
                <>
                  {photos.length > 0 && <GalleryBlock title={videos.length > 0 ? t.photos! : ""} photos={photos} layout="masonry" />}
                  {videos.length > 0 && (
                    <MediaEmbedBlock title={photos.length > 0 ? t.videos! : ""} embeds={videos} layout="grid" />
                  )}
                  {photos.length === 0 && videos.length === 0 && <EmptyNote>{t.noMedia}</EmptyNote>}
                </>
              )}
            </div>
          </>
        ) : (
          <div className={tabs ? "pk-tabs" : undefined}>
            {sections.map((section) => (
              <SectionShell key={section.id} section={section} template={template} tabs={tabs}>
                {(multiPage ? homePreview(section) : undefined) ??
                  renderSection(section, presskit, lang, siteBaseUrl, fullBleedHeader)}
              </SectionShell>
            ))}
          </div>
        )}
        {fullBleedHeader ? (
          // The sticky nav already carries the booking button on desktop.
          <StageBookingBar presskit={presskit} lang={lang} contactPage={contactPage} />
        ) : (
          <WhatsAppFloating presskit={presskit} lang={lang} />
        )}
      </div>
    </div>
  );
}
