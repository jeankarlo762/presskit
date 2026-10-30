import { phoneWhatsappUrl } from "../constants/quickLinks";
import type { ContactSectionData } from "../schemas/section";
import { BrandIcon } from "./QuickLinksBar";
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
  // A section nobody has filled in yet arrives as data = {}.
  const socialLinks = data.socialLinks ?? [];
  const hasContent = data.email || data.phone || socialLinks.length > 0;
  if (!hasContent) return null;
  const phoneWhatsapp = data.phone ? phoneWhatsappUrl(data.phone) : null;

  return (
    <section className="flex flex-col gap-3 text-sm">
      <SectionHeading>{title}</SectionHeading>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {data.email && (
          <a href={`mailto:${data.email}`} className={`max-w-full break-all ${presskitButtonClass("solid", "sm")}`}>
            {data.email}
          </a>
        )}
        {phoneWhatsapp ? (
          <a
            href={phoneWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            className={presskitButtonClass("solid", "sm")}
          >
            <BrandIcon platform="WHATSAPP" size={16} />
            WhatsApp
          </a>
        ) : (
          data.phone && <span>{data.phone}</span>
        )}
      </div>
      {socialLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {socialLinks.map((link) => (
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
