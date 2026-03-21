import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();

  return [
    { url: `${appUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
