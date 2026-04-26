import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Marketing pages iterate frequently; tell the CDN to revalidate
    // every 60s with stale-while-revalidate so deploys propagate fast
    // without sacrificing edge performance.
    const marketingCache = [
      { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=30" },
    ];
    return [
      { source: "/",              headers: marketingCache },
      { source: "/onboard",       headers: marketingCache },
      { source: "/journey",       headers: marketingCache },
      { source: "/how-it-works",  headers: marketingCache },
      { source: "/privacy",       headers: marketingCache },
      { source: "/terms",         headers: marketingCache },
    ];
  },
};

export default nextConfig;
