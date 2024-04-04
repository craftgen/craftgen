import { BASE_URL } from "@/lib/constants";
import { MetadataRoute } from "next";
import { api } from "@/trpc/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [integrations] = await Promise.all([api.public.integration.list({})]);

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    // TODO:  add blog pages.
    {
      url: `${BASE_URL}/integrations`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...integrations.map((integration) => ({
      url: `${BASE_URL}/integration/${integration.slug}`,
      lastModified: integration.dateUpdated!,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
