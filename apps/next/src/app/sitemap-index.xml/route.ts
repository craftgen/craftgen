import { sitemaps } from "@/utils/constants";

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
