import React from "react";
import { ExternalLink } from "lucide-react";
import { PublicSource } from "@/lib/content/types";

interface CitationListProps {
  sources: PublicSource[];
}

export default function CitationList({ sources }: CitationListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <section
      aria-labelledby="references-heading"
      className="mt-12 pt-8 border-t border-[var(--sr-rule)] max-w-[var(--sr-reading-max)] mx-auto"
    >
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
        <h2
          id="references-heading"
          className="font-editorial text-lg font-bold text-[var(--sr-ink)]"
        >
          Sources &amp; Bibliographic References
        </h2>
        <span className="text-xs text-[var(--sr-muted)]">
          Stage A Illustrative Reference Ledger (No synthetic DOIs claimed)
        </span>
      </div>

      <ol className="space-y-3 text-xs sm:text-[13px] text-[var(--sr-ink-secondary)] leading-relaxed">
        {sources.map((source) => (
          <li
            key={source.id}
            id={`ref-${source.id}`}
            className="flex items-start gap-2.5 p-2.5 rounded-sm bg-[var(--sr-surface)] border border-[var(--sr-rule-subtle)]"
          >
            <a
              href={`#cite-${source.id}`}
              aria-label={`Back to citation ${source.label} in article text`}
              className="font-mono font-semibold text-[var(--sr-accent)] hover:underline shrink-0"
            >
              [{source.label}]
            </a>
            <div className="space-y-1 min-w-0 break-words">
              <div>
                {source.authors && (
                  <span className="font-medium text-[var(--sr-ink)]">
                    {source.authors}.{" "}
                  </span>
                )}
                <span>{source.title}. </span>
                {source.publication && (
                  <em className="italic">{source.publication}</em>
                )}
                {source.year && <span> ({source.year}).</span>}
              </div>

              <div className="flex items-center flex-wrap gap-2 text-[11.5px] text-[var(--sr-muted)]">
                {source.isIllustrativeDemo && (
                  <span>Illustrative Demo Record</span>
                )}
                {source.href && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--sr-accent)] hover:underline"
                    >
                      <span>Reference Portal</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </>
                )}
                {source.note && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{source.note}</span>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
