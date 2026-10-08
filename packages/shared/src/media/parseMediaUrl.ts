import type { MediaProvider } from "../schemas/collections";

export type ParsedMediaUrl = {
  provider: MediaProvider;
  /** What goes into the <iframe src> — always a URL on the provider's own
   * player host, never the raw user input. */
  embedSrc: string;
  /** Provider-side identifier (video id, Spotify id, SoundCloud path). */
  id: string;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

const SPOTIFY_TYPES = new Set(["track", "album", "playlist", "artist", "episode", "show"]);
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

const SOUNDCLOUD_HOSTS = new Set(["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"]);

/** "1h2m3s" / "90s" / "90" → seconds, for YouTube's `t=` param. */
function parseYoutubeStart(raw: string | null): number | null {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  if (!match || match[0] === "") return null;
  const [, h = "0", m = "0", s = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function parseYoutube(url: URL): ParsedMediaUrl | null {
  let id: string | null = null;

  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    const segments = url.pathname.split("/").filter(Boolean);
    const [first, second] = segments;
    if (first === "watch") id = url.searchParams.get("v");
    else if (first && ["shorts", "embed", "live", "v"].includes(first)) id = second ?? null;
  } else {
    return null;
  }

  if (!id || !YOUTUBE_ID.test(id)) return null;

  // youtube-nocookie keeps the embed from setting tracking cookies until the
  // visitor actually presses play — same player, better default for a page
  // that is itself someone else's marketing material.
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  const start = parseYoutubeStart(url.searchParams.get("t") ?? url.searchParams.get("start"));
  if (start && start > 0) embed.searchParams.set("start", String(start));

  return { provider: "YOUTUBE", embedSrc: embed.toString(), id };
}

function parseVimeo(url: URL): ParsedMediaUrl | null {
  if (!VIMEO_HOSTS.has(url.hostname)) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  // vimeo.com/123, vimeo.com/video/123, vimeo.com/channels/x/123,
  // vimeo.com/groups/x/videos/123 — the id is always the first all-digit
  // segment; an unlisted video carries its hash right after it.
  const idIndex = segments.findIndex((segment) => /^\d+$/.test(segment));
  if (idIndex === -1) return null;
  const id = segments[idIndex]!;
  const hash = segments[idIndex + 1];

  const embed = new URL(`https://player.vimeo.com/video/${id}`);
  const h = url.searchParams.get("h") ?? (hash && /^[a-f0-9]{6,}$/i.test(hash) ? hash : null);
  if (h) embed.searchParams.set("h", h);

  return { provider: "VIMEO", embedSrc: embed.toString(), id };
}

function parseSpotify(raw: string, url: URL | null): ParsedMediaUrl | null {
  // spotify:track:ID URIs (what "Copy Spotify URI" produces).
  const uri = /^spotify:(track|album|playlist|artist|episode|show):([A-Za-z0-9]{22})$/.exec(raw);
  if (uri) {
    const [, type, id] = uri;
    return { provider: "SPOTIFY", embedSrc: `https://open.spotify.com/embed/${type}/${id}`, id: id! };
  }

  if (!url || url.hostname !== "open.spotify.com") return null;
  const segments = url.pathname.split("/").filter(Boolean);
  // Localised links insert a locale segment first: open.spotify.com/intl-pt/track/ID
  if (segments[0]?.startsWith("intl-")) segments.shift();
  const [type, id] = segments;
  if (!type || !id || !SPOTIFY_TYPES.has(type) || !SPOTIFY_ID.test(id)) return null;

  return { provider: "SPOTIFY", embedSrc: `https://open.spotify.com/embed/${type}/${id}`, id };
}

function parseSoundcloud(url: URL): ParsedMediaUrl | null {
  if (!SOUNDCLOUD_HOSTS.has(url.hostname)) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  // Needs at least user/track (or user/sets/playlist) — a bare profile URL
  // isn't embeddable as a player.
  if (segments.length < 2) return null;
  const canonical = `https://soundcloud.com/${segments.join("/")}`;
  const embed = new URL("https://w.soundcloud.com/player/");
  embed.searchParams.set("url", canonical);
  embed.searchParams.set("visual", "false");
  embed.searchParams.set("show_teaser", "false");

  return { provider: "SOUNDCLOUD", embedSrc: embed.toString(), id: segments.join("/") };
}

/**
 * Single source of truth for "which provider is this link and how do we
 * embed it" — the backend uses it to reject links that can't be rendered,
 * the editor uses it to auto-pick the provider, and the public renderer
 * uses it to build the iframe. Returns null for anything unrecognised, so a
 * link that gets past validation always has a working player.
 */
export function parseMediaUrl(raw: string): ParsedMediaUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL | null = null;
  try {
    url = new URL(trimmed);
  } catch {
    url = null;
  }

  if (url && url.protocol !== "https:" && url.protocol !== "http:") url = null;
  if (!url && !trimmed.startsWith("spotify:")) return null;

  if (url) {
    return parseYoutube(url) ?? parseVimeo(url) ?? parseSpotify(trimmed, url) ?? parseSoundcloud(url);
  }
  return parseSpotify(trimmed, null);
}

export function detectMediaProvider(raw: string): MediaProvider | null {
  return parseMediaUrl(raw)?.provider ?? null;
}
