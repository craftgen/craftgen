import { MetadataRoute } from "next";
import { sitemaps } from "./sitemap-index.xml/route";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: [...sitemaps.map((sitemap) => sitemap.url)],
  };
}
