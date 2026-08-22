import type { MediaProvider } from "../schemas/collections";
import type { PublicMediaEmbed } from "../types/publicPresskit";
import { SectionHeading } from "./SectionHeading";

export const AUDIO_PROVIDERS: MediaProvider[] = ["SPOTIFY", "SOUNDCLOUD"];
export const VIDEO_PROVIDERS: MediaProvider[] = ["YOUTUBE", "VIMEO"];

function toEmbedSrc(embed: PublicMediaEmbed): string | null {
  try {
    const url = new URL(embed.url);

    switch (embed.provider) {
      case "SPOTIFY": {
        const [, type, id] = url.pathname.split("/");
        if (!type || !id) return null;
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
      case "YOUTUBE": {
        const id = url.hostname.includes("youtu.be")
          ? url.pathname.slice(1)
          : url.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      case "VIMEO": {
        const id = url.pathname.split("/").filter(Boolean).pop();
        return id ? `https://player.vimeo.com/video/${id}` : null;
      }
      case "SOUNDCLOUD":
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(embed.url)}`;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function EmbedFrame({ embed }: { embed: PublicMediaEmbed }) {
  const src = toEmbedSrc(embed);
  const isVideo = VIDEO_PROVIDERS.includes(embed.provider);

  if (!src) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--presskit-accent)] underline underline-offset-2"
      >
        {embed.title ?? embed.url}
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg">
      {embed.title && <p className="mb-1 text-sm font-medium">{embed.title}</p>}
      <iframe
        src={src}
        title={embed.title ?? embed.provider}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture"
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
