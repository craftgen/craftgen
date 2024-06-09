import createMDX from "fumadocs-mdx/config";
import { remarkImage } from "fumadocs-core/mdx-plugins";

const withMDX = createMDX({
  cwd: "./src",
  mdxOptions: {
    lastModifiedTime: "git",
    remarkPlugins: [remarkImage],
  },
});

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
  transpilePackages: [
    "@seocraft/core",
    "@seocraft/api",
    "@seocraft/supabase",
    "@craftgen/ui",
  ],
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      return config;
    }
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = config.resolve.fallback ?? {};

    config.plugins.push(
      // Remove node: from import specifiers, because Next.js does not yet support node: scheme
      // https://github.com/vercel/next.js/issues/28774
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );

    // async hooks is not available in the browser:
    config.resolve.fallback.async_hooks = false;
    return config;
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
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
          destination: "https://discord.gg/Qvm4wehMeK",
        },
        {
          source: "/ingest/:path*",
          destination: "https://app.posthog.com/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default withMDX(nextConfig);
