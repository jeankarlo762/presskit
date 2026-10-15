import type { ContactSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";
import { presskitButtonClass } from "./templates";

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
    <section id="contato" className="flex scroll-mt-6 flex-col gap-3 text-sm">
      <SectionHeading>{title}</SectionHeading>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {data.email && (
          <a href={`mailto:${data.email}`} className={`max-w-full break-all ${presskitButtonClass("solid", "sm")}`}>
            {data.email}
          </a>
        )}
        {data.phone && <span>{data.phone}</span>}
      </div>
      {data.socialLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.socialLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={presskitButtonClass("outline", "sm")}
            >
              {SOCIAL_LABELS[link.platform] ?? link.platform}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
