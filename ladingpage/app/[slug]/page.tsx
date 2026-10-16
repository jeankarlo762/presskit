import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import {
  ARTIST_CATEGORY_LABELS,
  ARTIST_CATEGORY_LABELS_EN,
  isBotUserAgent,
  resolveLanguage,
  type PresskitLanguage,
} from "@presskit/shared";
import { PresskitRenderer } from "@presskit/shared/ui";
import { fetchPublicPresskit, recordPresskitView } from "../../lib/api";
import { FONT_FAMILY } from "../../lib/fonts";
import { ClickTracker } from "../../components/presskit/ClickTracker";

const getLookup = cache(async (slug: string) => fetchPublicPresskit(slug));

async function resolvePresskit(slug: string) {
  const lookup = await getLookup(slug);
  if (lookup.status === "not_found") notFound();
  if (lookup.status === "moved") permanentRedirect(`/${lookup.slug}`);
  return lookup.presskit;
}

function pickLanguage(searchParams: Record<string, string | string[] | undefined>, offered: string[] | undefined) {
  const requested = typeof searchParams.lang === "string" ? searchParams.lang : undefined;
  return resolveLanguage(requested, offered ?? ["pt"]);
}

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const presskit = await resolvePresskit(slug);
  const lang = pickLanguage(searchParams, presskit.languages);

  const bioSection = presskit.sections.find((s) => s.type === "BIO");
  const bio = bioSection?.data as { shortBio?: string } | undefined;
  const bioEn = bioSection?.dataEn as { shortBio?: string } | undefined;
  const shortBio = (lang === "en" ? bioEn?.shortBio : undefined) || bio?.shortBio;
  const categoryLabel = (lang === "en" ? ARTIST_CATEGORY_LABELS_EN : ARTIST_CATEGORY_LABELS)[presskit.category];

  const title = presskit.ogTitleOverride ?? `${presskit.artistName} — Presskit`;
  const description =
    presskit.ogDescriptionOverride ??
    shortBio ??
    (lang === "en" ? `${presskit.artistName}'s presskit (${categoryLabel})` : `Presskit de ${presskit.artistName} (${categoryLabel})`);

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
    ...(presskit.languages?.includes("en")
      ? { alternates: { languages: { "pt-BR": `/${slug}`, en: `/${slug}?lang=en` } } }
      : {}),
  };
}

export default async function PresskitPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const presskit = await resolvePresskit(slug);
  const lang = pickLanguage(searchParams, presskit.languages);

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

  // On an artist's own domain the page lives at "/", so the language switch
  // must not point back at /<slug>.
  const onCustomDomain = headerList.get("x-custom-domain") === "1";
  const basePath = onCustomDomain ? "/" : `/${slug}`;
  const languageHref = (target: PresskitLanguage) => (target === "en" ? `${basePath}?lang=en` : basePath);

  return (
    <>
      <ClickTracker slug={slug} />
      <PresskitRenderer presskit={presskit} fontFamilies={FONT_FAMILY} lang={lang} languageHref={languageHref} />
    </>
  );
}
