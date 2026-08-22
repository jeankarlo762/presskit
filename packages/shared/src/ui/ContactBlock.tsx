import type { ContactSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";

const SOCIAL_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  SPOTIFY: "Spotify",
  X: "X",
  IMDB: "IMDb",
  SITE: "Site",
  OUTRO: "Link",
};

export function ContactBlock({ title, data }: { title: string; data: ContactSectionData }) {
  const hasContent = data.email || data.phone || data.socialLinks.length > 0;
  if (!hasContent) return null;

  return (
    <section className="flex flex-col gap-2 text-sm">
      <SectionHeading>{title}</SectionHeading>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.email && (
          <a href={`mailto:${data.email}`} className="text-[var(--presskit-accent)] underline underline-offset-2">
            {data.email}
          </a>
        )}
        {data.phone && <span>{data.phone}</span>}
      </div>
      {data.socialLinks.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {data.socialLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--presskit-accent)] underline underline-offset-2"
            >
              {SOCIAL_LABELS[link.platform] ?? link.platform}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
