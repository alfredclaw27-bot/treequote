import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.pwa.name,
    short_name: siteConfig.pwa.shortName,
    description: siteConfig.pwa.description,
    start_url: "/",
    display: "standalone",
    background_color: siteConfig.pwa.backgroundColor,
    theme_color: siteConfig.pwa.themeColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
