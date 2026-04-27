import type { MetadataRoute } from "next";

const BASE = "https://chesswhiz.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Static marketing + tool pages. /play / /kingdom etc. are dynamic
  // app surfaces — listing them ensures they're crawlable for direct
  // shares but they're not the primary indexable content.
  return [
    { url: `${BASE}/`,             lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/onboard`,      lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/journey`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/play`,         lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/kingdom`,      lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/card`,         lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/privacy`,      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
