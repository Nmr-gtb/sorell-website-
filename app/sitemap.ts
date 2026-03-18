import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://sorell.fr", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://sorell.fr/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://sorell.fr/demo", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://sorell.fr/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://sorell.fr/login", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://sorell.fr/legal", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://sorell.fr/cgv", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://sorell.fr/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
