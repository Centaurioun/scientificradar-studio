import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatEditorialHtmlSource,
  validateAndAnalyzeHtmlSource,
  validateAndRenderLatex,
} from './html-source';
import { cleanClipboardPasteHtml } from './html-security';

test('validateAndAnalyzeHtmlSource accepts valid scientific editorial HTML with sup, sub, math, citation, figure, and table (SRS-HTML-001/002/003)', () => {
  const raw = [
    '<h2>Thermodynamic Analysis</h2>',
    '<p data-text-align="justify">Water (H<sub>2</sub>O) and<sup>14</sup>C isotope ratio <span data-math-tex="\\Delta G = -RT \\ln K" data-math-display="inline">(ΔG = -RT ln K)</span><sup data-citation-source-id="src-nature-qec">[Cite]</sup>.</p>',
    '<div data-math-tex="E = mc^2" data-math-display="block">E = mc²</div>',
    '<figure data-media-id="med-1" data-figure-layout="locked"><img src="/figures/quantum-ldpc-lattice.svg" alt="Quantum lattice" /><figcaption>Figure 1: Lattice</figcaption></figure>',
    '<table><thead><tr><th>Sample</th><th>Value</th></tr></thead><tbody><tr><td>A</td><td>1.2 ± 0.1</td></tr></tbody></table>',
  ].join('\n');

  const res = validateAndAnalyzeHtmlSource(
    raw,
    new Set(['/figures/quantum-ldpc-lattice.svg'])
  );
  assert.equal(res.validSyntax, true);
  assert.equal(res.canApplyCleanly, true);
  assert.equal(res.diagnostics.filter((d) => d.severity === 'error').length, 0);
  assert.match(res.sanitizedHtml, /<sub>2<\/sub>/);
  assert.match(res.sanitizedHtml, /<sup>14<\/sup>/);
  assert.match(res.sanitizedHtml, /data-math-tex="\\Delta G = -RT \\ln K"/);
  assert.match(res.sanitizedHtml, /data-citation-source-id="src-nature-qec"/);
  assert.match(res.sanitizedHtml, /data-figure-layout="locked"/);
  assert.match(res.sanitizedHtml, /<table>/);
});

test('validateAndAnalyzeHtmlSource blocks unbalanced HTML markup with explicit error diagnostics', () => {
  const broken = '<h2>Results</h2>\n<p><strong>Unclosed bold tag</p>';
  const res = validateAndAnalyzeHtmlSource(broken);
  assert.equal(res.validSyntax, false);
  assert.equal(res.canApplyCleanly, false);
  assert.equal(res.diagnostics.some((e) => e.code === 'UNBALANCED_MARKUP'), true);
});

test('validateAndAnalyzeHtmlSource strips XSS scripts, event handlers, javascript URLs, and inline styles while flagging warnings', () => {
  const malicious =
    '<h1>Main</h1><p style="color:red" onclick="alert(1)">CO<sub>2</sub> <a href="javascript:alert(1)">bad</a></p><script>alert(1)</script>';
  const res = validateAndAnalyzeHtmlSource(malicious);
  assert.equal(res.validSyntax, true);
  assert.equal(res.requiresNormalizationConfirm, true);
  assert.equal(res.demotedH1Count, 1);
  assert.match(res.sanitizedHtml, /<h2>Main<\/h2>/);
  assert.match(res.sanitizedHtml, /<sub>2<\/sub>/);
  assert.doesNotMatch(res.sanitizedHtml, /<script|onclick|style=|javascript:/i);
});

test('validateAndAnalyzeHtmlSource flags unsupported custom tags and requires normalization confirmation before apply', () => {
  const custom = '<p>Valid paragraph</p><custom-widget>Inner text</custom-widget>';
  const res = validateAndAnalyzeHtmlSource(custom);
  assert.equal(res.validSyntax, true);
  assert.equal(res.requiresNormalizationConfirm, true);
  assert.equal(res.diagnostics.some((w) => w.code === 'UNSUPPORTED_TAG'), true);
});

test('validateAndRenderLatex validates balanced LaTeX and rejects unbalanced braces (SRS-MATH-001/002)', () => {
  const ok = validateAndRenderLatex('\\Delta G = \\Delta H - T\\Delta S');
  assert.equal(ok.valid, true);
  assert.match(ok.renderedText, /Δ/);

  const bad = validateAndRenderLatex('\\frac{a + b}{c');
  assert.equal(bad.valid, false);
  assert.match(bad.error || '', /Unbalanced braces/);
});

test('formatEditorialHtmlSource indents block tags while preserving preformatted blocks intact (SRS-HTML-002)', () => {
  const input =
    '<h2>Section</h2><p>First paragraph</p><pre><code>function decodeSyndrome(matrix) {\n  if (!matrix) {\n    return [];\n  }\n  return matrix.map((row) => row.join(" "));\n}</code></pre><p>After code</p>';
  const formatted = formatEditorialHtmlSource(input);
  assert.match(formatted, /<h2>Section<\/h2>\n<p>First paragraph<\/p>/);
  assert.match(
    formatted,
    /<pre><code>function decodeSyndrome\(matrix\) \{\n  if \(!matrix\) \{\n    return \[\];\n  \}\n  return matrix\.map\(\(row\) => row\.join\(" "\)\);\n\}<\/code><\/pre>/
  );
});

test('validateAndAnalyzeHtmlSource warns on stripped scientific constructs with SCIENTIFIC_NODE_LOSS', () => {
  const untrustedFigureImg =
    '<figure data-media-id="med-1"><img src="https://evil.example/untrusted.png" alt="Untrusted" /><figcaption>Caption</figcaption></figure>';
  const res = validateAndAnalyzeHtmlSource(untrustedFigureImg, new Set(['/figures/trusted.svg']));
  assert.equal(res.validSyntax, true);
  assert.equal(res.requiresNormalizationConfirm, true);
  assert.equal(res.diagnostics.some((d) => d.code === 'SCIENTIFIC_NODE_LOSS'), true);
});

test('cleanClipboardPasteHtml normalizes Google Docs wrapper, vertical-align super/sub spans, and text-align styles (SRS-ED-008)', () => {
  const pasted =
    '<b style="font-weight:normal" id="docs-internal-guid-123"><h1 style="text-align:center">Pasted Heading</h1><p>H<span style="vertical-align:sub">2</span>O and 10<span style="vertical-align:super">-6</span> M</p></b>';
  const cleaned = cleanClipboardPasteHtml(pasted);
  assert.equal(cleaned.demotedH1Count, 1);
  assert.match(cleaned.html, /<h2 data-text-align="center">Pasted Heading<\/h2>/);
  assert.match(cleaned.html, /H<sub>2<\/sub>O/);
  assert.match(cleaned.html, /10<sup>-6<\/sup>/);
  assert.doesNotMatch(cleaned.html, /style=|docs-internal-guid/i);
});

