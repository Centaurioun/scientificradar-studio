import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAndRenderLatex } from './latex-math';

test('parseAndRenderLatex renders stacked 2D fractions, radicals, and superscripts/subscripts (SRS-MATH-001/002)', () => {
  const frac = parseAndRenderLatex('\\frac{1}{1 + e^{-z}}');
  assert.equal(frac.valid, true);
  assert.match(frac.renderedHtml, /sr-math-frac/);
  assert.match(frac.renderedHtml, /sr-math-num/);
  assert.match(frac.renderedHtml, /sr-math-denom/);
  assert.match(frac.renderedHtml, /sr-math-sup/);

  const sqrt = parseAndRenderLatex('\\sqrt[3]{x_i^2 + y_j^2}');
  assert.equal(sqrt.valid, true);
  assert.match(sqrt.renderedHtml, /sr-math-sqrt/);
  assert.match(sqrt.renderedHtml, /sr-math-sqrt-index/);
  assert.match(sqrt.renderedHtml, /sr-math-radicand/);
  assert.match(sqrt.renderedHtml, /sr-math-scripts/);
});

test('parseAndRenderLatex renders large operators with stacked limits and matrices (SRS-MATH-001/002)', () => {
  const sum = parseAndRenderLatex('\\sum_{i=1}^{n} \\alpha_i \\cdot \\beta_i');
  assert.equal(sum.valid, true);
  assert.match(sum.renderedHtml, /sr-math-large-op/);
  assert.match(sum.renderedHtml, /sr-math-subsup/);
  assert.match(sum.renderedHtml, /∑/);
  assert.match(sum.renderedHtml, /α/);
  assert.match(sum.renderedHtml, /β/);

  const matrix = parseAndRenderLatex('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}');
  assert.equal(matrix.valid, true);
  assert.match(matrix.renderedHtml, /sr-math-matrix/);
  assert.match(matrix.renderedHtml, /sr-math-matrix-cell/);
});

test('parseAndRenderLatex rejects unbalanced braces, unclosed environments, and untrusted macros (SRS-MATH-002/004)', () => {
  const unbalanced = parseAndRenderLatex('\\frac{a+b}{c');
  assert.equal(unbalanced.valid, false);
  assert.match(unbalanced.error || '', /Unbalanced braces/);

  const unclosedEnv = parseAndRenderLatex('\\begin{bmatrix} 1 & 2');
  assert.equal(unclosedEnv.valid, false);
  assert.match(unclosedEnv.error || '', /Unclosed LaTeX environment/);

  const dangerousMacro = parseAndRenderLatex('\\href{javascript:alert(1)}{click}');
  assert.equal(dangerousMacro.valid, false);
  assert.match(dangerousMacro.error || '', /Unsafe LaTeX macro detected/);
});
