/**
 * Pinned ScientificRadar Web Design Tokens
 * Source: docs/references/scientificradar-web/styles/tokens.ts.txt
 * Web SHA: 3b096e84023ca1ba358b7d7dd4f25f17185fc8d7
 */
export const DESIGN_TOKENS = {
  colors: {
    paper: '#FAFAF8',
    surface: '#F2F1EC',
    ink: '#181C21',
    inkSecondary: '#363E47',
    muted: '#525B65',
    accent: '#15747B',
    accentHover: '#0E565C',
    rule: '#DCE2E4',
    ruleSubtle: '#E8ECEE',
  },
  layout: {
    pageMax: '1320px',
    readingMaxDefault: '700px',
    readingMaxCompact: '600px',
    readingMaxNarrow: '560px',
    headingMax: '880px',
    figureMax: '1100px',
  },
  typography: {
    bodySize: 'clamp(17px, 1.25vw, 19px)',
    proseLeading: 1.72,
    editorialFontStack:
      'var(--font-editorial), "Merriweather", "Source Serif 4", Georgia, Cambria, "Times New Roman", serif',
    interfaceFontStack:
      'var(--font-interface), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mathFontStack:
      '"KaTeX_Main", "Latin Modern Math", "STIX Two Math", "Cambria Math", Georgia, serif',
  },
} as const;

export type ReadingMeasureOption = '700' | '600' | '560';

export const READING_MEASURE_PRESETS: Record<
  ReadingMeasureOption,
  {
    px: string;
    label: string;
    note: string;
  }
> = {
  '700': {
    px: '700px',
    label: '700px (Default)',
    note: 'Recommended 65–72ch scientific measure with room for inline citations and equations.',
  },
  '600': {
    px: '600px',
    label: '600px (Compact)',
    note: 'Denser ~58ch column; increases vertical height for multi-clause technical sentences.',
  },
  '560': {
    px: '560px',
    label: '560px (Narrow)',
    note: 'Tight ~52ch measure; causes frequent line wraps on compound scientific terminology.',
  },
};
