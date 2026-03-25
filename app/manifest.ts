import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suraki",
    short_name: "Suraki",
    description: "Wildlife and nature incident reporting app",
    start_url: "/",
    display: "standalone",
    background_color: "#0B3D2E",
    theme_color: "#0B3D2E",
    orientation: "portrait",
    icons: [
      {
        src: "/image2.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/image.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/image.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}