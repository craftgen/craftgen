import { db } from "@craftgen/db/db";

import { BASE_URL } from "@/lib/constants";

export async function GET(req: Request) {
  const workflows = await db.query.workflow.findMany({
    where: (workflow, { eq }) => eq(workflow.public, true),
    columns: {
      id: true,
      slug: true,
    },
    with: {
      project: {
        columns: {
          slug: true,
        },
      },
    },
  });
  const publicPages = [
    ...workflows.map((workflow) => ({
      url: `${BASE_URL}/${workflow.project.slug}/${workflow.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];

  const xml = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicPages
  .map(
    (item) => `
  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified.toISOString()}</lastmod>
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority}</priority>
  </url>
`,
  )
  .join("\n")}
</urlset>  
  `;
  const response = new Response(xml, {
    status: 200,
    statusText: "ok",
  });

  response.headers.append("content-type", "text/xml");

  return response;
}
