'use client';

import { useState } from 'react';
import { extractHeadEntriesFromMarkup, inspectHeadEntries, type HeadQualityFinding } from '@/lib/seo/head-quality';

/**
 * Local-only inspection of pasted rendered markup; no requests or persistence.
 * Does not claim to validate HTTP response codes, live Google indexing or security.
 */
export function HeadQualityInspector() {
  const [markup, setMarkup] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [findings, setFindings] = useState<HeadQualityFinding[]>([]);
  const [inspected, setInspected] = useState(false);
  const [tagCount, setTagCount] = useState(0);

  const inspect = () => {
    if (!markup.trim()) return;
    const entries = extractHeadEntriesFromMarkup(markup);
    setTagCount(entries.length);
    setFindings(inspectHeadEntries(entries, pageUrl));
    setInspected(true);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-[#111c22]" aria-labelledby="head-inspector-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 id="head-inspector-title" className="text-sm font-bold text-slate-900 dark:text-white">
            Rendered HTML Head Quality Inspector
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Paste the HTML source of an existing or candidate public page to flag duplicate descriptions,
            contradictory Open Graph types, repeated Twitter card fields, missing or invalid canonicals,
            and indexable internal-search pages.
          </p>
        </div>
        <span className="rounded bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
          Local inspection only
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <label htmlFor="head-inspector-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          Page URL (optional; enables canonical and search route comparison)
        </label>
        <input
          id="head-inspector-url"
          type="url"
          value={pageUrl}
          onChange={(event) => { setPageUrl(event.target.value); setInspected(false); }}
          placeholder="https://scientificradar.com/search?q=biology"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <label htmlFor="head-inspector-markup" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          Rendered HTML (head or complete document, max 100,000 characters)
        </label>
        <textarea
          id="head-inspector-markup"
          value={markup}
          onChange={(event) => { setMarkup(event.target.value); setInspected(false); }}
          maxLength={100000}
          rows={7}
          spellCheck={false}
          placeholder={'<head>\n  <title>ScientificRadar</title>\n  <meta name="description" content="...">\n</head>'}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={inspect}
            disabled={!markup.trim()}
            className="rounded-md bg-[#087f83] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#086b70] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Inspect HTML Head
          </button>
          <span className="text-[11px] text-slate-500">
            Nothing uploaded, stored, fetched, executed, or applied to publication.
          </span>
        </div>
      </div>

      {inspected && (
        <div className="mt-4 space-y-2" role="status" aria-live="polite">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            {tagCount} head element(s) inspected · {findings.filter((finding) => finding.severity === 'error').length} errors · {findings.filter((finding) => finding.severity === 'warning').length} warnings
          </div>
          {findings.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              No issues detected by these local head rules. This is not proof of live SEO readiness, indexing, HTTP status, or complete accessibility.
            </p>
          ) : (
            <ul className="space-y-2">
              {findings.map((finding) => (
                <li key={finding.id} className={'rounded-lg border p-3 text-xs ' +
                  (finding.severity === 'error'
                    ? 'border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
                    : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200')}>
                  <p className="font-bold">{finding.title} <span className="font-mono font-normal opacity-75">({finding.id})</span></p>
                  <p className="mt-1">{finding.details}</p>
                  <p className="mt-1 opacity-85">Recommendation: {finding.recommendation}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-slate-500">
            Output metadata is only one layer. Inspect actual HTTP status, response headers, rendered H1,
            hreflang reciprocity, sitemap, robots.txt and Search Console separately before going live.
          </p>
        </div>
      )}
    </section>
  );
}
