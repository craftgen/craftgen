import { BASE_URL } from "@/lib/constants";

const publicPages = [
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
];

export async function GET(req: Request) {
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
