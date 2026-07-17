import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/admin", "/admin/", "/admin-login", "/connexion"],
    },
    sitemap: "https://sorell.fr/sitemap.xml",
  };
}
