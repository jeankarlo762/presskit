export const ARTIST_CATEGORIES = ["MUSICO_BANDA", "DJ", "ATOR", "ARTISTA_VISUAL"] as const;

export type ArtistCategory = (typeof ARTIST_CATEGORIES)[number];

export const ARTIST_CATEGORY_LABELS: Record<ArtistCategory, string> = {
  MUSICO_BANDA: "Músico / Banda",
  DJ: "DJ",
  ATOR: "Ator / Atriz",
  ARTISTA_VISUAL: "Artista Visual",
};

export const SECTION_TYPES = [
  "BIO",
  "MUSIC",
  "VIDEO",
  "GALLERY",
  "PRESS",
  "TOUR_DATES",
  "CONTACT",
  "TECH_RIDER",
  "CUSTOM",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/**
 * Shown in the editor and used as the public page heading whenever the
 * artist hasn't overridden a section's title — every section's title is
 * editable (Section.title in Prisma), these are just the seed/fallback text.
 */
export const SECTION_DEFAULT_TITLES: Record<SectionType, string> = {
  BIO: "Sobre",
  MUSIC: "Música",
  VIDEO: "Vídeos",
  GALLERY: "Fotos",
  PRESS: "Imprensa",
  TOUR_DATES: "Agenda",
  CONTACT: "Contato",
  TECH_RIDER: "Rider técnico",
  CUSTOM: "",
};

/**
 * Which section types appear by default (and in what order) when an artist
 * picks a category during onboarding. The artist can still show/hide/reorder
 * from the full SECTION_TYPES list afterwards — this only seeds sensible
 * defaults per category so the editor isn't a blank slate. PRESS/TECH_RIDER
 * stay valid section types but aren't seeded by default anywhere — kept
 * simple (Sobre/Música/Agenda/Fotos/Vídeos/Contato) per the artist-facing
 * product spec.
 */
export const DEFAULT_SECTIONS_BY_CATEGORY: Record<ArtistCategory, SectionType[]> = {
  MUSICO_BANDA: ["BIO", "MUSIC", "TOUR_DATES", "GALLERY", "VIDEO", "CONTACT"],
  DJ: ["BIO", "MUSIC", "TOUR_DATES", "GALLERY", "VIDEO", "CONTACT"],
  ATOR: ["BIO", "VIDEO", "GALLERY", "CONTACT"],
  ARTISTA_VISUAL: ["BIO", "GALLERY", "CONTACT"],
};

export const PLAN_KEYS = ["FREE", "PRO"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

/**
 * Numeric/boolean limits are placeholders (pricing/positioning not decided
 * yet) but the shape is final — requirePlan() reads from here so tightening
 * or loosening a limit later is a one-line change, not a schema migration.
 */
export const PLAN_LIMITS: Record<PlanKey, {
  maxGalleryPhotos: number;
  maxTrackableLinks: number;
  analyticsHistoryDays: number;
  watermark: boolean;
}> = {
  FREE: {
    maxGalleryPhotos: 6,
    maxTrackableLinks: 1,
    analyticsHistoryDays: 7,
    watermark: true,
  },
  PRO: {
    maxGalleryPhotos: 40,
    maxTrackableLinks: 20,
    analyticsHistoryDays: 365,
    watermark: false,
  },
};

/** ARTISTA_VISUAL treats the gallery as the primary portfolio, not an extra. */
export const VISUAL_ARTIST_GALLERY_BONUS = 20;

export function maxGalleryPhotosFor(plan: PlanKey, category: ArtistCategory): number {
  const base = PLAN_LIMITS[plan].maxGalleryPhotos;
  return category === "ARTISTA_VISUAL" ? base + VISUAL_ARTIST_GALLERY_BONUS : base;
}

export const RESERVED_SLUGS = [
  "app",
  "admin",
  "api",
  "login",
  "signup",
  "logout",
  "precos",
  "pricing",
  "termos",
  "privacidade",
  "sobre",
  "contato",
  "public",
  "assets",
  "static",
  "_next",
  "favicon.ico",
];
