import type { MetadataRoute } from "next";

/**
 * The web app manifest — what makes Milagro Universe installable.
 *
 * Served at /manifest.webmanifest by Next's metadata route. `display: standalone`
 * launches it chromeless like an app; the maskable icon lets Android crop it to
 * the platform's shape without clipping the mark.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Milagro Universe — Bathroom Planner",
    short_name: "Milagro",
    description:
      "Plan, visualize, estimate and build your bathroom in one place — measurements to layouts, styles, material lists and costed plans.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf8f4",
    theme_color: "#faf8f4",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
