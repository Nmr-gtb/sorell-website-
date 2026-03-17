import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  bundlePagesRouterDependencies: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
