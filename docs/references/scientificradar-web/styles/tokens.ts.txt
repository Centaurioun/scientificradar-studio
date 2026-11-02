/**
 * Centralized design tokens for ScientificRadar Web.
 * All numerical defaults and palette decisions are modularized here and synced
 * with CSS custom properties in app/globals.css so the project owner can tune
 * reading widths, typography scales, spacing, and colors in one place.
 */

export type ReadingMeasureOption = "700" | "600" | "560";
export type HeroVariantOption = "standard" | "compact";

/** Compact is the owner-approved homepage default; standard remains selectable. */
export function resolveHeroVariant(value?: string): HeroVariantOption {
  return value === "standard" ? "standard" : "compact";
}

export const DESIGN_TOKENS = {
  layout: {
    pageMax: "1320px",
    readingMaxDefault: "700px",
    readingMaxCompact: "600px",
    readingMaxQuantaBenchmark: "560px",
    headingMax: "880px",
    figureMax: "1100px",
    gutter: "clamp(16px, 3vw, 40px)",
    railWidth: "220px",
  },
  colors: {
    paper: "#FAFAF8",
    surface: "#F2F1EC",
    surfaceElevated: "#FFFFFF",
    ink: "#181C21",
    inkSecondary: "#363E47",
    muted: "#525B65",
    accent: "#15747B",
    accentHover: "#0E565C",
    accentSubtle: "#E6F2F3",
    rule: "#DCE2E4",
    ruleSubtle: "#EAECEF",
  },
  typography: {
    editorialFontVar: "var(--font-editorial)",
    interfaceFontVar: "var(--font-interface)",
    mathFontStack:
      '"KaTeX_Main", "Latin Modern Math", "STIX Two Math", "Cambria Math", Georgia, serif',
    monoFontStack:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    bodySize: "clamp(17px, 1.25vw, 19px)",
    bodyLeading: "1.72",
    headingWeight: "700",
  },
} as const;

export const READING_MEASURE_PRESETS: Record<
  ReadingMeasureOption,
  {
    value: ReadingMeasureOption;
    px: string;
    label: string;
    description: string;
  }
> = {
  "700": {
    value: "700",
    px: "700px",
    label: "700px (Owner Default)",
    description:
      "Initial ScientificRadar specification (680–720px target measure, ~68–74 characters per line).",
  },
  "600": {
    value: "600",
    px: "600px",
    label: "600px (Comparison Variant)",
    description:
      "Narrower editorial column requested for side-by-side owner visual comparison (~58–64 characters per line).",
  },
  "560": {
    value: "560",
    px: "560px",
    label: "560px (Quanta Reference)",
    description:
      "Observed inner prose measure from Blueprint §15.1 forensic audit (560px text inside 688px center column).",
  },
};
