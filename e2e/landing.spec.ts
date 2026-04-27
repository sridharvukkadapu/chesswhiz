import { test, expect } from "@playwright/test";

test.describe("/", () => {
  test("renders hero and key marketing sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ChessWhiz");
    await expect(page.getByText("Every move is a lesson")).toBeVisible();
    // Section headings — the marketing structure
    await expect(page.getByText("Coach Pawn talks back")).toBeVisible();
    await expect(page.getByText("An adventure from Pawn to King")).toBeVisible();
    await expect(page.getByText("The moment that matters most")).toBeVisible();
  });

  test("primary CTA navigates to onboard", async ({ page }) => {
    await page.goto("/");
    // First "Start playing free" CTA in the hero
    await page.getByRole("link", { name: /Start playing free/i }).first().click();
    await expect(page).toHaveURL(/\/onboard/);
  });

  test("FAQ items expand on click", async ({ page }) => {
    await page.goto("/");
    const firstFaq = page.getByRole("button", { name: /How does the progression system work/i });
    await firstFaq.scrollIntoViewIfNeeded();
    await firstFaq.click();
    await expect(page.getByText(/7 regions of the Chess Kingdom/i)).toBeVisible();
  });

  test("footer links resolve to the correct routes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /^Privacy$/ }).click();
    await expect(page).toHaveURL(/\/privacy/);
    await page.goBack();
    await page.getByRole("link", { name: /^Terms$/ }).click();
    await expect(page).toHaveURL(/\/terms/);
  });
});
