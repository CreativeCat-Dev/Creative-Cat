import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  /*
   * DEL-01C: one canonical `/work/<slug>/cover.png` per project, requested with
   * a stable artwork revision (`lib/artwork.ts`). Next 16 rejects local image
   * sources with a query string unless the exact search value is allowed here.
   * The two entries keep the unversioned hero Cat posters working while the
   * narrow `/work/**` scope leaves every other local path blocked.
   */
  images: {
    localPatterns: [
      { pathname: "/work/**", search: "" },
      { pathname: "/work/**", search: "?v=20261128" },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
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
