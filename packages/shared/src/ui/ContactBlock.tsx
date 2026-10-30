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

export function ContactBlock({
  title,
  data,
  stageHeadline,
}: {
  title: string;
  data: ContactSectionData;
  /** Palco: shown as a big accent-colored booking card with this headline. */
  stageHeadline?: string;
}) {
  // A section nobody has filled in yet arrives as data = {}.
  const socialLinks = data.socialLinks ?? [];
  const hasContent = data.email || data.phone || socialLinks.length > 0;
  if (!hasContent) return null;
  const phoneWhatsapp = data.phone ? phoneWhatsappUrl(data.phone) : null;

  if (stageHeadline) {
    // On the accent card the usual accent buttons would vanish, so the
    // colors flip: solid = on-accent fill, outline = on-accent border.
    const solid =
      "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--pk-btn-radius)] bg-[var(--presskit-on-accent)] px-6 py-3 text-base font-extrabold text-[var(--presskit-accent)] no-underline transition hover:opacity-90";
    const outline =
      "inline-flex min-h-10 items-center justify-center rounded-[var(--pk-btn-radius)] border border-[color-mix(in_srgb,var(--presskit-on-accent)_45%,transparent)] px-4 py-2 text-sm font-bold text-[var(--presskit-on-accent)] no-underline transition hover:bg-[color-mix(in_srgb,var(--presskit-on-accent)_12%,transparent)]";
    return (
      <section className="flex flex-col gap-8 rounded-[calc(var(--pk-card-radius)*2)] bg-[var(--presskit-accent)] px-6 py-10 text-[var(--presskit-on-accent)] @4xl:flex-row @4xl:items-end @4xl:justify-between @4xl:gap-12 @4xl:px-16 @4xl:py-20">
        <div className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] @4xl:text-sm">{title}</h2>
          <p
            style={{ fontFamily: "var(--presskit-font-heading)" }}
            className="break-words text-[clamp(2.75rem,13cqw,4rem)] font-bold uppercase leading-[0.92] @4xl:text-[clamp(4rem,8cqw,8rem)]"
          >
            {stageHeadline}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 @4xl:min-w-80">
          {phoneWhatsapp && (
            <a href={phoneWhatsapp} target="_blank" rel="noopener noreferrer" data-track="whatsapp" className={solid}>
              <BrandIcon platform="WHATSAPP" size={18} />
              WhatsApp
            </a>
          )}
          {!phoneWhatsapp && data.phone && <span className="text-center text-lg font-bold">{data.phone}</span>}
          {data.email && (
            <a
              href={`mailto:${data.email}`}
              className={phoneWhatsapp ? "break-all text-center font-bold text-[var(--presskit-on-accent)] underline underline-offset-4" : `break-all ${solid}`}
            >
              {data.email}
            </a>
          )}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 @4xl:justify-center">
              {socialLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={outline}>
                  {SOCIAL_LABELS[link.platform] ?? link.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

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
