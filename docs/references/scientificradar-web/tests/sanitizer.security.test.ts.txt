import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeCanonicalBodyHtml } from "./sanitizer";

test("encoded javascript URLs and unapproved attributes do not survive sanitization", () => {
  const dirty = [
    '<a href="&#x6a;avascript:alert(1)" target="_blank" onclick="evil()">danger</a>',
    '<p data-unreviewed="true" style="position:fixed" class="evil">Text</p>',
    '<img src="https://untrusted.example/pixel" onerror="evil()" srcset="https://untrusted.example/a 1x">',
  ].join("");
  const clean = sanitizeCanonicalBodyHtml(dirty);
  assert.doesNotMatch(clean, /javascript\s*:/i);
  assert.doesNotMatch(clean, /href\s*=\s*["']\s*&#/i);
  assert.doesNotMatch(clean, /data-unreviewed|srcset|style=|class=|onerror|onclick/i);
  assert.doesNotMatch(clean, /untrusted\.example/i);
});

test("trusted scientific markup, safe links and image records remain", () => {
  const html = [
    '<h1>Body must not contain another H1</h1>',
    '<p>H<sub>2</sub>O and x<sup data-citation-source-id="src-1">1</sup></p>',
    '<span data-math-tex="x^2 + y^2" data-math-display="inline">x+y</span>',
    '<figure data-media-id="fig-01" data-figure-credit="Illustrative Original">',
    '<img src="/images/demo/spider-silk-hierarchy.svg" alt="Demo figure">',
    '<figcaption>A legitimate scientific caption</figcaption></figure>',
    '<table><caption>Measurements</caption><thead><tr><th scope="col">Unit</th></tr></thead><tbody><tr><td>nm</td></tr></tbody></table>',
    '<a href="https://en.wikipedia.org/wiki/Biomimetics" target="_blank">Read more</a>',
  ].join("");
  const result = sanitizeCanonicalBodyHtml(html);
  assert.doesNotMatch(result, /<h1[\s>]/i);
  assert.match(result, /<h2>Body must not contain another H1<\/h2>/);
  assert.match(result, /data-citation-source-id="src-1"/);
  assert.match(result, /data-math-tex="x\^2 \+ y\^2"/);
  assert.match(result, /data-media-id="fig-01"/);
  assert.match(result, /spider-silk-hierarchy\.svg/);
  assert.match(result, /<figcaption>/);
  assert.match(result, /<table>/);
  assert.match(result, /noopener/);
  assert.match(result, /noreferrer/);
});
