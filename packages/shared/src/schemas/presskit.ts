import { z } from "zod";
import { ARTIST_CATEGORIES, RESERVED_SLUGS } from "../constants/category";
import { FONT_KEYS } from "../constants/theme";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "use uma cor no formato #rrggbb");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "use apenas letras minúsculas, números e hífen")
  .refine((slug) => !RESERVED_SLUGS.includes(slug), { message: "esse slug é reservado" });

export const artistCategorySchema = z.enum(ARTIST_CATEGORIES);

export const presskitUpdateSchema = z.object({
  slug: slugSchema.optional(),
  category: artistCategorySchema.optional(),
  templateKey: z.string().trim().min(1).max(60).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(60).optional(),
  ogTitleOverride: z.string().trim().max(70).optional(),
  ogDescriptionOverride: z.string().trim().max(160).optional(),
  themeBackgroundColor: hexColorSchema.optional(),
  themeTextColor: hexColorSchema.optional(),
  themeAccentColor: hexColorSchema.optional(),
  themeFontKey: z.enum(FONT_KEYS).optional(),
  themeBackgroundImageUrl: z.string().trim().url().nullable().optional(),
  themeBackgroundImageKey: z.string().trim().nullable().optional(),
});
export type PresskitUpdateInput = z.infer<typeof presskitUpdateSchema>;

export const presskitOnboardingSchema = z.object({
  category: artistCategorySchema,
  slug: slugSchema,
});
export type PresskitOnboardingInput = z.infer<typeof presskitOnboardingSchema>;
