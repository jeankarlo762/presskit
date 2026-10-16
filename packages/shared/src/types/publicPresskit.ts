import type { ArtistCategory, SectionType } from "../constants/category";
import type { BackgroundAttachment, BackgroundPosition, ButtonStyle, FontKey } from "../constants/theme";
import type { MediaProvider } from "../schemas/collections";
import type { QuickLink } from "../schemas/presskit";

/** Shape of what GET /public/presskits/:slug returns after the HTTP+JSON
 * round-trip — dates arrive as ISO strings, not Date instances, which is why
 * this isn't just reused from the Prisma client types in backend. */
export type PublicSection = {
  id: string;
  type: SectionType;
  title: string | null;
  order: number;
  visible: boolean;
  data: unknown;
  /** English variants; absent/null = fall back to the Portuguese values. */
  titleEn?: string | null;
  dataEn?: unknown;
};

export type PublicMediaEmbed = {
  id: string;
  provider: MediaProvider;
  url: string;
  title: string | null;
  order: number;
};

export type PublicGalleryPhoto = {
  id: string;
  url: string;
  width: number;
  height: number;
  order: number;
  caption: string | null;
};

export type PublicTourDate = {
  id: string;
  date: string;
  venueName: string;
  city: string;
  ticketUrl: string | null;
};

export type PublicPressMention = {
  id: string;
  outlet: string;
  quote: string | null;
  url: string | null;
  logoUrl: string | null;
  publishedAt: string | null;
};

export type PublicPresskit = {
  id: string;
  slug: string;
  artistName: string;
  category: ArtistCategory;
  templateKey: string;
  city: string | null;
  state: string | null;
  ogTitleOverride: string | null;
  ogDescriptionOverride: string | null;
  themeBackgroundColor: string;
  themeTextColor: string;
  themeAccentColor: string;
  themeFontKey: FontKey;
  /** null/absent = same as themeFontKey. Optional so older callers that
   * build a preview object by hand keep compiling. */
  themeHeadingFontKey?: FontKey | null;
  /** Absent = DEFAULT_BUTTON_STYLE. */
  themeButtonStyle?: ButtonStyle;
  themeBackgroundImageUrl: string | null;
  // Every field below is optional for the same reason: hand-built preview
  // objects and rows that predate the column all render with the defaults.
  themeBackgroundOverlay?: number;
  themeBackgroundBlur?: number;
  themeBackgroundPosition?: BackgroundPosition | string;
  themeBackgroundAttachment?: BackgroundAttachment | string;
  themeBackgroundRepeat?: boolean;
  themeBackgroundPreset?: string;
  coverImageUrl?: string | null;
  avatarImageUrl?: string | null;
  logoImageUrl?: string | null;
  heroVideoUrl?: string | null;
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
  quickLinks?: QuickLink[];
  languages?: string[];
  sections: PublicSection[];
  mediaEmbeds: PublicMediaEmbed[];
  galleryPhotos: PublicGalleryPhoto[];
  tourDates: PublicTourDate[];
  pressMentions: PublicPressMention[];
};
