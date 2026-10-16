import {
  siApplemusic,
  siBandcamp,
  siFacebook,
  siInstagram,
  siSoundcloud,
  siSpotify,
  siThreads,
  siTiktok,
  siWhatsapp,
  siX,
  siYoutube,
} from "simple-icons";
import { QUICK_LINK_LABELS, type QuickLinkPlatform } from "../constants/quickLinks";
import type { QuickLink } from "../schemas/presskit";

// simple-icons paths are drawn on a 24×24 grid, same as the two generic
// glyphs below (globe, link, note) so every icon sits on one viewBox.
const GLOBE =
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-2.95a15.6 15.6 0 0 0-1.4-6.1A8.03 8.03 0 0 1 18.9 11zM12 4.04c.83 1.2 1.5 3.3 1.85 5.96h-3.7c.35-2.66 1.02-4.76 1.85-5.96zM4.26 15a7.9 7.9 0 0 1 0-6h3.38a17.5 17.5 0 0 0 0 6zm.84 2h2.95c.32 2.3.8 4.4 1.4 6.1A8.03 8.03 0 0 1 5.1 17zM8.05 9H5.1a8.03 8.03 0 0 1 4.35-6.1c-.6 1.7-1.08 3.8-1.4 6.1zM12 19.96c-.83-1.2-1.5-3.3-1.85-5.96h3.7c-.35 2.66-1.02 4.76-1.85 5.96zM14.34 12H9.66a15.6 15.6 0 0 1 0-4h4.68a15.6 15.6 0 0 1 0 4zm.21 10.1c.6-1.7 1.08-3.8 1.4-6.1h2.95a8.03 8.03 0 0 1-4.35 6.1zm1.81-8.1a17.5 17.5 0 0 0 0-6h3.38a7.9 7.9 0 0 1 0 6z";
const LINK =
  "M10.59 13.41a1 1 0 0 1 0 1.41 1 1 0 0 1-1.41 0 5 5 0 0 1 0-7.07l3.54-3.54a5 5 0 0 1 7.07 7.07l-1.49 1.49a1 1 0 1 1-1.41-1.41l1.49-1.49a3 3 0 1 0-4.24-4.24l-3.54 3.54a3 3 0 0 0 0 4.24zm2.82-2.82a1 1 0 0 1 0-1.41 1 1 0 0 1 1.41 0 5 5 0 0 1 0 7.07l-3.54 3.54a5 5 0 0 1-7.07-7.07l1.49-1.49a1 1 0 1 1 1.41 1.41l-1.49 1.49a3 3 0 1 0 4.24 4.24l3.54-3.54a3 3 0 0 0 0-4.24z";
const NOTE = "M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z";

const ICON_PATH: Record<QuickLinkPlatform | "WHATSAPP", string> = {
  SPOTIFY: siSpotify.path,
  APPLE_MUSIC: siApplemusic.path,
  DEEZER: NOTE,
  YOUTUBE: siYoutube.path,
  SOUNDCLOUD: siSoundcloud.path,
  BANDCAMP: siBandcamp.path,
  INSTAGRAM: siInstagram.path,
  TIKTOK: siTiktok.path,
  THREADS: siThreads.path,
  X: siX.path,
  FACEBOOK: siFacebook.path,
  SITE: GLOBE,
  OUTRO: LINK,
  WHATSAPP: siWhatsapp.path,
};

export function BrandIcon({ platform, size = 18 }: { platform: QuickLinkPlatform | "WHATSAPP"; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="currentColor">
      <path d={ICON_PATH[platform]} />
    </svg>
  );
}

/**
 * Icon row under the header ("linktree" strip). Each anchor carries a
 * data-track attribute the landing's click tracker reports — the renderer
 * itself stays a Server Component with no JS of its own.
 */
export function QuickLinksBar({ links, align = "start" }: { links: QuickLink[]; align?: "start" | "center" }) {
  if (links.length === 0) return null;
  return (
    <nav
      aria-label="Links"
      className={`flex flex-wrap gap-2 ${align === "center" ? "justify-center" : ""}`}
    >
      {links.map((link) => {
        const label = link.label?.trim() || QUICK_LINK_LABELS[link.platform];
        return (
          <a
            key={`${link.platform}:${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            data-track={`quicklink:${link.platform.toLowerCase()}`}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--pk-btn-radius)] border border-[var(--presskit-border-strong)] px-3 text-[var(--presskit-text)] transition hover:bg-[var(--presskit-hover)]"
          >
            <BrandIcon platform={link.platform} />
            {link.label?.trim() && <span className="text-sm font-semibold">{link.label.trim()}</span>}
          </a>
        );
      })}
    </nav>
  );
}
