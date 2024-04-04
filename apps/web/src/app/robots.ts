import { MetadataRoute } from "next";
import { api } from "@/trpc/server";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const projects = await api.project.all();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: [
      "https://craftgen.ai/sitemap.xml",
      ...projects.map(
        (project) => `https://craftgen.ai/projects/${project.id}.xml`,
      ),
    ],
  };
}
