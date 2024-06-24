export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

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
