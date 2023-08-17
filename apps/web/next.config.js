/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
