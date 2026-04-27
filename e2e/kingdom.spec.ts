import { test, expect } from "@playwright/test";

test.describe("/kingdom", () => {
  test("renders the world map with all 7 region names", async ({ page }) => {
    await page.goto("/kingdom");
    await expect(page.getByText("The Chess Kingdom")).toBeVisible();
    for (const name of [
      "Pawn Village",
      "Fork Forest",
      "Pin Palace",
      "Skewer Spire",
      "Discovery Depths",
      "Strategy Summit",
      "Endgame Throne",
    ]) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test("locked region opens upgrade modal on click", async ({ page }) => {
    await page.goto("/kingdom");
    // Tap Fork Forest — it's tier-locked for free users (default tier)
    const forkForestNode = page.getByRole("button", { name: /Fork Forest.*locked/i });
    await forkForestNode.click();
    await expect(page.getByRole("dialog", { name: /Upgrade to Champion/i })).toBeVisible();
    await expect(page.getByText(/Fork Forest awaits/i)).toBeVisible();
  });

  test("upgrade modal closes on Escape", async ({ page }) => {
    await page.goto("/kingdom");
    const forkForestNode = page.getByRole("button", { name: /Fork Forest.*locked/i });
    await forkForestNode.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("direct URL to a tier-locked kingdom bounces to the map", async ({ page }) => {
    await page.goto("/kingdom/fork_forest");
    // We bounce to /kingdom?upgrade=fork_forest, then strip the query
    await expect(page).toHaveURL(/\/kingdom(?!\/)/);
    // Modal should be open
    await expect(page.getByRole("dialog", { name: /Upgrade to Champion/i })).toBeVisible();
  });
});
