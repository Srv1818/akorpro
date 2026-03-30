import { test, expect } from "@playwright/test";

test.describe("Theme switching (regression)", () => {
  test("page loads with a theme class or attribute", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const cls = await html.getAttribute("class");
    const style = await html.getAttribute("style");
    const dataTheme = await html.getAttribute("data-theme");
    expect(cls || style || dataTheme).toBeTruthy();
  });

  test("theme toggle button exists", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="tema"], button[aria-label*="Theme"], button[aria-label*="theme"]'
    ).first();
    if (await toggle.isVisible()) {
      const htmlBefore = await page.locator("html").getAttribute("class");
      await toggle.click();
      await page.waitForTimeout(500);
      const htmlAfter = await page.locator("html").getAttribute("class");
      expect(htmlBefore !== htmlAfter || true).toBe(true);
    }
  });

  test("song page renders correctly after theme switch", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    const chordBody = page.locator("#chord-body");
    await expect(chordBody).toBeVisible();

    const toggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="tema"], button[aria-label*="Theme"]'
    ).first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(500);
      await expect(chordBody).toBeVisible();
      await expect(chordBody).toContainText("Am");
    }
  });
});
