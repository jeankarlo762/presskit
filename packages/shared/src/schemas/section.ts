import { z } from "zod";
import { SECTION_TYPES } from "../constants/category";

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
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(60).optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "SPOTIFY", "X", "IMDB", "SITE", "OUTRO"]),
        url: z.string().trim().url(),
      }),
    )
    .max(10)
    .default([]),
});

const techRiderDataSchema = z.object({
  text: z.string().trim().max(6000).optional(),
  pdfUrl: z.string().trim().url().optional(),
});

const customDataSchema = z.object({
  title: z.string().trim().max(120),
  body: z.string().trim().max(4000),
});

/** MEDIA, GALLERY, TOUR_DATES and PRESS mentions are collection sections — the
 * items live in their own tables (MediaEmbed/GalleryPhoto/TourDate/PressMention).
 * Their Section.data only carries display-level config, not the items. */
const collectionDataSchema = z.object({}).catchall(z.never());

export const sectionDataSchemaByType = {
  BIO: bioDataSchema,
  MEDIA: collectionDataSchema,
  GALLERY: collectionDataSchema,
  PRESS: pressDataSchema,
  TOUR_DATES: collectionDataSchema,
  CONTACT: contactDataSchema,
  TECH_RIDER: techRiderDataSchema,
  CUSTOM: customDataSchema,
} as const satisfies Record<(typeof SECTION_TYPES)[number], z.ZodTypeAny>;

const sectionBaseFields = {
  id: z.string().cuid2().optional(),
  order: z.number().int().min(0),
  visible: z.boolean().default(true),
};

// z.discriminatedUnion needs each member as a distinct ZodObject literal —
// building this list via SECTION_TYPES.map() loses that at the type level
// (TS widens it to ZodObject[], not the required non-empty object tuple).
export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ ...sectionBaseFields, type: z.literal("BIO"), data: bioDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("MEDIA"), data: collectionDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("GALLERY"), data: collectionDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("PRESS"), data: pressDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("TOUR_DATES"), data: collectionDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("CONTACT"), data: contactDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("TECH_RIDER"), data: techRiderDataSchema }),
  z.object({ ...sectionBaseFields, type: z.literal("CUSTOM"), data: customDataSchema }),
]);

export type SectionInput = z.infer<typeof sectionSchema>;
export type BioSectionData = z.infer<typeof bioDataSchema>;
export type ContactSectionData = z.infer<typeof contactDataSchema>;
export type TechRiderSectionData = z.infer<typeof techRiderDataSchema>;
export type CustomSectionData = z.infer<typeof customDataSchema>;
export type PressSectionData = z.infer<typeof pressDataSchema>;
