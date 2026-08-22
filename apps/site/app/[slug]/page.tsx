import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ARTIST_CATEGORY_LABELS, isBotUserAgent } from "@presskit/shared";
import { PresskitRenderer } from "@presskit/shared/ui";
import { fetchPublicPresskit, recordPresskitView } from "../../lib/api";

const getLookup = cache(async (slug: string) => fetchPublicPresskit(slug));

async function resolvePresskit(slug: string) {
  const lookup = await getLookup(slug);
  if (lookup.status === "not_found") notFound();
  if (lookup.status === "moved") permanentRedirect(`/${lookup.slug}`);
  return lookup.presskit;
}

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const presskit = await resolvePresskit(slug);

  const bioSection = presskit.sections.find((s) => s.type === "BIO");
  const shortBio = (bioSection?.data as { shortBio?: string } | undefined)?.shortBio;

  const title = presskit.ogTitleOverride ?? `${presskit.artistName} — Presskit`;
  const description =
    presskit.ogDescriptionOverride ??
    shortBio ??
    `Presskit de ${presskit.artistName} (${ARTIST_CATEGORY_LABELS[presskit.category]})`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PresskitPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const presskit = await resolvePresskit(slug);

  const headerList = await headers();
  const userAgent = headerList.get("user-agent");

  if (!isBotUserAgent(userAgent)) {
    const trackableCode = typeof searchParams.ref === "string" ? searchParams.ref : undefined;
    await recordPresskitView(
      slug,
      {
        trackableCode,
        referrerUrl: headerList.get("referer") ?? undefined,
        sessionId: crypto.randomUUID(),
        country: headerList.get("x-geo-country") ?? undefined,
      },
      userAgent,
    );
  }

  return <PresskitRenderer presskit={presskit} />;
}
