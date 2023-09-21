/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    unoptimized: true,
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/@:username",
          destination: "/user/:username",
        },
        {
          source: "/discord",
          destination: "https://discord.gg/c5tyy982V5",
        },
      ],
      fallback: [
        {
          source: "/ingest/:path*",
          destination: "https://app.posthog.com/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
