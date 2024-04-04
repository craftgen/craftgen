import { BASE_URL } from "@/lib/constants";
import { MetadataRoute } from "next";
import { db } from "@seocraft/supabase/db";

export async function generateSitemaps() {
  // Fetch the total number of products and calculate the number of sitemaps needed
  const projects = await db.query.project.findMany({
    columns: {
      id: true,
    },
  });
  return [...projects.map((project) => ({ id: project.id }))];
}

export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  console.log("GENERETING SITEMAP", id);
  const project = await db.query.project.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    columns: {
      slug: true,
    },
  });
  console.log({ project });
  if (!project) {
    return [];
  }

  const modules = await db.query.workflow.findMany({
    where: (workflow, { eq }) => eq(workflow.projectId, id),
    columns: {
      slug: true,
    },
    // with: {
    //   versions: {
    //     columns: {
    //       version: true,
    //     },
    //   },
    // },
  });

  return [
    ...(project
      ? [
          {
            url: `${BASE_URL}/${project.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 1,
          },
        ]
      : []),
    ...modules.map((module) => ({
      url: `${BASE_URL}/${project.slug}/${module.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
