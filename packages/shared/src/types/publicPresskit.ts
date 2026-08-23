import type { ArtistCategory, SectionType } from "../constants/category";
import type { FontKey } from "../constants/theme";
import type { MediaProvider } from "../schemas/collections";

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
  themeBackgroundImageUrl: string | null;
  sections: PublicSection[];
  mediaEmbeds: PublicMediaEmbed[];
  galleryPhotos: PublicGalleryPhoto[];
  tourDates: PublicTourDate[];
  pressMentions: PublicPressMention[];
};
