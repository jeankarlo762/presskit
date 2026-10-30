import type { Metadata } from "next";
import { presskitMetadata, PresskitPageView } from "../../lib/presskitPage";

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return presskitMetadata(slug, "home", await props.searchParams);
}

export default async function PresskitPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  return <PresskitPageView slug={slug} page="home" searchParams={await props.searchParams} />;
}
