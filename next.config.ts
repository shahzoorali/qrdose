import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server build for Docker/ECS deployment.
  output: "standalone",
};

export default nextConfig;
