import katex from "katex";

/**
 * Render a standalone scientific TeX expression to accessible KaTeX HTML.
 * Never trust content-level commands such as arbitrary \href or \htmlClass.
 * Invalid/oversized math returns null; callers display escaped React text.
 */
export function renderScientificMath(
  tex: string,
  displayMode = true
): string | null {
  if (typeof tex !== "string" || !tex.trim() || tex.length > 4000) {
    return null;
  }

  try {
    return katex.renderToString(tex, {
      displayMode,
      output: "htmlAndMathml",
      throwOnError: true,
      trust: false,
      strict: "ignore",
      maxExpand: 1000,
      maxSize: 10,
    });
  } catch {
    return null;
  }
}
