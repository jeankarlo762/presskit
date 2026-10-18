import type { ArtistCategory, SectionType } from "./category";

export const PRESSKIT_LANGUAGES = ["pt", "en"] as const;
export type PresskitLanguage = (typeof PRESSKIT_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: PresskitLanguage = "pt";

export const LANGUAGE_LABELS: Record<PresskitLanguage, string> = { pt: "Português", en: "English" };

export function resolveLanguage(value: string | null | undefined, offered: readonly string[]): PresskitLanguage {
  const candidate = value?.toLowerCase();
  return candidate === "en" && offered.includes("en") ? "en" : "pt";
}

export const SECTION_DEFAULT_TITLES_EN: Record<SectionType, string> = {
  BIO: "About",
  MUSIC: "Music",
  VIDEO: "Videos",
  GALLERY: "Photos",
  PRESS: "Press",
  TOUR_DATES: "Dates",
  CONTACT: "Contact",
  TECH_RIDER: "Tech rider",
  CUSTOM: "",
  STATS: "Numbers",
  TESTIMONIALS: "Testimonials",
  FAQ: "FAQ",
  DOWNLOADS: "Downloads",
  ROSTER: "Artists",
};

export const ARTIST_CATEGORY_LABELS_EN: Record<ArtistCategory, string> = {
  MUSICO_BANDA: "Musician / Band",
  DJ: "DJ",
  ATOR: "Actor / Actress",
  ARTISTA_VISUAL: "Visual artist",
  PRODUTORA: "Agency / Label",
};

/** Small UI strings on the public page, by language. */
export const PUBLIC_STRINGS: Record<PresskitLanguage, Record<string, string>> = {
  pt: {
    bookCta: "Contratar para um evento",
    riderCta: "Baixar rider técnico",
    whatsapp: "Falar no WhatsApp",
    tickets: "Ingressos",
    mediaUnavailable: "Mídia indisponível",
    switchLanguage: "English",
    download: "Baixar",
    menu: "Menu",
    agencyOf: "Artista de",
    seeArtist: "Ver página",
  },
  en: {
    bookCta: "Book for an event",
    riderCta: "Download tech rider",
    whatsapp: "Chat on WhatsApp",
    tickets: "Tickets",
    mediaUnavailable: "Media unavailable",
    switchLanguage: "Português",
    download: "Download",
    menu: "Menu",
    agencyOf: "Artist of",
    seeArtist: "See page",
  },
};
