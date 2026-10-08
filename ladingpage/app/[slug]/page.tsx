import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { ARTIST_CATEGORY_LABELS, isBotUserAgent } from "@presskit/shared";
import { PresskitRenderer } from "@presskit/shared/ui";
import { fetchPublicPresskit, recordPresskitView } from "../../lib/api";
import { FONT_CLASS_NAME } from "../../lib/fonts";

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
    // Everything the analytics call needs is read from headers() HERE —
    // Server Components can't touch request APIs inside after(). The view
    // is then recorded once the response is out the door, so a slow or
    // down API never delays the page itself.
    const view = {
      trackableCode,
      referrerUrl: headerList.get("referer") ?? undefined,
      sessionId: headerList.get("x-session-id") ?? crypto.randomUUID(),
      country: headerList.get("x-geo-country") ?? undefined,
    };
    after(() => recordPresskitView(slug, view, userAgent));
  }

  return (
    <div className={FONT_CLASS_NAME[presskit.themeFontKey]}>
      <PresskitRenderer presskit={presskit} />
    </div>
  );
}
