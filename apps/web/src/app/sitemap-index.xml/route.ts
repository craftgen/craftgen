import { BASE_URL } from "@/lib/constants";

export const sitemaps = [
  {
    url: `${BASE_URL}/sitemap-public.xml`,
  },
  {
    url: `${BASE_URL}/integrations/sitemap.xml`,
  },
  {
    url: `${BASE_URL}/projects/sitemap.xml`,
  },
  {
    url: `${BASE_URL}/workflows/sitemap.xml`,
  },
];

export async function GET(req: Request) {
  const xml = `
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (item) => `
  <sitemap>
    <loc>${item.url}</loc>
  </sitemap>
`,
  )
  .join("\n")}
</sitemapindex>

  `;
  const response = new Response(xml, {
    status: 200,
    statusText: "ok",
  });

  response.headers.append("content-type", "text/xml");

  return response;
}
