import React from "react";
import Link from "next/link";
import { PublicAuthor } from "@/lib/content/types";

interface AuthorProfileProps {
  authors: PublicAuthor[];
  tags: string[];
}

export default function AuthorProfile({ authors, tags }: AuthorProfileProps) {
  return (
    <section
      aria-label="Author information and article topics"
      className="mt-10 pt-8 border-t border-[var(--sr-rule)] max-w-[var(--sr-reading-max)] mx-auto space-y-6"
    >
      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[var(--sr-muted)] mr-1">
            Topics:
          </span>
          {tags.map((tag, idx) => (
            <React.Fragment key={tag}>
              {idx > 0 && (
                <span aria-hidden="true" className="text-[var(--sr-muted)]">
                  ·
                </span>
              )}
              <Link
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="font-medium text-[var(--sr-accent)] hover:underline"
              >
                {tag}
              </Link>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Author Bios */}
      <div className="space-y-4">
        {authors.map((author) => (
          <div
            key={author.id}
            className="p-5 rounded-sm bg-[var(--sr-surface)] border border-[var(--sr-rule)] space-y-1.5"
          >
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h3 className="font-editorial text-base font-bold text-[var(--sr-ink)]">
                {author.name}
              </h3>
              <span className="text-xs font-medium text-[var(--sr-accent)]">
                {author.role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--sr-ink-secondary)] leading-relaxed">
              {author.bio}
            </p>
            <p className="text-[11px] text-[var(--sr-muted)] pt-1">
              {author.credentialsNote}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
