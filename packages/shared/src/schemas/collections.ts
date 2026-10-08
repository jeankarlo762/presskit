import { z } from "zod";
import { httpUrlSchema } from "./url";
import { parseMediaUrl } from "../media/parseMediaUrl";

export const mediaProviderSchema = z.enum(["SPOTIFY", "YOUTUBE", "SOUNDCLOUD", "VIMEO"]);
export type MediaProvider = z.infer<typeof mediaProviderSchema>;

export const MEDIA_PROVIDER_LABELS: Record<MediaProvider, string> = {
  SPOTIFY: "Spotify",
  YOUTUBE: "YouTube",
  SOUNDCLOUD: "SoundCloud",
  VIMEO: "Vimeo",
};

export const mediaEmbedSchema = z.object({
  id: z.string().cuid().optional(),
  provider: mediaProviderSchema,
  // Spotify URIs (spotify:track:...) aren't http URLs but are a legitimate
  // paste target — parseMediaUrl handles them, so the scheme check lives in
  // the refinement below instead of httpUrlSchema.
  url: z.string().trim().min(1, "cole o link").max(2048, "link muito longo"),
  title: z.string().trim().max(150).optional(),
  order: z.number().int().min(0),
});
export type MediaEmbedInput = z.infer<typeof mediaEmbedSchema>;

/** A link is only accepted when it is recognisably embeddable AND belongs
 * to the provider the client claims — otherwise the public page would
 * render a dead player (or, before this check, an arbitrary `href`). */
function refineMediaLink(value: { provider?: MediaProvider; url?: string }, ctx: z.RefinementCtx) {
  if (value.url === undefined) return;
  const parsed = parseMediaUrl(value.url);
  if (!parsed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: "link não reconhecido — cole um link do YouTube, Vimeo, Spotify ou SoundCloud",
    });
    return;
  }
  if (value.provider && parsed.provider !== value.provider) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: `esse link é do ${MEDIA_PROVIDER_LABELS[parsed.provider]}, não do ${MEDIA_PROVIDER_LABELS[value.provider]}`,
    });
  }
}

export const mediaEmbedCreateSchema = mediaEmbedSchema.omit({ id: true, order: true }).superRefine(refineMediaLink);
export type MediaEmbedCreateInput = z.infer<typeof mediaEmbedCreateSchema>;

export const mediaEmbedPatchSchema = mediaEmbedSchema
  .omit({ id: true, order: true })
  .partial()
  .superRefine(refineMediaLink);
export type MediaEmbedPatchInput = z.infer<typeof mediaEmbedPatchSchema>;

export const galleryPhotoSchema = z.object({
  id: z.string().cuid().optional(),
  storageKey: z.string().trim().min(1),
  url: httpUrlSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  order: z.number().int().min(0),
  caption: z.string().trim().max(200).optional(),
});
export type GalleryPhotoInput = z.infer<typeof galleryPhotoSchema>;

export const tourDateSchema = z.object({
  id: z.string().cuid().optional(),
  date: z.coerce.date(),
  venueName: z.string().trim().min(1).max(150),
  city: z.string().trim().min(1).max(120),
  ticketUrl: httpUrlSchema.optional(),
});
export type TourDateInput = z.infer<typeof tourDateSchema>;

export const pressMentionSchema = z.object({
  id: z.string().cuid().optional(),
  outlet: z.string().trim().min(1).max(150),
  quote: z.string().trim().max(400).optional(),
  url: httpUrlSchema.optional(),
  logoUrl: httpUrlSchema.optional(),
  publishedAt: z.coerce.date().optional(),
});
export type PressMentionInput = z.infer<typeof pressMentionSchema>;

export const trackableLinkSchema = z.object({
  id: z.string().cuid().optional(),
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
