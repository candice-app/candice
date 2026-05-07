import type { MetadataRoute } from "next";
import { BASE_URL } from "./metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/contacts/", "/moi/", "/historique/", "/idees/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
