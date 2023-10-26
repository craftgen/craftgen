/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ["pg-native"],
  },
  transpilePackages: ["@seocraft/core"],
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
      afterFiles: [
        {
          source: "/:project",
          destination: "/project/:project",
        },
        {
          source: "/:project/settings/:path*",
          destination: "/project/:project/settings/:path*",
        },
      ],
      fallback: [
        {
          source: "/:project/:playground/:path*",
          destination: "/project/:project/playground/:playground/:path*",
        },
        // {
        //   source: "/ingest/:path*",
        //   destination: "https://app.posthog.com/:path*",
        // },
      ],
    };
  },
};

module.exports = nextConfig;
