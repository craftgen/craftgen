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
  // headers: async () => {
  //   return [
  //     {
  //       // matching all API routes
  //       source: "/:path*",
  //       headers: [
  //         { key: "Access-Control-Allow-Credentials", value: "true" },
  //         { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
  //         {
  //           key: "Access-Control-Allow-Methods",
  //           value: "GET,DELETE,PATCH,POST,PUT",
  //         },
  //         {
  //           key: "Access-Control-Allow-Headers",
  //           value:
  //             "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  //         },
  //       ],
  //     },
  //   ];
  // },
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
