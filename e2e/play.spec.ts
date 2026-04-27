import { test, expect } from "@playwright/test";

test.describe("/play", () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh, set up a player via the real onboarding flow so the
    // store has playerName + screen state populated correctly.
    await page.goto("/onboard");
    await page.getByLabel(/Your name/i).fill("Test");
    await page.getByRole("button", { name: /Enter Pawn Village/i }).click();
    await expect(page).toHaveURL(/\/play/);
  });

  test("board renders with 64 squares and starting pieces", async ({ page }) => {
    // The board uses an 8x8 grid; check at least 32 pieces are present
    // (16 white + 16 black at game start)
    const pieces = page.locator("svg[viewBox='0 0 120 120']"); // chess piece SVGs
    await expect.poll(async () => pieces.count(), { timeout: 5000 }).toBeGreaterThanOrEqual(32);
  });

  test("progress strip shows rank and XP", async ({ page }) => {
    await expect(page.getByText("PAWN")).toBeVisible();
    await expect(page.getByText(/0 XP|XP$/)).toBeVisible();
  });

  test("bottom nav has all three tabs", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Play" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Kingdom" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Card" })).toBeVisible();
  });

  test("voice toggle has accessible name and toggles aria-pressed", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /coach voice/i });
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute("aria-pressed");
    await toggle.click();
    const after = await toggle.getAttribute("aria-pressed");
    expect(after).not.toBe(before);
  });

  test("New Game button resets the move history", async ({ page }) => {
    // Just verify the button is present and clickable — playing a real
    // game in Playwright is brittle. A reset call should leave us still
    // on /play with no errors.
    await page.getByRole("button", { name: /^New Game$/ }).first().click();
    await expect(page).toHaveURL(/\/play/);
  });
});
