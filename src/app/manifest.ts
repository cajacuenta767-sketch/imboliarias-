import type { MetadataRoute } from "next";
import { getSettings } from "@/server/modules/settings/service";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  return {
    name: s.site_name,
    short_name: s.site_name,
    description: s.site_description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: s.primary_color || "#0f766e",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
