import { ImageResponse } from "next/og";
import { ARTIST_CATEGORY_LABELS } from "@presskit/shared";
import { fetchPublicPresskit } from "../../lib/api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lookup = await fetchPublicPresskit(slug);
  const presskit = lookup.status === "found" ? lookup.presskit : null;

  const title = presskit?.artistName ?? "Presskit";
  const subtitle = presskit ? ARTIST_CATEGORY_LABELS[presskit.category] : "";
  const location = presskit ? [presskit.city, presskit.state].filter(Boolean).join(" - ") : "";
  const coverPhoto = presskit?.galleryPhotos[0]?.url;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", padding: 64, position: "relative" }}>
          <span style={{ fontSize: 28, opacity: 0.8, textTransform: "uppercase", letterSpacing: 2 }}>
            {subtitle}
          </span>
          <span style={{ fontSize: 72, fontWeight: 700, marginTop: 12 }}>{title}</span>
          {location && <span style={{ fontSize: 28, opacity: 0.7, marginTop: 12 }}>{location}</span>}
        </div>
      </div>
    ),
    { ...size },
  );
}
