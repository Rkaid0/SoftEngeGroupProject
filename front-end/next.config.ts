import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", 
  trailingSlash: true,
  distDir: "out", 
  generateBuildId: async () => Date.now().toString(), // cache-buster
};

export default nextConfig;
