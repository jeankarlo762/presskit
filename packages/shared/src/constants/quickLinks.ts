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
