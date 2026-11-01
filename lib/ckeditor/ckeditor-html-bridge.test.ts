import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertLegacyMathMarkupToCanonical,
  normalizeCkeditorTableFigures,
  normalizeInlineTextAlignStyles,
  cleanCkeditorPlaceholderNbsp,
  prepareCanonicalHtmlForCkeditor,
  canonicalizeCkeditorDataHtml,
  compareEditorSemanticFidelity,
} from './ckeditor-html-bridge';
import {
  extractDelimiters,
  hasDelimiters,
  validateAndRenderKatex,
} from './ckeditor5-math/utils';

test('CKEditor 5 + Math HTML Bridge: F-01 — preserves inline equation data-math-tex and renders real KaTeX DOM', () => {
  const input =
    '<p>Inline energy relation <span data-math-tex="E = \\hbar \\omega" data-math-display="inline">E = ħω</span> in cavity QED.</p>';
  const prepared = prepareCanonicalHtmlForCkeditor(input);
  assert.ok(prepared.ckeditorHtml.includes('data-math-tex="E = \\hbar \\omega"'));
  assert.ok(prepared.ckeditorHtml.includes('data-math-display="inline"'));

  const canonical = canonicalizeCkeditorDataHtml(prepared.ckeditorHtml);
  assert.ok(canonical.sanitizedHtml.includes('data-math-tex="E = \\hbar \\omega"'));
  assert.ok(canonical.sanitizedHtml.includes('data-math-display="inline"'));
  assert.ok(JSON.stringify(canonical.bodyJson).includes('scientificMathInline'));

  const katexOut = validateAndRenderKatex('E = \\hbar \\omega', false);
  assert.equal(katexOut.valid, true);
  assert.ok(katexOut.renderedHtml.includes('class="katex"'));
  assert.ok(katexOut.renderedHtml.includes('class="katex-mathml"'));
  assert.ok(katexOut.renderedHtml.includes('class="katex-html"'));
});

test('CKEditor 5 + Math HTML Bridge: F-02 — preserves display equation data-math-tex and renders real KaTeX fraction/radical/integral/sum DOM', () => {
  const tex =
    '\\mathcal{F}(\\tau) = \\frac{1 + e^{-(\\tau / T_2)^2}}{2} + \\sqrt{\\sum_{k=1}^{n} k^2}';
  const input = `<div data-math-tex="${tex}" data-math-display="block">F(τ)</div>`;

  const prepared = prepareCanonicalHtmlForCkeditor(input);
  const canonical = canonicalizeCkeditorDataHtml(prepared.ckeditorHtml);
  assert.ok(canonical.sanitizedHtml.includes(`data-math-tex="${tex}"`));
  assert.ok(canonical.sanitizedHtml.includes('data-math-display="block"'));
  assert.ok(JSON.stringify(canonical.bodyJson).includes('scientificMathBlock'));

  const katexOut = validateAndRenderKatex(tex, true);
  assert.equal(katexOut.valid, true);
  assert.ok(katexOut.renderedHtml.includes('katex-display'));
  assert.ok(katexOut.renderedHtml.includes('mfrac'));
  assert.ok(katexOut.renderedHtml.includes('sqrt'));
});

test('CKEditor 5 + Math HTML Bridge: F-03 — safely converts legacy <script type="math/tex"> and <span class="math-tex"> into canonical math spans/divs while stripping executable <script> tags', () => {
  const legacyHtml = [
    '<p>Inline legacy <script type="math/tex">x^2 + y^2 = r^2</script> and delimiter span <span class="math-tex">\\( \\alpha + \\beta \\)</span>.</p>',
    '<script type="math/tex; mode=display">\\int_{0}^{\\infty} e^{-x}\\,dx = 1</script>',
    '<script>window.__xssExecuted = true;</script>',
  ].join('');

  const converted = convertLegacyMathMarkupToCanonical(legacyHtml);
  assert.ok(converted.html.includes('data-math-tex="x^2 + y^2 = r^2"'));
  assert.ok(converted.html.includes('data-math-tex="\\alpha + \\beta"'));
  assert.ok(converted.html.includes('data-math-tex="\\int_{0}^{\\infty} e^{-x}\\,dx = 1"'));
  assert.ok(converted.html.includes('data-math-display="block"'));

  const canonical = canonicalizeCkeditorDataHtml(legacyHtml);
  assert.ok(canonical.sanitizedHtml.includes('data-math-tex="x^2 + y^2 = r^2"'));
  assert.ok(canonical.sanitizedHtml.includes('data-math-tex="\\alpha + \\beta"'));
  assert.ok(
    canonical.sanitizedHtml.includes(
      'data-math-tex="\\int_{0}^{\\infty} e^{-x}\\,dx = 1"'
    )
  );
  assert.ok(!canonical.sanitizedHtml.includes('__xssExecuted'));
  assert.ok(!canonical.sanitizedHtml.includes('<script'));
});

test('CKEditor 5 + Math HTML Bridge: F-04 — preserves appearance-ordered citation markers <sup data-citation-source-id="..."> across CKEditor round-trip', () => {
  const html =
    '<p>First claim<sup data-citation-source-id="src-nature-qec">[1]</sup> and second<sup data-citation-source-id="src-prx-repeater">[2]</sup> and repeat<sup data-citation-source-id="src-nature-qec">[1]</sup>.</p>';
  const prepared = prepareCanonicalHtmlForCkeditor(html);
  const canonical = canonicalizeCkeditorDataHtml(prepared.ckeditorHtml);

  assert.deepEqual(canonical.semantics.citationSourceIds, [
    'src-nature-qec',
    'src-prx-repeater',
    'src-nature-qec',
  ]);
  const fidelity = compareEditorSemanticFidelity(html, canonical.sanitizedHtml);
  assert.equal(fidelity.matches, true);
});

test('CKEditor 5 + Math HTML Bridge: F-05 — preserves scientific figure with data-media-id and does not invent placeholder credit or licence when rights are empty', () => {
  const trusted = new Set(['/assets/demo/quantum-cavity.png']);
  const html =
    '<figure data-media-id="media-unverified-1" data-figure-layout="locked"><img src="/assets/demo/quantum-cavity.png" alt="Cryogenic cavity" /><figcaption>Figure 1: Optical resonator schematic.</figcaption></figure>';

  const prepared = prepareCanonicalHtmlForCkeditor(html, trusted);
  const canonical = canonicalizeCkeditorDataHtml(prepared.ckeditorHtml, trusted);

  assert.ok(canonical.sanitizedHtml.includes('data-media-id="media-unverified-1"'));
  assert.ok(canonical.sanitizedHtml.includes('Figure 1: Optical resonator schematic.'));
  assert.ok(!canonical.sanitizedHtml.includes('ScientificRadar Lab'));
  assert.ok(!canonical.sanitizedHtml.includes('CC BY 4.0'));
  assert.deepEqual(
    canonical.semantics.figureAssets.map((f) => f.mediaId),
    ['media-unverified-1']
  );
});

test('CKEditor 5 + Math HTML Bridge: F-06 — normalizes CKEditor <figure class="table"> wrapper, empty cell &nbsp;, table caption, and colspan/rowspan attributes', () => {
  const ckTableHtml =
    '<figure class="table"><table><thead><tr><th colspan="2">Parameter (10<sup>-6</sup> K)</th><th>p-value</th></tr></thead><tbody><tr><td>&nbsp;</td><td>1.42 × 10<sup>-6</sup></td><td>p = 0.003</td></tr></tbody></table><figcaption>Table 1: Cryogenic coherence metrics</figcaption></figure>';

  const normalized = cleanCkeditorPlaceholderNbsp(
    normalizeCkeditorTableFigures(ckTableHtml)
  );
  assert.ok(!normalized.includes('<figure class="table"'));
  assert.ok(normalized.includes('<table><caption>Table 1: Cryogenic coherence metrics</caption>'));
  assert.ok(normalized.includes('<td></td>'));
  assert.ok(normalized.includes('<th colspan="2">'));

  const canonical = canonicalizeCkeditorDataHtml(ckTableHtml);
  assert.ok(canonical.sanitizedHtml.includes('<caption>Table 1: Cryogenic coherence metrics</caption>'));
  assert.ok(canonical.sanitizedHtml.includes('colspan="2"'));
  assert.ok(canonical.sanitizedHtml.includes('<td></td>'));
  assert.ok(JSON.stringify(canonical.bodyJson).includes('"colspan":2'));
});

test('CKEditor 5 + Math HTML Bridge: F-07 — preserves multiline code block whitespace and angle brackets without corruption', () => {
  const codeHtml =
    '<h2>Syndrome Decoder</h2><pre><code class="language-python">def decode(syndrome):\n    if len(syndrome) &lt; 2:\n        return []\n    return syndrome</code></pre>';
  const prepared = prepareCanonicalHtmlForCkeditor(codeHtml);
  const canonical = canonicalizeCkeditorDataHtml(prepared.ckeditorHtml);

  assert.ok(canonical.sanitizedHtml.includes('    if len(syndrome) &lt; 2:\n        return []'));
  const fidelity = compareEditorSemanticFidelity(codeHtml, canonical.sanitizedHtml);
  assert.equal(fidelity.matches, true);
});

test('CKEditor 5 + Math HTML Bridge: F-08 — preserves Turkish diacritics (ğ, ü, ş, ı, ö, ç, İ), Greek characters (α, β, γ, Δ, Ω), and Unicode superscripts/subscripts (10⁻⁶, H₂O)', () => {
  const unicodeHtml =
    '<h2>Türkçe Bilimsel Özet: Çağdaş Kuantum Ölçümleri</h2><p>Sıcaklık ΔT = 10⁻⁶ K düzeyinde H₂O molekülleri ve α, β, γ, Ω faz geçişleri incelenmiştir.</p>';
  const canonical = canonicalizeCkeditorDataHtml(unicodeHtml);
  assert.ok(canonical.sanitizedHtml.includes('Türkçe Bilimsel Özet: Çağdaş Kuantum Ölçümleri'));
  assert.ok(canonical.sanitizedHtml.includes('ΔT = 10⁻⁶ K'));
  assert.ok(canonical.sanitizedHtml.includes('H₂O'));
  assert.ok(canonical.sanitizedHtml.includes('α, β, γ, Ω'));
});

test('CKEditor 5 + Math HTML Bridge: F-09 — strips XSS payloads (script, img onerror, svg onload, javascript: href, and unsafe LaTeX \\href{javascript:...})', () => {
  const maliciousHtml = [
    '<p>Safe paragraph</p>',
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)" />',
    '<svg onload="alert(2)"></svg>',
    '<a href="javascript:alert(3)">Bad Link</a>',
  ].join('');

  const canonical = canonicalizeCkeditorDataHtml(maliciousHtml);
  assert.ok(!canonical.sanitizedHtml.includes('<script'));
  assert.ok(!canonical.sanitizedHtml.includes('onerror'));
  assert.ok(!canonical.sanitizedHtml.includes('<svg'));
  assert.ok(!canonical.sanitizedHtml.includes('javascript:'));

  const unsafeMath = validateAndRenderKatex('\\href{javascript:alert(1)}{Click}', false);
  assert.equal(unsafeMath.valid, false);
  assert.match(unsafeMath.error || '', /Blocked unsafe LaTeX command/i);
  assert.ok(!unsafeMath.renderedHtml.includes('javascript:'));
});

test('CKEditor 5 + Math HTML Bridge: F-10 — demotes body <h1> headings to <h2> to enforce the Single-H1 rule and normalizes inline text-align styles', () => {
  const htmlWithH1 =
    '<h1 style="text-align:center;">Illegal Body H1 Heading</h1><p style="text-align:right;">Right aligned paragraph.</p>';
  const aligned = normalizeInlineTextAlignStyles(htmlWithH1);
  assert.ok(aligned.includes('data-text-align="center"'));
  assert.ok(aligned.includes('data-text-align="right"'));

  const canonical = canonicalizeCkeditorDataHtml(htmlWithH1);
  assert.equal(canonical.demotedCount, 1);
  assert.ok(!canonical.sanitizedHtml.includes('<h1'));
  assert.ok(canonical.sanitizedHtml.includes('<h2 data-text-align="center">Illegal Body H1 Heading</h2>'));
  assert.ok(canonical.sanitizedHtml.includes('<p data-text-align="right">Right aligned paragraph.</p>'));
});

test('CKEditor 5 + Math HTML Bridge: validates CKEditor Math delimiter helpers (hasDelimiters / extractDelimiters)', () => {
  assert.equal(hasDelimiters('\\( E = mc^2 \\)'), true);
  assert.equal(hasDelimiters('\\[ \\int f(x) dx \\]'), true);
  assert.equal(hasDelimiters('E = mc^2'), false);

  assert.deepEqual(extractDelimiters('\\( E = mc^2 \\)'), {
    equation: 'E = mc^2',
    display: false,
  });
  assert.deepEqual(extractDelimiters('\\[ \\int f(x) dx \\]'), {
    equation: '\\int f(x) dx',
    display: true,
  });
});
