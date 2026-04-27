import { test, expect } from "@playwright/test";

test.describe("/onboard", () => {
  test("CTA is disabled until a name is entered", async ({ page }) => {
    await page.goto("/onboard");
    const cta = page.getByRole("button", { name: /Type your name to begin/i });
    await expect(cta).toBeDisabled();
  });

  test("CTA personalizes once a name is typed and quest preview appears", async ({ page }) => {
    await page.goto("/onboard");
    await page.getByLabel(/Your name/i).fill("Aarav");
    await expect(page.getByRole("button", { name: /Enter Pawn Village, Aarav/i })).toBeEnabled();
    // Step 04 quest preview shows up
    await expect(page.getByText(/Your quest begins in/i)).toBeVisible();
    await expect(page.getByText("Pawn Village")).toBeVisible();
  });

  test("name input is clamped to 24 characters", async ({ page }) => {
    await page.goto("/onboard");
    const long = "ThisNameIsWayTooLongAndShouldGetClamped";
    await page.getByLabel(/Your name/i).fill(long);
    const value = await page.getByLabel(/Your name/i).inputValue();
    expect(value.length).toBeLessThanOrEqual(24);
  });

  test("submitting routes to /play", async ({ page }) => {
    await page.goto("/onboard");
    await page.getByLabel(/Your name/i).fill("Maya");
    await page.getByRole("button", { name: /Enter Pawn Village/i }).click();
    await expect(page).toHaveURL(/\/play/);
  });
});
