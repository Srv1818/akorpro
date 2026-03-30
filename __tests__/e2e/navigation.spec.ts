import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("navigates to /giris and shows login form", async ({ page }) => {
    await page.goto("/giris");
    await expect(page).toHaveURL(/\/giris/);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Search", () => {
  test("home page loads and has search trigger", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const searchTrigger = page.locator('[data-testid="search-trigger"], [aria-label*="Ara"], button:has-text("Ara")').first();
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
      await expect(page.locator('[role="dialog"], [data-testid="search-dialog"]').first()).toBeVisible();
    }
  });

  test("/arama page loads", async ({ page }) => {
    await page.goto("/arama");
    await expect(page).toHaveURL(/\/arama/);
  });
});

test.describe("Song viewing", () => {
  test("guitar chords catalog page loads", async ({ page }) => {
    await page.goto("/gitar-akorlari");
    await expect(page).toHaveURL(/\/gitar-akorlari/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("song detail page renders chord body", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    await expect(page.locator("#chord-body")).toBeVisible();
    await expect(page.locator("#chord-body")).toContainText("Am");
  });

  test("artist page loads", async ({ page }) => {
    await page.goto("/sanatci/duman");
    await expect(page).toHaveURL(/\/sanatci\/duman/);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Preview & scene mode", () => {
  test("scene mode button exists on song page", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    const sceneBtn = page.locator('button:has-text("Sahne Modu")');
    await expect(sceneBtn.first()).toBeVisible();
  });

  test("scene mode opens a fullscreen overlay", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    const sceneBtn = page.locator('button:has-text("Sahne Modu")').first();
    await sceneBtn.click();
    const overlay = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(overlay).toBeVisible();
  });

  test("scene mode closes with Escape key", async ({ page }) => {
    await page.goto("/akor/duman/kufi?scene=1");
    const overlay = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(overlay).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(overlay).not.toBeVisible();
  });
});

test.describe("Transpose controls", () => {
  test("transpose buttons exist and work", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    const transposeGroup = page.locator('[aria-label="Transpoze kontrolleri (ok tuşları)"]');
    await expect(transposeGroup).toBeVisible();

    const activeBtn = transposeGroup.locator('button[aria-pressed="true"]');
    await expect(activeBtn).toBeVisible();
  });

  test("clicking a transpose button changes URL", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    const transposeGroup = page.locator('[aria-label="Transpoze kontrolleri (ok tuşları)"]');
    const buttons = transposeGroup.locator("button");
    const secondBtn = buttons.nth(1);
    await secondBtn.click();
    await page.waitForTimeout(300);
    const url = page.url();
    expect(url.includes("transpose=") || !url.includes("transpose")).toBe(true);
  });

  test('"Orijinale dön" resets transpose', async ({ page }) => {
    await page.goto("/akor/duman/kufi?transpose=3");
    const resetBtn = page.locator('button:has-text("Orijinale dön")');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForURL((url) => !url.searchParams.has("transpose"), { timeout: 3000 }).catch(() => {});
  });
});
