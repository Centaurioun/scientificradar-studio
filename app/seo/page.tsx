'use client';

import React from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { validateDoiSyntax, validateSafeUrl } from '@/lib/editorial-rules';
import { AppShell } from '@/components/layout/app-shell';
import { CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react';

export default function SeoAndQualityCenterPage() {
  const { articles, media, sources } = useStudio();

  return (
    <AppShell title="SEO & Quality Center" breadcrumbs={[{ label: 'SEO & Quality Center' }]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            SEO &amp; Scientific Publishing Quality Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sensible structural guidance (single H1 from title, body H2/H3, meta descriptions, figure alt text, and primary source DOIs)—never a fake numerical search ranking guarantee (Spec §13).
          </p>
        </div>

        {/* Article Quality Matrix */}
        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15222a] text-slate-500 font-semibold">
                <th className="py-3 px-4">Article Title (H1)</th>
                <th className="py-3 px-4">Heading Structure</th>
                <th className="py-3 px-4">SEO Title &amp; Summary</th>
                <th className="py-3 px-4">Figure Alt Text</th>
                <th className="py-3 px-4">Primary Sources</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {articles.map((art) => {
                const hasBodyH1 = /<h1\b/i.test(art.bodyHtml);
                const hasSeo = Boolean(art.seo.title && art.seo.description);
                const fig = media.find((m) => m.id === art.featuredMediaId);
                const figAltOk = !fig || (fig.altText && fig.altText.trim().length >= 10);
                const hasSources = art.sourceIds.length > 0;

                return (
                  <tr key={art.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {art.title}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        /{art.slug} ({art.locale.toUpperCase()})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {!hasBodyH1 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>1 H1 (Title) · H2/H3</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Body H1 detected</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {hasSeo ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Missing SEO fields</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {figAltOk ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Empty figure alt</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {hasSources ? (
                        <span className="font-mono text-emerald-700 dark:text-emerald-400">
                          {art.sourceIds.length} citation(s)
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">No sources linked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/articles/${art.id}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Scientific Sources Syntax Audit */}
        <div className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Primary Citations &amp; DOI Syntax Audit (Offline Deterministic Check)
            </h2>
            <span className="font-mono text-[11px] text-slate-400">
              External Crossref registration verification not run in P0
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sources.map((src) => {
              const doiStatus = validateDoiSyntax(src.doi);
              const urlStatus = validateSafeUrl(src.url);
              return (
                <div key={src.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {src.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {src.authors} · {src.journal} ({src.year})
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className={doiStatus.validSyntax ? 'text-emerald-600' : 'text-amber-600'}>
                      DOI: {src.doi || 'None'} ({doiStatus.validSyntax ? 'Valid Syntax' : 'Flagged'})
                    </span>
                    <span className={urlStatus.valid ? 'text-emerald-600' : 'text-red-600'}>
                      URL: {urlStatus.valid ? 'Safe HTTPS' : 'Invalid'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
