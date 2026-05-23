import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "uploads.mangadex.org" },
      { protocol: "https", hostname: "**.mangadex.network" },
      { protocol: "https", hostname: "**.comick.pictures" },
      { protocol: "https", hostname: "**.comick.fun" },
      { protocol: "https", hostname: "**.comick.io" },
      { protocol: "https", hostname: "weebcentral.com" },
      { protocol: "https", hostname: "**.weebcentral.com" },
      { protocol: "https", hostname: "**.officialcdn.app" },
      { protocol: "https", hostname: "asurascans.com" },
      { protocol: "https", hostname: "**.asurascans.com" },
      { protocol: "https", hostname: "asuracomic.net" },
      { protocol: "https", hostname: "**.asuracomic.net" },
    ],
  },
};

export default nextConfig;
