import type { PublicRosterArtist } from "../types/publicPresskit";
import { ARTIST_CATEGORY_LABELS } from "../constants/category";
import { ARTIST_CATEGORY_LABELS_EN, type PresskitLanguage } from "../constants/i18n";
import { SectionHeading } from "./SectionHeading";

/**
 * The agency page's roster: one card per published artist, linking to the
 * artist's own page. `baseUrl` is the public site origin (empty = relative
 * links, fine on presskitai.com.br; set on an agency's custom domain so the
 * cards still reach /<artist>).
 */
export function RosterBlock({
  title,
  artists,
  layout,
  lang,
  baseUrl = "",
  seeLabel,
}: {
  title: string;
  artists: PublicRosterArtist[];
  layout: string;
  lang: PresskitLanguage;
  baseUrl?: string;
  seeLabel: string;
}) {
  if (artists.length === 0) return null;
  const labels = lang === "en" ? ARTIST_CATEGORY_LABELS_EN : ARTIST_CATEGORY_LABELS;
  const href = (slug: string) => `${baseUrl.replace(/\/+$/, "")}/${slug}`;

  if (layout === "list") {
    return (
      <section className="flex flex-col gap-4">
        <SectionHeading>{title}</SectionHeading>
        <ul className="flex flex-col divide-y divide-[var(--presskit-border)]">
          {artists.map((artist) => (
            <li key={artist.slug}>
              <a
                href={href(artist.slug)}
                data-track={`roster:${artist.slug}`}
                className="flex items-center gap-4 py-3 transition hover:bg-[var(--presskit-hover)]"
              >
                <RosterAvatar artist={artist} className="h-14 w-14 rounded-full" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-lg font-bold">{artist.name}</span>
                  <span className="truncate text-sm text-[var(--presskit-muted)]">
                    {[labels[artist.category], artist.tagline ?? [artist.city, artist.state].filter(Boolean).join(" - ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-[var(--presskit-accent)]">{seeLabel} →</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <SectionHeading>{title}</SectionHeading>
      <ul className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @3xl:gap-4">
        {artists.map((artist) => (
          <li key={artist.slug}>
            <a
              href={href(artist.slug)}
              data-track={`roster:${artist.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[var(--pk-card-radius)] border border-[var(--presskit-border)] bg-[var(--presskit-hover)] transition hover:border-[var(--presskit-accent)]"
            >
              <RosterAvatar artist={artist} className="aspect-[4/5] w-full" />
              <span className="flex flex-col gap-0.5 p-3 @3xl:p-4">
                <span
                  style={{ fontFamily: "var(--presskit-font-heading)" }}
                  className="truncate text-base font-bold leading-tight @3xl:text-lg"
                >
                  {artist.name}
                </span>
                <span className="truncate text-xs text-[var(--presskit-muted)] @3xl:text-sm">
                  {artist.tagline ?? labels[artist.category]}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RosterAvatar({ artist, className }: { artist: PublicRosterArtist; className: string }) {
  const image = artist.avatarImageUrl ?? artist.coverImageUrl;
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" loading="lazy" className={className + " shrink-0 object-cover"} />;
  }
  return (
    <span
      aria-hidden
      className={className + " flex shrink-0 items-center justify-center text-2xl font-bold text-[var(--presskit-accent)]"}
      style={{ backgroundColor: "color-mix(in srgb, var(--presskit-accent) 18%, var(--presskit-bg))" }}
    >
      {artist.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
