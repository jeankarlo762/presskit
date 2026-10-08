import type { MediaProvider } from "../schemas/collections";
import type { PublicMediaEmbed } from "../types/publicPresskit";
import { parseMediaUrl } from "../media/parseMediaUrl";
import { SectionHeading } from "./SectionHeading";

export const AUDIO_PROVIDERS: MediaProvider[] = ["SPOTIFY", "SOUNDCLOUD"];
export const VIDEO_PROVIDERS: MediaProvider[] = ["YOUTUBE", "VIMEO"];

function EmbedFrame({ embed }: { embed: PublicMediaEmbed }) {
  // Links are validated against parseMediaUrl on write, so this only fails
  // for rows that predate the validation — and even then we never put the
  // raw stored URL into an href (http(s) isn't guaranteed for old rows).
  const parsed = parseMediaUrl(embed.url);
  const isVideo = VIDEO_PROVIDERS.includes(embed.provider);

  if (!parsed) {
    return <p className="text-sm text-[var(--presskit-muted)]">{embed.title ?? "Mídia indisponível"}</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl shadow-sm">
      {embed.title && <p className="mb-1 text-sm font-medium">{embed.title}</p>}
      <iframe
        src={parsed.embedSrc}
        title={embed.title ?? embed.provider}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className={isVideo ? "aspect-video w-full border-0" : "h-[152px] w-full border-0"}
      />
    </div>
  );
}

export function MediaEmbedBlock({ title, embeds }: { title: string; embeds: PublicMediaEmbed[] }) {
  if (embeds.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>{title}</SectionHeading>
      <div className="flex flex-col gap-4">
        {embeds.map((embed) => (
          <EmbedFrame key={embed.id} embed={embed} />
        ))}
      </div>
    </section>
  );
}
