import { test, expect } from "@playwright/test";

test.describe("SEO infrastructure", () => {
  test("/robots.txt is served", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("User-agent: *");
    expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  test("/sitemap.xml lists the marketing routes", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    for (const route of ["/onboard", "/journey", "/how-it-works", "/play", "/kingdom", "/card"]) {
      expect(body).toContain(route);
    }
  });

  test("landing page has Open Graph + structured data", async ({ page }) => {
    await page.goto("/");
    const og = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(og).toContain("ChessWhiz");
    const twitter = await page.locator('meta[name="twitter:card"]').getAttribute("content");
    expect(twitter).toBe("summary_large_image");
    // JSON-LD SoftwareApplication
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toContain("SoftwareApplication");
    expect(jsonLd).toContain("ChessWhiz");
  });

  test("commit SHA meta tag is exposed", async ({ page }) => {
    await page.goto("/");
    const sha = await page.locator('meta[name="chesswhiz-version"]').getAttribute("content");
    expect(sha).toBeTruthy();
    expect(sha!.length).toBeGreaterThan(0);
  });
});
