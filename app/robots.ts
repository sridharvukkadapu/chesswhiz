import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/parent", "/api/"],
      },
    ],
    sitemap: "https://chesswhiz.vercel.app/sitemap.xml",
    host: "https://chesswhiz.vercel.app",
  };
}
