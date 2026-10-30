import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "دوزوا | همراه سلامت شما",
    short_name: "دوزوا",
    description: "یادآوری دارو، نوبت پزشکی و مدیریت سلامت",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#041B36",
    theme_color: "#041B36",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}