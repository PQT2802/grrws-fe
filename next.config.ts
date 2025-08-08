import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    // Disable type checking during production build
    ignoreBuildErrors: true,
  },
  // ...other existing config
};

export default nextConfig;
