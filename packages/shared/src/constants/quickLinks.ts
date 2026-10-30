export const QUICK_LINK_PLATFORMS = [
  "SPOTIFY",
  "APPLE_MUSIC",
  "DEEZER",
  "YOUTUBE",
  "SOUNDCLOUD",
  "BANDCAMP",
  "INSTAGRAM",
  "TIKTOK",
  "THREADS",
  "X",
  "FACEBOOK",
  "SITE",
  "OUTRO",
] as const;
export type QuickLinkPlatform = (typeof QUICK_LINK_PLATFORMS)[number];

export const QUICK_LINK_LABELS: Record<QuickLinkPlatform, string> = {
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  DEEZER: "Deezer",
  YOUTUBE: "YouTube",
  SOUNDCLOUD: "SoundCloud",
  BANDCAMP: "Bandcamp",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  THREADS: "Threads",
  X: "X",
  FACEBOOK: "Facebook",
  SITE: "Site",
  OUTRO: "Link",
};

export const MAX_QUICK_LINKS = 8;

/** Builds the wa.me URL. `number` is digits only with country code. */
export function whatsappUrl(number: string, message?: string | null): string {
  const url = new URL(`https://wa.me/${number.replace(/\D/g, "")}`);
  if (message?.trim()) url.searchParams.set("text", message.trim());
  return url.toString();
}

/**
 * wa.me link for a free-typed phone such as "(48) 99122-1256". Brazilian
 * numbers typed without the country code (10-11 digits) get 55 prepended.
 * Returns null when there aren't enough digits to be a real number.
 */
export function phoneWhatsappUrl(phone: string): string | null {
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < 10) return null;
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}
