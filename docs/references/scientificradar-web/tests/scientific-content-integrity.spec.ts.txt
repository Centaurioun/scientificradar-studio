import { expect, test } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  attachDiagnostics,
  collectDiagnostics,
  VIEWPORTS,
} from "./helpers";

const SCIENTIFIC_ARTICLES = [
  {
    slug: "spider-silk-hierarchical-protein-mechanics",
    title: "Hierarchical Protein Mechanics in Spider Dragline Silk",
    expectedMathCount: 1,
    expectedFigureCount: 2,
    expectedCitationCount: 4,
  },
  {
    slug: "respiratory-pigments-evolutionary-biochemistry",
    title: "Evolutionary Biochemistry of Invertebrate Respiratory Pigments",
    expectedMathCount: 1,
    expectedFigureCount: 2,
    expectedCitationCount: 4,
  },
];

test.describe("Group D: Scientific Content Integrity & Mathematical Rendering", () => {
  for (const articleInfo of SCIENTIFIC_ARTICLES) {
    test.describe(`${articleInfo.slug}`, () => {
      for (const viewport of VIEWPORTS) {
        test(`scientific integrity on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
          page,
        }) => {
          const diagnostics = collectDiagnostics(page);
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          const response = await page.goto(`/article/${articleInfo.slug}`, {
            waitUntil: "networkidle",
          });
          expect(response?.status()).toBe(200);

          // 1. KaTeX mathematical formula rendering & MathML verification
          const mathBlocks = page.locator('div[role="math"]');
          await expect(mathBlocks).toHaveCount(articleInfo.expectedMathCount);

          const katexElements = page.locator(".katex");
          expect(await katexElements.count()).toBeGreaterThanOrEqual(
            articleInfo.expectedMathCount,
          );

          // Verify MathML <math> elements are present
          const mathMlElements = page.locator(".katex-mathml math, math");
          expect(await mathMlElements.count()).toBeGreaterThanOrEqual(
            articleInfo.expectedMathCount,
          );

          // 2. Scientific figures, captions, credits, and dark diagram background
          const figures = page.locator("article figure");
          await expect(figures).toHaveCount(articleInfo.expectedFigureCount);

          for (let i = 0; i < articleInfo.expectedFigureCount; i++) {
            const figure = figures.nth(i);
            await figure.scrollIntoViewIfNeeded();
            const image = figure.locator("img");
            await expect(image).toBeVisible();

            // Ensure image is decoded and loaded
            const isLoaded = await image.evaluate(
              async (img: HTMLImageElement) => {
                try {
                  await img.decode();
                } catch {
                  // Fallback
                }
                return img.complete && img.naturalWidth > 0;
              },
            );
            expect(isLoaded).toBe(true);

            // Caption and credit verification
            const figcaption = figure.locator("figcaption");
            await expect(figcaption).toBeVisible();
            await expect(figcaption).toContainText("Credit:");

            // Dark diagram background
            const imageFrame = figure.locator(".bg-\\[\\#102028\\]");
            await expect(imageFrame).toBeVisible();
          }

          // 3. Scientific tables scrollable container verification
          const tableContainers = page.locator(
            "article div.overflow-x-auto:has(> table)",
          );
          expect(await tableContainers.count()).toBeGreaterThan(0);

          for (let i = 0; i < (await tableContainers.count()); i++) {
            const container = tableContainers.nth(i);
            const containerBox = await container.boundingBox();
            expect(containerBox).not.toBeNull();
            expect(containerBox!.width).toBeLessThanOrEqual(viewport.width);

            const table = container.locator("table");
            await expect(table).toBeVisible();

            const overflowX = await container.evaluate(
              (el) => window.getComputedStyle(el).overflowX,
            );
            expect(overflowX).toBe("auto");
          }

          // 4. Citation and bibliography anchors verification
          const citationLinks = page.locator("sup a[data-citation-source-id]");
          expect(await citationLinks.count()).toBeGreaterThanOrEqual(
            articleInfo.expectedCitationCount,
          );

          const referencesHeading = page.locator("#references-heading");
          await expect(referencesHeading).toBeVisible();

          // 5. Full document scroll verification: no horizontal overflow
          await assertNoHorizontalOverflow(page, viewport.width);
          await attachDiagnostics(
            page,
            diagnostics,
            `scientific-${articleInfo.slug}-${viewport.name}-diagnostics.json`,
          );
        });
      }

      test("in-text citation anchor navigates smoothly to bibliography entry", async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto(`/article/${articleInfo.slug}`, {
          waitUntil: "networkidle",
        });

        const firstCitation = page
          .locator("sup a[data-citation-source-id]")
          .first();
        await expect(firstCitation).toBeVisible();

        const sourceId = await firstCitation.getAttribute(
          "data-citation-source-id",
        );
        expect(sourceId).not.toBeNull();

        const expectedRefId = `ref-${sourceId}`;
        const refEntry = page.locator(`#${expectedRefId}`);
        await expect(refEntry).toBeAttached();

        await firstCitation.click();
        await expect(refEntry).toBeInViewport();
      });
    });
  }
});
