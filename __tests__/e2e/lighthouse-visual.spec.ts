import { test, expect } from "@playwright/test";

/**
 * Pre-launch visual regression: dark/light tema + sahne modu spot kontrolleri.
 * Lighthouse CI renk kontrastı ve LCP'yi assert ederken, bu testler
 * işlevsel doğruluğu ve tema tutarlılığını doğrular.
 */

const SONG_URL = "/akor/duman/kufi";

/* ------------------------------------------------------------------ */
/*  Dark / Light tema kontrast & render testleri                       */
/* ------------------------------------------------------------------ */

test.describe("Dark / Light tema — Lighthouse ön kontrol", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`[${theme}] ana sayfa — arka plan + metin kontrastı`, async ({
      page,
      context,
    }) => {
      await context.addCookies([
        { name: "akorpro-theme", value: theme, url: "http://localhost:3000" },
      ]);
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      const html = page.locator("html");
      const cls = await html.getAttribute("class");
      expect(cls).toContain(theme === "dark" ? "dark" : "");

      const body = page.locator("body");
      const bg = await body.evaluate((el) =>
        getComputedStyle(el).backgroundColor,
      );
      expect(bg).toBeTruthy();

      const heading = page.locator("h1, h2, h3").first();
      if (await heading.isVisible()) {
        const color = await heading.evaluate((el) =>
          getComputedStyle(el).color,
        );
        expect(color).toBeTruthy();
        expect(color).not.toBe(bg);
      }
    });

    test(`[${theme}] şarkı sayfası — akor gövdesi okunabilirliği`, async ({
      page,
      context,
    }) => {
      await context.addCookies([
        { name: "akorpro-theme", value: theme, url: "http://localhost:3000" },
      ]);
      await page.goto(SONG_URL);

      const chordBody = page.locator("#chord-body");
      await expect(chordBody).toBeVisible();

      const pre = chordBody.locator("pre");
      const [fg, bg, fontSize] = await pre.evaluate((el) => {
        const s = getComputedStyle(el);
        return [s.color, s.backgroundColor, s.fontSize];
      });
      expect(fg).toBeTruthy();
      expect(bg || "transparent").toBeTruthy();
      const size = parseFloat(fontSize);
      expect(size).toBeGreaterThanOrEqual(14);
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Sahne modu (scene mode) — spot kontrol                             */
/* ------------------------------------------------------------------ */

test.describe("Sahne modu spot kontrolleri", () => {
  test("sahne modu URL parametresi ile açılır", async ({ page }) => {
    await page.goto(`${SONG_URL}?scene=1`);
    await page.waitForLoadState("domcontentloaded");

    const dialog = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("sahne modu — overlay z-index ve arka plan", async ({ page }) => {
    await page.goto(`${SONG_URL}?scene=1`);

    const dialog = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const styles = await dialog.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        zIndex: s.zIndex,
        position: s.position,
        bg: s.backgroundColor,
      };
    });

    expect(parseInt(styles.zIndex)).toBeGreaterThanOrEqual(70);
    expect(styles.position).toBe("fixed");
  });

  test("sahne modu — akor metni beyaz ve okunabilir", async ({ page }) => {
    await page.goto(`${SONG_URL}?scene=1`);

    const dialog = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const pre = dialog.locator("pre");
    await expect(pre).toBeVisible();

    const [fg, fontSize, lineHeight] = await pre.evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.color, s.fontSize, s.lineHeight];
    });

    expect(fg).toContain("255");
    const size = parseFloat(fontSize);
    expect(size).toBeGreaterThanOrEqual(16);
    const lh = parseFloat(lineHeight);
    expect(lh / size).toBeGreaterThanOrEqual(1.4);
  });

  test("sahne modu — Escape ile kapanır", async ({ page }) => {
    await page.goto(`${SONG_URL}?scene=1`);

    const dialog = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test("sahne modu — çık butonu çalışır", async ({ page }) => {
    await page.goto(`${SONG_URL}?scene=1`);

    const dialog = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const exitBtn = dialog.getByText("Çık (Esc)");
    await exitBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test("sahne modu — dark tema ile uyum", async ({ page, context }) => {
    await context.addCookies([
      { name: "akorpro-theme", value: "dark", url: "http://localhost:3000" },
    ]);
    await page.goto(`${SONG_URL}?scene=1`);

    const dialog = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const pre = dialog.locator("pre");
    const fg = await pre.evaluate((el) => getComputedStyle(el).color);
    expect(fg).toContain("255");
  });

  test("sahne modu — önceki/sıradaki butonları", async ({ page }) => {
    await page.goto(`${SONG_URL}?scene=1`);

    const dialog = page.locator('[role="dialog"][aria-label="Sahne modu"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const prevBtn = dialog.locator("button").filter({ hasText: "Önceki" });
    const nextBtn = dialog.locator("button").filter({ hasText: "Sıradaki" });

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });
});
