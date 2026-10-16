import type { CSSProperties } from "react";
import type { PublicPresskit, PublicSection } from "../types/publicPresskit";
import type {
  BioSectionData,
  ContactSectionData,
  CustomSectionData,
  PressSectionData,
  TechRiderSectionData,
} from "../schemas/section";
import type { QuickLink } from "../schemas/presskit";
import { ARTIST_CATEGORY_LABELS, SECTION_DEFAULT_TITLES } from "../constants/category";
import {
  BACKGROUND_BLUR_MAX,
  BACKGROUND_OVERLAY_MAX,
  BUTTON_STYLE_RADIUS,
  DEFAULT_BUTTON_STYLE,
  FONT_FAMILY_CSS,
  resolveBackgroundPreset,
  resolveTemplateKey,
  type FontKey,
} from "../constants/theme";
import {
  ARTIST_CATEGORY_LABELS_EN,
  PUBLIC_STRINGS,
  SECTION_DEFAULT_TITLES_EN,
  type PresskitLanguage,
} from "../constants/i18n";
import { whatsappUrl } from "../constants/quickLinks";
import { heroVideoEmbedSrc } from "../media/parseMediaUrl";
import { presskitButtonClass, TEMPLATE_STYLES, type HeaderVariant } from "./templates";
import { BioBlock } from "./BioBlock";
import { ContactBlock } from "./ContactBlock";
import { AUDIO_PROVIDERS, MediaEmbedBlock, VIDEO_PROVIDERS } from "./MediaEmbedBlock";
import { GalleryBlock } from "./GalleryBlock";
import { TourDatesBlock } from "./TourDatesBlock";
import { PressBlock } from "./PressBlock";
import { TechRiderBlock } from "./TechRiderBlock";
import { CustomBlock } from "./CustomBlock";
import { BrandIcon, QuickLinksBar } from "./QuickLinksBar";

// ---------------------------------------------------------------------------
// Language: English values override Portuguese ones field by field, so a
// half-translated section still renders fully.
// ---------------------------------------------------------------------------

function localizeSection(section: PublicSection, lang: PresskitLanguage): { title: string; data: unknown } {
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

function renderSection(section: PublicSection, presskit: PublicPresskit, lang: PresskitLanguage) {
  const { title, data } = localizeSection(section, lang);
  const t = PUBLIC_STRINGS[lang]!;

  switch (section.type) {
    case "BIO":
      return <BioBlock title={title} data={data as BioSectionData} />;
    case "CONTACT":
      return <ContactBlock title={title} data={data as ContactSectionData} />;
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
      return <TourDatesBlock title={title} dates={presskit.tourDates} ticketsLabel={t.tickets} />;
    case "PRESS":
      return <PressBlock title={title} data={data as PressSectionData} mentions={presskit.pressMentions} />;
    case "TECH_RIDER":
      return <TechRiderBlock title={title} data={data as TechRiderSectionData} />;
    case "CUSTOM":
      return <CustomBlock title={title} data={data as CustomSectionData} />;
    default:
      return null;
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

function clamp(value: number | undefined, fallback: number, max: number): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(max, value));
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

function Avatar({ presskit, size }: { presskit: PublicPresskit; size: "md" | "lg" }) {
  if (!presskit.avatarImageUrl) return null;
  const dimension = size === "lg" ? "h-28 w-28 @3xl:h-36 @3xl:w-36" : "h-20 w-20";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={presskit.avatarImageUrl}
      alt=""
      className={`${dimension} shrink-0 rounded-full border-2 border-[var(--presskit-border-strong)] object-cover shadow-lg`}
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

function HeaderActions({ presskit, lang }: { presskit: PublicPresskit; lang: PresskitLanguage }) {
  const t = PUBLIC_STRINGS[lang]!;
  const visible = (type: PublicSection["type"]) => presskit.sections.find((s) => s.type === type && s.visible);
  const contact = visible("CONTACT")?.data as ContactSectionData | undefined;
  const rider = visible("TECH_RIDER")?.data as TechRiderSectionData | undefined;
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

function Header({ variant, presskit, lang }: { variant: HeaderVariant; presskit: PublicPresskit; lang: PresskitLanguage }) {
  const category = (lang === "en" ? ARTIST_CATEGORY_LABELS_EN : ARTIST_CATEGORY_LABELS)[presskit.category];
  const place = [presskit.city, presskit.state].filter(Boolean).join(" - ");
  const actions = <HeaderActions presskit={presskit} lang={lang} />;
  const quickLinks = (presskit.quickLinks ?? []) as QuickLink[];
  const videoSrc = heroVideoEmbedSrc(presskit.heroVideoUrl);
  const cover = presskit.coverImageUrl ?? null;

  switch (variant) {
    case "stage": {
      const image = cover ?? presskit.themeBackgroundImageUrl ?? presskit.galleryPhotos[0]?.url ?? null;
      const heroStyle: CSSProperties =
        image && !videoSrc
          ? { backgroundImage: cssUrl(image), backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundColor: "color-mix(in srgb, var(--presskit-accent) 22%, var(--presskit-bg))" };
      return (
        <header style={heroStyle} className="relative flex min-h-[26rem] items-end overflow-hidden @3xl:min-h-[35rem]">
          {videoSrc && <HeroVideo src={videoSrc} />}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--presskit-bg) 25%, transparent) 0%, color-mix(in srgb, var(--presskit-bg) 45%, transparent) 50%, var(--presskit-bg) 100%)",
            }}
          />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-10 @3xl:gap-4 @3xl:px-8 @3xl:py-12">
            <Avatar presskit={presskit} size="lg" />
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--presskit-accent)] @3xl:text-sm">
              {[category, place].filter(Boolean).join(" · ")}
            </p>
            <ArtistName
              presskit={presskit}
              style={{ fontSize: "clamp(3.25rem, 17cqw, 8.75rem)" }}
              className="break-words font-bold uppercase leading-[0.85]"
            />
            <QuickLinksBar links={quickLinks} />
            {actions}
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
              <ArtistName presskit={presskit} className="text-2xl font-medium tracking-tight" />
              <p className="text-sm text-[var(--presskit-muted)]">{[category, place].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
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
          {place && <p className="text-sm italic text-[var(--presskit-muted)]">{place}</p>}
          <QuickLinksBar links={quickLinks} align="center" />
          <div className="flex justify-center">{actions}</div>
        </header>
      );
    default:
      return (
        <header className="flex flex-col gap-3">
          <HeroBanner cover={cover} videoSrc={videoSrc} />
          <div className="flex items-center gap-4">
            <Avatar presskit={presskit} size="md" />
            <div className="flex min-w-0 flex-col gap-2">
              <span className="w-fit rounded-full border border-[var(--presskit-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--presskit-accent)]">
                {category}
              </span>
              <ArtistName presskit={presskit} className="text-3xl font-semibold tracking-tight" />
              {place && <p className="text-sm text-[var(--presskit-muted)]">{place}</p>}
            </div>
          </div>
          <QuickLinksBar links={quickLinks} />
          {actions}
        </header>
      );
  }
}

/** Cover photo or hero video as a banner above the header in the
 * non-full-bleed templates (Palco uses them as the full header instead). */
function HeroBanner({ cover, videoSrc }: { cover: string | null; videoSrc: string | null }) {
  if (!cover && !videoSrc) return null;
  return (
    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[var(--pk-card-radius)] bg-[var(--presskit-hover)]">
      {videoSrc ? (
        <HeroVideo src={videoSrc} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover!} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
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

/**
 * Renders a presskit with its template, colors, fonts, background layers,
 * identity images and conversion elements.
 *
 * Fonts: the renderer only sets `font-family` values — loading them is the
 * host's job. The dashboard loads all options with a Google Fonts <link>
 * and uses the default FONT_FAMILY_CSS names; ladingpage self-hosts them
 * with next/font and passes its generated family names via `fontFamilies`.
 *
 * `lang` picks the English variants (when the artist offers them);
 * `languageHref` makes the switch link appear — omit it in previews.
 */
export function PresskitRenderer({
  presskit,
  fontFamilies = FONT_FAMILY_CSS,
  lang = "pt",
  languageHref,
}: {
  presskit: PublicPresskit;
  fontFamilies?: PresskitFontFamilies;
  lang?: PresskitLanguage;
  languageHref?: (lang: PresskitLanguage) => string;
}) {
  const templateKey = resolveTemplateKey(presskit.templateKey);
  const template = TEMPLATE_STYLES[templateKey];
  const fullBleedHeader = template.header === "stage";
  const visibleSections = [...presskit.sections]
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

  const header = <Header variant={template.header} presskit={presskit} lang={lang} />;

  return (
    <div
      data-presskit-template={templateKey}
      lang={lang === "en" ? "en" : "pt-BR"}
      style={themeStyle(presskit, fontFamilies)}
      className="@container relative isolate min-h-screen"
    >
      {/* Palco's header already paints the background image as its cover —
          the page layer then only carries the preset/overlay. */}
      <BackgroundLayers presskit={presskit} skipImage={fullBleedHeader && !presskit.coverImageUrl} />
      <LanguageSwitch presskit={presskit} lang={lang} languageHref={languageHref} />
      <div className="relative z-10">
        {fullBleedHeader && header}
        <div className={template.container}>
          {!fullBleedHeader && header}
          {visibleSections.map((section) => (
            <div key={section.id} className={template.section || undefined}>
              {renderSection(section, presskit, lang)}
            </div>
          ))}
        </div>
        <WhatsAppFloating presskit={presskit} lang={lang} />
      </div>
    </div>
  );
}
