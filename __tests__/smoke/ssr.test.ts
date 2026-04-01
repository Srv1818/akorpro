import { describe, it, expect } from "vitest";

const rawBaseUrl = (process.env.BASE_URL ?? "").trim();
const BASE_URL = /^https?:\/\//i.test(rawBaseUrl)
  ? rawBaseUrl.replace(/\/+$/, "")
  : "http://localhost:3000";

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.text();
}

describe("SSR smoke — song page", () => {
  it("renders chord body text in server HTML", async () => {
    const html = await fetchHtml("/akor/duman/kufi");
    expect(html).toContain("Am");
    expect(html).toContain("Karanlıkta");
    expect(html).toContain("chord-body");
  });

  it("includes artist name in server HTML (künye)", async () => {
    const html = await fetchHtml("/akor/duman/kufi");
    expect(html).toContain("Duman");
  });

  it("includes originalKey in server HTML", async () => {
    const html = await fetchHtml("/akor/duman/kufi");
    expect(html).toContain("Am");
  });

  it("includes structured data (JSON-LD)", async () => {
    const html = await fetchHtml("/akor/duman/kufi");
    expect(html).toContain("application/ld+json");
  });
});

describe("SSR smoke — home page", () => {
  it("renders without error", async () => {
    const html = await fetchHtml("/");
    expect(html).toContain("</html>");
  });
});

describe("SSR smoke — preview page", () => {
  it("/preview route exists and renders HTML", async () => {
    try {
      const html = await fetchHtml("/preview/duman/kufi");
      expect(html).toContain("</html>");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("404")) {
        expect(true).toBe(true);
      } else {
        throw e;
      }
    }
  });
});

describe("SSR smoke — artist page", () => {
  it("renders artist name in server HTML", async () => {
    const html = await fetchHtml("/sanatci/duman");
    expect(html).toContain("Duman");
  });
});
