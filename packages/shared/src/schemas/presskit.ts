import { z } from "zod";
import { ARTIST_CATEGORIES, RESERVED_SLUGS, ACCOUNT_TYPES, PICKABLE_ARTIST_CATEGORIES } from "../constants/category";
import {
  BACKGROUND_ATTACHMENTS,
  BACKGROUND_BLUR_MAX,
  BACKGROUND_OVERLAY_MAX,
  BACKGROUND_POSITIONS,
  BACKGROUND_PRESET_KEYS,
  BUTTON_STYLES,
  FONT_KEYS,
  NAV_MODES,
  TEMPLATE_KEYS,
} from "../constants/theme";
import { MAX_QUICK_LINKS, QUICK_LINK_PLATFORMS } from "../constants/quickLinks";
import { PRESSKIT_LANGUAGES } from "../constants/i18n";
import { httpUrlSchema } from "./url";
import { parseMediaUrl } from "../media/parseMediaUrl";

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

export const quickLinkSchema = z.object({
  platform: z.enum(QUICK_LINK_PLATFORMS),
  url: httpUrlSchema,
  label: z.string().trim().max(30).optional(),
});
export type QuickLink = z.infer<typeof quickLinkSchema>;

/** YouTube or Vimeo only — the hero plays it muted in a loop. */
export const heroVideoUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    const parsed = parseMediaUrl(value);
    return parsed !== null && (parsed.provider === "YOUTUBE" || parsed.provider === "VIMEO");
  }, "use um link do YouTube ou do Vimeo");

/** International digits, no "+", e.g. 5511999998888. */
export const whatsappNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().min(10, "inclua o DDI e o DDD (ex.: 5511999998888)").max(15));

/**
 * What the dashboard may change through PATCH /presskit. Image URLs/keys
 * (background, cover, avatar, logo) are deliberately NOT here: they are
 * only ever set by the server after a verified upload
 * (POST /presskit/images/:slot/confirm), otherwise a client could point a
 * key at another artist's object and have the backend delete it on their
 * behalf. The custom domain has its own endpoint for the same reason (it
 * needs uniqueness + status handling).
 */
export const presskitUpdateSchema = z.object({
  slug: slugSchema.optional(),
  category: artistCategorySchema.optional(),
  templateKey: z.enum(TEMPLATE_KEYS).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(60).optional(),
  ogTitleOverride: z.string().trim().max(70).optional(),
  ogDescriptionOverride: z.string().trim().max(160).optional(),
  themeBackgroundColor: hexColorSchema.optional(),
  themeTextColor: hexColorSchema.optional(),
  themeAccentColor: hexColorSchema.optional(),
  themeFontKey: z.enum(FONT_KEYS).optional(),
  /** null = use the body font (themeFontKey) for headings too. */
  themeHeadingFontKey: z.enum(FONT_KEYS).nullable().optional(),
  themeButtonStyle: z.enum(BUTTON_STYLES).optional(),

  themeBackgroundOverlay: z.number().int().min(0).max(BACKGROUND_OVERLAY_MAX).optional(),
  themeBackgroundBlur: z.number().int().min(0).max(BACKGROUND_BLUR_MAX).optional(),
  themeBackgroundPosition: z.enum(BACKGROUND_POSITIONS).optional(),
  themeBackgroundAttachment: z.enum(BACKGROUND_ATTACHMENTS).optional(),
  themeBackgroundRepeat: z.boolean().optional(),
  themeBackgroundPreset: z.enum(BACKGROUND_PRESET_KEYS).optional(),

  heroVideoUrl: heroVideoUrlSchema.nullable().optional(),
  whatsappNumber: whatsappNumberSchema.nullable().optional(),
  whatsappMessage: z.string().trim().max(300).nullable().optional(),
  quickLinks: z.array(quickLinkSchema).max(MAX_QUICK_LINKS).optional(),
  navMode: z.enum(NAV_MODES).optional(),
  showNav: z.boolean().optional(),
  tagline: z.string().trim().max(140).nullable().optional(),
  /** Name on the page; null = owner's name. Required on roster pages. */
  displayName: z.string().trim().min(2).max(80).nullable().optional(),
  languages: z
    .array(z.enum(PRESSKIT_LANGUAGES))
    .min(1)
    .refine((list) => list.includes("pt"), "o português é sempre oferecido")
    .transform((list) => Array.from(new Set(list)))
    .optional(),
});
export type PresskitUpdateInput = z.infer<typeof presskitUpdateSchema>;

export const presskitOnboardingSchema = z.object({
  accountType: z.enum(ACCOUNT_TYPES).default("ARTIST"),
  category: artistCategorySchema,
  slug: slugSchema,
});

/** An agency adding an artist page to its roster. */
export const rosterArtistCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.enum(PICKABLE_ARTIST_CATEGORIES),
  slug: slugSchema,
});
export type RosterArtistCreateInput = z.infer<typeof rosterArtistCreateSchema>;
export type PresskitOnboardingInput = z.infer<typeof presskitOnboardingSchema>;

export const IMAGE_SLOTS = ["background", "cover", "avatar", "logo"] as const;
export type ImageSlot = (typeof IMAGE_SLOTS)[number];

export const IMAGE_SLOT_LABELS: Record<ImageSlot, string> = {
  background: "Imagem de fundo",
  cover: "Capa",
  avatar: "Foto de perfil",
  logo: "Logo",
};

/** Lower-case hostname, at least one dot, no scheme/path. Our own domains
 * and Railway's are refused server-side as well. */
export const customDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
  .pipe(
    z
      .string()
      .min(4)
      .max(253)
      .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, "informe um domínio válido, ex.: nomedoartista.com.br"),
  );

export const CUSTOM_DOMAIN_STATUSES = ["NONE", "PENDING", "ACTIVE"] as const;
export type CustomDomainStatus = (typeof CUSTOM_DOMAIN_STATUSES)[number];

export type CustomDomainInfo = {
  domain: string | null;
  status: CustomDomainStatus;
  /** What the artist must create at their DNS provider. */
  dns: { type: "CNAME"; name: string; value: string } | null;
};
