import { z } from "zod";

export const mediaProviderSchema = z.enum(["SPOTIFY", "YOUTUBE", "SOUNDCLOUD", "VIMEO"]);
export type MediaProvider = z.infer<typeof mediaProviderSchema>;

export const mediaEmbedSchema = z.object({
  id: z.string().cuid2().optional(),
  provider: mediaProviderSchema,
  url: z.string().trim().url(),
  title: z.string().trim().max(150).optional(),
  order: z.number().int().min(0),
});
export type MediaEmbedInput = z.infer<typeof mediaEmbedSchema>;

export const galleryPhotoSchema = z.object({
  id: z.string().cuid2().optional(),
  storageKey: z.string().trim().min(1),
  url: z.string().trim().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  order: z.number().int().min(0),
  caption: z.string().trim().max(200).optional(),
});
export type GalleryPhotoInput = z.infer<typeof galleryPhotoSchema>;

export const tourDateSchema = z.object({
  id: z.string().cuid2().optional(),
  date: z.coerce.date(),
  venueName: z.string().trim().min(1).max(150),
  city: z.string().trim().min(1).max(120),
  ticketUrl: z.string().trim().url().optional(),
});
export type TourDateInput = z.infer<typeof tourDateSchema>;

export const pressMentionSchema = z.object({
  id: z.string().cuid2().optional(),
  outlet: z.string().trim().min(1).max(150),
  quote: z.string().trim().max(400).optional(),
  url: z.string().trim().url().optional(),
  logoUrl: z.string().trim().url().optional(),
  publishedAt: z.coerce.date().optional(),
});
export type PressMentionInput = z.infer<typeof pressMentionSchema>;

export const trackableLinkSchema = z.object({
  id: z.string().cuid2().optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "use apenas letras minúsculas, números e hífen"),
  label: z.string().trim().min(1).max(120),
  active: z.boolean().default(true),
});
export type TrackableLinkInput = z.infer<typeof trackableLinkSchema>;
