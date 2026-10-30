import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import {
  ARTIST_CATEGORY_LABELS,
  ARTIST_CATEGORY_LABELS_EN,
  PUBLIC_STRINGS,
  isBotUserAgent,
  isMultiPageTemplate,
  resolveLanguage,
  type PresskitLanguage,
  type PresskitPage,
} from "@presskit/shared";
import { PresskitRenderer } from "@presskit/shared/ui";
import { fetchPublicPresskit, recordPresskitView } from "./api";
import { PUBLIC_SITE_URL } from "./urls";
import { FONT_FAMILY } from "./fonts";
import { ClickTracker } from "../components/presskit/ClickTracker";

type SearchParams = Record<string, string | string[] | undefined>;

const getLookup = cache(async (slug: string) => fetchPublicPresskit(slug));

async function resolvePresskit(slug: string, page: PresskitPage) {
  const lookup = await getLookup(slug);
  if (lookup.status === "not_found") notFound();
  if (lookup.status === "moved") permanentRedirect(page === "home" ? `/${lookup.slug}` : `/${lookup.slug}/${page}`);
  // Only Palco is split into pages; on the other templates the inner page
  // URLs don't exist.
  if (page !== "home" && !isMultiPageTemplate(lookup.presskit.templateKey)) notFound();
  return lookup.presskit;
}

function pickLanguage(searchParams: SearchParams, offered: string[] | undefined) {
  const requested = typeof searchParams.lang === "string" ? searchParams.lang : undefined;
  return resolveLanguage(requested, offered ?? ["pt"]);
}

const PAGE_TITLE_KEY: Record<Exclude<PresskitPage, "home">, string> = {
  musicas: "pageMusic",
  agenda: "pageAgenda",
  midia: "pageMedia",
};

export async function presskitMetadata(slug: string, page: PresskitPage, searchParams: SearchParams): Promise<Metadata> {
  const presskit = await resolvePresskit(slug, page);
  const lang = pickLanguage(searchParams, presskit.languages);

  const bioSection = presskit.sections.find((s) => s.type === "BIO");
  const bio = bioSection?.data as { shortBio?: string } | undefined;
  const bioEn = bioSection?.dataEn as { shortBio?: string } | undefined;
  const shortBio = (lang === "en" ? bioEn?.shortBio : undefined) || bio?.shortBio;
  const categoryLabel = (lang === "en" ? ARTIST_CATEGORY_LABELS_EN : ARTIST_CATEGORY_LABELS)[presskit.category];

  const isAgency = presskit.kind === "AGENCY";
  const homeTitle =
    presskit.ogTitleOverride ?? (isAgency ? `${presskit.artistName} — Artistas` : `${presskit.artistName} — Presskit`);
  const title =
    page === "home" ? homeTitle : `${PUBLIC_STRINGS[lang]![PAGE_TITLE_KEY[page]]} — ${presskit.artistName}`;
  const description =
    presskit.ogDescriptionOverride ??
    shortBio ??
    (lang === "en" ? `${presskit.artistName}'s presskit (${categoryLabel})` : `Presskit de ${presskit.artistName} (${categoryLabel})`);
  const path = page === "home" ? `/${slug}` : `/${slug}/${page}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
    ...(presskit.languages?.includes("en")
      ? { alternates: { languages: { "pt-BR": path, en: `${path}?lang=en` } } }
      : {}),
  };
}

export async function PresskitPageView({
  slug,
  page,
  searchParams,
}: {
  slug: string;
  page: PresskitPage;
  searchParams: SearchParams;
}) {
  const presskit = await resolvePresskit(slug, page);
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

  // On an artist's own domain the site lives at "/", so links must not
  // point back at /<slug>.
  const onCustomDomain = headerList.get("x-custom-domain") === "1";
  const root = onCustomDomain ? "" : `/${slug}`;
  const pagePath = (target: PresskitPage) => (target === "home" ? root || "/" : `${root}/${target}`);
  const withLang = (path: string) => (lang === "en" ? `${path}?lang=en` : path);
  const languageHref = (target: PresskitLanguage) => {
    const path = pagePath(page);
    return target === "en" ? `${path}?lang=en` : path;
  };

  return (
    <>
      <ClickTracker slug={slug} />
      <PresskitRenderer
        presskit={presskit}
        fontFamilies={FONT_FAMILY}
        lang={lang}
        languageHref={languageHref}
        siteBaseUrl={onCustomDomain ? PUBLIC_SITE_URL : ""}
        page={page}
        pageHref={isMultiPageTemplate(presskit.templateKey) ? (target) => withLang(pagePath(target)) : undefined}
      />
    </>
  );
}
