import { expect, test } from "@playwright/test";

const REPRESENTATIVE_ROUTES = [
  {
    path: "/",
    expectedOgType: "website",
    expectedCanonicalSuffix: "/",
  },
  {
    path: "/article/spider-silk-hierarchical-protein-mechanics?measure=600",
    expectedOgType: "article",
    expectedCanonicalSuffix:
      "/article/spider-silk-hierarchical-protein-mechanics",
  },
  {
    path: "/topics",
    expectedOgType: "website",
    expectedCanonicalSuffix: "/topics",
  },
  {
    path: "/topics/chemistry?sub=bioinorganic-chemistry",
    expectedOgType: "website",
    expectedCanonicalSuffix: "/topics/chemistry",
  },
  {
    path: "/search?q=spidroin",
    expectedOgType: "website",
    expectedCanonicalSuffix: "/search",
  },
  {
    path: "/about",
    expectedOgType: "website",
    expectedCanonicalSuffix: "/about",
  },
] as const;

test.describe("Group E: M1–M7 Technical SEO, Head Uniqueness, Sitemap/Robots/Ads.txt & 404 Isolation", () => {
  for (const route of REPRESENTATIVE_ROUTES) {
    test(`rendered head on ${route.path} has unique meta tags, canonical URL, noindex, and zero default third-party tracking scripts`, async ({
      page,
    }) => {
      const response = await page.goto(route.path, {
        waitUntil: "networkidle",
      });
      expect(response?.status()).toBe(200);

      const headAudit = await page.evaluate(() => {
        const qHead = (sel: string) =>
          Array.from(document.head.querySelectorAll(sel));
        const qDoc = (sel: string) =>
          Array.from(document.querySelectorAll(sel));

        return {
          headTitleCount: qHead("title").length,
          docTitleCount: qDoc("title").length,
          titleText: document.title,
          headDescriptionCount: qHead('meta[name="description"]').length,
          docDescriptionCount: qDoc('meta[name="description"]').length,
          descriptionContent:
            document
              .querySelector('meta[name="description"]')
              ?.getAttribute("content") ?? "",
          ogTypeCount: qDoc('meta[property="og:type"]').length,
          ogTypeContent:
            document
              .querySelector('meta[property="og:type"]')
              ?.getAttribute("content") ?? "",
          ogTitleCount: qDoc('meta[property="og:title"]').length,
          ogDescriptionCount: qDoc('meta[property="og:description"]').length,
          twitterTitleCount: qDoc('meta[name="twitter:title"]').length,
          twitterDescriptionCount: qDoc(
            'meta[name="twitter:description"]'
          ).length,
          canonicalCount: qDoc('link[rel="canonical"]').length,
          canonicalHref:
            document
              .querySelector('link[rel="canonical"]')
              ?.getAttribute("href") ?? "",
          robotsCount: qDoc('meta[name="robots"]').length,
          robotsContent:
            document
              .querySelector('meta[name="robots"]')
              ?.getAttribute("content") ?? "",
          googleScripts: Array.from(document.querySelectorAll("script[src]"))
            .map((s) => s.getAttribute("src") ?? "")
            .filter(
              (src) =>
                src.includes("googletagmanager.com") ||
                src.includes("googlesyndication.com") ||
                src.includes("google-analytics.com")
            ),
        };
      });

      expect(headAudit.headTitleCount).toBe(1);
      expect(headAudit.docTitleCount).toBe(1);
      expect(headAudit.titleText.length).toBeGreaterThan(5);
      expect(headAudit.headDescriptionCount).toBe(1);
      expect(headAudit.docDescriptionCount).toBe(1);
      expect(headAudit.descriptionContent.length).toBeGreaterThan(20);
      expect(headAudit.ogTypeCount).toBe(1);
      expect(headAudit.ogTypeContent).toBe(route.expectedOgType);
      expect(headAudit.ogTitleCount).toBe(1);
      expect(headAudit.ogDescriptionCount).toBe(1);
      expect(headAudit.twitterTitleCount).toBe(1);
      expect(headAudit.twitterDescriptionCount).toBe(1);
      expect(headAudit.canonicalCount).toBe(1);
      expect(headAudit.canonicalHref.endsWith(route.expectedCanonicalSuffix)).toBe(
        true
      );
      expect(headAudit.canonicalHref.includes("?")).toBe(false);
      expect(headAudit.robotsCount).toBe(1);
      expect(headAudit.robotsContent).toContain("noindex");
      expect(headAudit.robotsContent).toContain("nofollow");
      expect(headAudit.googleScripts).toEqual([]);
    });
  }

  test("/robots.txt, /sitemap.xml, and /ads.txt serve safe fail-closed responses in default Stage A mode", async ({
    request,
  }) => {
    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain("User-Agent: *");
    expect(robotsText).toContain("Disallow: /");

    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const sitemapText = await sitemapRes.text();
    // Must not leak demo article slugs or internal search URLs in Stage A
    expect(sitemapText).not.toContain(
      "spider-silk-hierarchical-protein-mechanics"
    );
    expect(sitemapText).not.toContain("/search");

    const adsRes = await request.get("/ads.txt");
    expect(adsRes.status()).toBe(200);
    expect(adsRes.headers()["content-type"]).toContain("text/plain");
    const adsText = await adsRes.text();
    expect(adsText).toContain(
      "# ScientificRadar Web — AdSense monetization is disabled by default"
    );
  });

  test("unknown or non-public article and category slugs return HTTP 404 with accessible recovery links", async ({
    page,
  }) => {
    const missingArticleRes = await page.goto(
      "/article/unpublished-or-withdrawn-slug-404",
      { waitUntil: "networkidle" }
    );
    expect(missingArticleRes?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText(
      "This page is not in the ScientificRadar archive"
    );
    await expect(
      page.getByRole("link", { name: "Return to Homepage" })
    ).toBeVisible();

    const missingTopicRes = await page.goto("/topics/unknown-discipline-404", {
      waitUntil: "networkidle",
    });
    expect(missingTopicRes?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText(
      "This page is not in the ScientificRadar archive"
    );
  });
});
