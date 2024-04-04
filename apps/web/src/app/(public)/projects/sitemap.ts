import { BASE_URL } from "@/lib/constants";
import { MetadataRoute } from "next";
import { api } from "@/trpc/server";

export async function generateSitemaps() {
  // Fetch the total number of products and calculate the number of sitemaps needed
  const projects = await api.project.all();
  return [{ id: 0 }, ...projects.map((project) => ({ id: project.id }))];
}

export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  const project = await api.project.byId({ id });
  const modules = await api.craft.module.list({
    projectId: id,
  });

  return [
    ...(project
      ? [
          {
            url: `${BASE_URL}/${project?.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 1,
          },
        ]
      : []),
    ...modules.map((module) => ({
      url: `${BASE_URL}/${module.project.slug}/${module.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
