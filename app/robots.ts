import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/admin", "/admin/", "/admin-login", "/connexion"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
