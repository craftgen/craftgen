import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cards } from "fumadocs-ui/components/card";
import { DocsBody, DocsPage } from "fumadocs-ui/page";
import { ExternalLinkIcon } from "lucide-react";

import { getPage, getPages } from "@/app/source";
import { BASE_URL } from "@/utils/constants";

export default function Page({ params }: { params: { slug?: string[] } }) {
  const page = getPage(params.slug);

  if (page == null) {
    notFound();
  }

  const MDX = page.data.exports.default;
  const path = `apps/web/src/content/docs/${page.file.path}`;

  return (
    <DocsPage
      toc={page.data.exports.toc}
      lastUpdate={page.data.exports.lastModified}
      tableOfContent={{
        enabled: page.data.toc,
        footer: (
          <a
            href={`https://github.com/craftgen/craftgen/blob/main/${path}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Edit on Github <ExternalLinkIcon className="h-4 w-4" />
          </a>
        ),
      }}
    >
      <DocsBody>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {page.data.title}
        </h1>

        <p className="mb-8 text-lg text-muted-foreground">
          {page.data.description}
        </p>
        {page.data.index ? <Category page={page} /> : <MDX />}
      </DocsBody>
    </DocsPage>
  );
}

function Category({ page }: { page: Page }): React.ReactElement {
  const filtered = utils
    .getPages()
    .filter(
      (item) =>
        item.file.dirname === page.file.dirname && item.file.name !== "index",
    );

  return (
    <Cards>
      {filtered.map((item) => (
        <Card
          key={item.url}
          title={item.data.title}
          description={item.data.description ?? "No Description"}
          href={item.url}
        />
      ))}
    </Cards>
  );
}

export async function generateStaticParams() {
  return getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const page = getPage(params.slug);

  if (page == null) notFound();
  const imageParams = new URLSearchParams();

  const description =
    page.data.description ?? "Craftgen AI Agent Building Platform";

  imageParams.set("title", page.data.title);
  imageParams.set("description", description);

  const image = {
    alt: "Banner",
    url: `${BASE_URL}/api/og/craftgen?${imageParams.toString()}`,
    width: 1200,
    height: 630,
  };

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      url: `/docs/${page.slugs.join("/")}`,
      images: image,
    },
    twitter: {
      images: image,
    },
  } satisfies Metadata;
}
