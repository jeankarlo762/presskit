import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPresskitSubpage } from "@presskit/shared";
import { presskitMetadata, PresskitPageView } from "../../../lib/presskitPage";

/** Palco's inner pages: /<slug>/musicas, /<slug>/agenda, /<slug>/midia. */
export async function generateMetadata(props: PageProps<"/[slug]/[page]">): Promise<Metadata> {
  const { slug, page } = await props.params;
  if (!isPresskitSubpage(page)) notFound();
  return presskitMetadata(slug, page, await props.searchParams);
}

export default async function PresskitSubpage(props: PageProps<"/[slug]/[page]">) {
  const { slug, page } = await props.params;
  if (!isPresskitSubpage(page)) notFound();
  return <PresskitPageView slug={slug} page={page} searchParams={await props.searchParams} />;
}
