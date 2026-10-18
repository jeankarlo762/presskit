import { z } from "zod";
import { SECTION_TYPES } from "../constants/category";
import { httpUrlSchema } from "./url";

const bioDataSchema = z.object({
  shortBio: z.string().trim().max(280),
  longBio: z.string().trim().max(4000),
});

const pressDataSchema = z.object({
  highlightStats: z.string().trim().max(500).optional(),
});

const contactDataSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "SPOTIFY", "X", "IMDB", "SITE", "OUTRO"]),
        url: httpUrlSchema,
      }),
    )
    .max(10)
    .default([]),
});

const techRiderDataSchema = z.object({
  text: z.string().trim().max(6000).optional(),
  pdfUrl: httpUrlSchema.optional(),
});

// CUSTOM used to carry its own title in `data` — now redundant since every
// section (this one included) has a top-level, editable `title`.
const customDataSchema = z.object({
  body: z.string().trim().max(4000),
});

const statsDataSchema = z.object({
  items: z
    .array(z.object({ value: z.string().trim().min(1).max(20), label: z.string().trim().min(1).max(40) }))
    .max(6)
    .default([]),
});

const testimonialsDataSchema = z.object({
  items: z
    .array(
      z.object({
        quote: z.string().trim().min(1).max(500),
        author: z.string().trim().min(1).max(80),
        role: z.string().trim().max(80).optional(),
      }),
    )
    .max(8)
    .default([]),
});

const faqDataSchema = z.object({
  items: z
    .array(z.object({ question: z.string().trim().min(1).max(160), answer: z.string().trim().min(1).max(1500) }))
    .max(12)
    .default([]),
});

// Downloads can be files uploaded through /presskit/files (served from
// /media) or plain external links (Drive, WeTransfer…) — both are URLs.
const downloadsDataSchema = z.object({
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        url: httpUrlSchema,
        sizeBytes: z.number().int().nonnegative().optional(),
      }),
    )
    .max(12)
    .default([]),
});

/** MUSIC, VIDEO, GALLERY, TOUR_DATES and PRESS mentions are collection
 * sections — the items live in their own tables (MediaEmbed, filtered by
 * provider for MUSIC vs VIDEO / GalleryPhoto / TourDate / PressMention).
 * Their Section.data only carries display-level config, not the items. */
const collectionDataSchema = z.object({}).catchall(z.never());

export const sectionDataSchemaByType = {
  BIO: bioDataSchema,
  MUSIC: collectionDataSchema,
  VIDEO: collectionDataSchema,
  GALLERY: collectionDataSchema,
  PRESS: pressDataSchema,
  TOUR_DATES: collectionDataSchema,
  CONTACT: contactDataSchema,
  TECH_RIDER: techRiderDataSchema,
  CUSTOM: customDataSchema,
  STATS: statsDataSchema,
  TESTIMONIALS: testimonialsDataSchema,
  FAQ: faqDataSchema,
  DOWNLOADS: downloadsDataSchema,
  ROSTER: collectionDataSchema,
} as const satisfies Record<(typeof SECTION_TYPES)[number], z.ZodTypeAny>;

const sectionBaseFields = {
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(60).optional(),
  order: z.number().int().min(0),
  visible: z.boolean().default(true),
};

// z.discriminatedUnion needs each member as a distinct ZodObject literal —
// building this list via SECTION_TYPES.map() loses that at the type level
// (TS widens it to ZodObject[], not the required non-empty object tuple).
export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ ...sectionBaseFields, type: z.literal("BIO"), data: bioDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("MUSIC"), data: collectionDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("VIDEO"), data: collectionDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("GALLERY"), data: collectionDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("PRESS"), data: pressDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("TOUR_DATES"), data: collectionDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("CONTACT"), data: contactDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("TECH_RIDER"), data: techRiderDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("CUSTOM"), data: customDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("STATS"), data: statsDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("TESTIMONIALS"), data: testimonialsDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("FAQ"), data: faqDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("DOWNLOADS"), data: downloadsDataSchema }),
]);

export type SectionInput = z.infer<typeof sectionSchema>;
export type BioSectionData = z.infer<typeof bioDataSchema>;
export type ContactSectionData = z.infer<typeof contactDataSchema>;
export type TechRiderSectionData = z.infer<typeof techRiderDataSchema>;
export type CustomSectionData = z.infer<typeof customDataSchema>;
export type PressSectionData = z.infer<typeof pressDataSchema>;
export type StatsSectionData = z.infer<typeof statsDataSchema>;
export type TestimonialsSectionData = z.infer<typeof testimonialsDataSchema>;
export type FaqSectionData = z.infer<typeof faqDataSchema>;
export type DownloadsSectionData = z.infer<typeof downloadsDataSchema>;

export const sectionTitleSchema = z.string().trim().min(1).max(60);

/** English variants: same shape as the type's data schema but every field
 * optional, so the artist can translate only what matters — the renderer
 * falls back to Portuguese field by field. Collection sections carry no
 * translatable data. */
export const sectionTranslationSchemaByType = {
  BIO: bioDataSchema.partial(),
  MUSIC: collectionDataSchema,
  VIDEO: collectionDataSchema,
  GALLERY: collectionDataSchema,
  PRESS: pressDataSchema.partial(),
  TOUR_DATES: collectionDataSchema,
  CONTACT: z.object({}).catchall(z.never()),
  TECH_RIDER: techRiderDataSchema.pick({ text: true }).partial(),
  CUSTOM: customDataSchema.partial(),
  STATS: statsDataSchema.partial(),
  TESTIMONIALS: testimonialsDataSchema.partial(),
  FAQ: faqDataSchema.partial(),
  DOWNLOADS: downloadsDataSchema.partial(),
  ROSTER: collectionDataSchema,
} as const satisfies Record<(typeof SECTION_TYPES)[number], z.ZodTypeAny>;

export const sectionTitleEnSchema = z.string().trim().max(60).nullable();

const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "use uma cor no formato #rrggbb");

/**
 * Per-section look. Every field optional: unset = inherit from the page
 * theme. Background image URL/key are only ever written by the server
 * (section background upload routes), never from this schema.
 */
export const sectionStyleSchema = z.object({
  backgroundColor: hexColor.nullable().optional(),
  backgroundPreset: z.string().max(40).nullable().optional(),
  backgroundOverlay: z.number().int().min(0).max(90).nullable().optional(),
  textColor: hexColor.nullable().optional(),
  accentColor: hexColor.nullable().optional(),
  width: z.enum(["narrow", "normal", "wide", "full"]).nullable().optional(),
  padding: z.enum(["compact", "normal", "spacious"]).nullable().optional(),
  align: z.enum(["left", "center"]).nullable().optional(),
  divider: z.boolean().nullable().optional(),
});
export type SectionStyleInput = z.infer<typeof sectionStyleSchema>;

/** What the API stores and returns — the editable fields plus the image. */
export type SectionStyle = SectionStyleInput & {
  backgroundImageUrl?: string | null;
  backgroundImageKey?: string | null;
};

export const sectionLayoutSchema = z.string().trim().max(40).nullable();
