const { withContentlayer } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["pg-native"],
    webpackBuildWorker: true,
  },
  transpilePackages: ["@seocraft/core", "@seocraft/api", "@seocraft/supabase"],
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^node:async_hooks$/ }),
      );
    }
    return config;
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
          source: "/:project/settings",
          destination: "/project/:project/settings",
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

module.exports = withContentlayer(nextConfig);
