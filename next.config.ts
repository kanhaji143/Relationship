import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app",
  assetPrefix: "/app",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Local dev is sometimes opened via 127.0.0.1; allow its HMR/dev assets.
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
