import type { MetadataRoute } from "next"

// Manifest PWA, juga dibaca Bubblewrap untuk APK TWA (../android/).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kasir Pusat Belanja",
    short_name: "Kasir",
    description: "Aplikasi kasir outlet Pusat Belanja",
    start_url: "/kasir",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
