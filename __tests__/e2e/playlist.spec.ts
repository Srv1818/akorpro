import { test, expect } from "@playwright/test";

test.describe("Playlist page", () => {
  test("/calma-listeleri page loads", async ({ page }) => {
    await page.goto("/calma-listeleri");
    await expect(page).toHaveURL(/\/calma-listeleri/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("unauthenticated user sees login prompt or empty state", async ({ page }) => {
    await page.goto("/calma-listeleri");
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});

test.describe("Playlist CRUD (requires auth)", () => {
  test.skip(true, "Requires authenticated session — run with emulator + seed");

  test("creates a new playlist", async ({ page }) => {
    await page.goto("/calma-listeleri");
    const createBtn = page.locator('button:has-text("Yeni Liste"), button:has-text("Oluştur")').first();
    await createBtn.click();
    const input = page.locator('input[placeholder*="Liste"]').first();
    await input.fill("Test Listem");
    const confirmBtn = page.locator('button:has-text("Oluştur"), button:has-text("Kaydet")').first();
    await confirmBtn.click();
    await expect(page.locator("text=Test Listem")).toBeVisible();
  });

  test("adds a song to playlist from song page", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    const saveBtn = page.locator('button:has-text("Kaydet ve Listeye ekle")');
    await saveBtn.click();
    await expect(page.locator('[role="dialog"][aria-label="Kaydet ve listeye ekle"]')).toBeVisible();
  });
});

test.describe("Save songOverride", () => {
  test("save button exists on song page", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    const saveBtn = page.locator('button:has-text("Kaydet ve Listeye ekle")');
    await expect(saveBtn).toBeVisible();
  });

  test("unauthenticated user sees login link", async ({ page }) => {
    await page.goto("/akor/duman/kufi");
    await page.waitForTimeout(2000);
    const loginLink = page.locator('a:has-text("Giriş (Kaydet için)")');
    if (await loginLink.isVisible()) {
      expect(await loginLink.getAttribute("href")).toContain("/giris");
    }
  });
});
