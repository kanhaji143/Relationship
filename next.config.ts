import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
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
