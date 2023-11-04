/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverComponentsExternalPackages: ["pg-native"],
  },
  transpilePackages: ["@seocraft/core", "@seocraft/api", "@seocraft/supabase"],
  images: {
    unoptimized: true,
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/discord",
          destination: "https://discord.gg/c5tyy982V5",
        },
        {
          source: "/ingest/:path*",
          destination: "https://app.posthog.com/:path*",
        },
      ],
      afterFiles: [],
      fallback: [
        {
          source: "/:project",
          destination: "/project/:project",
        },
        {
          source: "/:project/settings/:path*",
          destination: "/project/:project/settings/:path*",
        },
        {
          source: "/:project/:playground/:path*",
          destination: "/project/:project/playground/:playground/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
