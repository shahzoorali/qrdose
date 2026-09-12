import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server build for Docker/ECS deployment.
  output: "standalone",
  // Native module (prebuilt binary) used to render printable cards —
  // must run as-is on the server, not get bundled through webpack.
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
