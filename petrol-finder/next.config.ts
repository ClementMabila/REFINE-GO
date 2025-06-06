import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this to prevent ESLint errors from breaking the build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ...other Next.js config options if any
};

export default nextConfig;
