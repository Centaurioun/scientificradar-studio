import React from "react";
import Link from "next/link";
import {
  PublicArticle,
  PublicAuthor,
  PublicCategory,
} from "@/lib/content/types";
import {
  formatPublicationDate,
  getEditorialTypeLabel,
} from "@/lib/content/repository";
import ScientificFigure from "./ScientificFigure";

interface ArticleHeaderProps {
  article: PublicArticle;
  category?: PublicCategory | null;
  authors: PublicAuthor[];
}

export default function ArticleHeader({
  article,
  category,
  authors,
}: ArticleHeaderProps) {
  const typeLabel = getEditorialTypeLabel(article.editorialType);
  const subcategoryNames =
    category?.subcategories
      .filter((s) => article.subcategorySlugs.includes(s.slug))
      .map((s) => s.name) ?? [];

  return (
    <header className="pt-8 pb-6 md:pt-12 md:pb-8">
      <div className="site-container">
        <div className="max-w-[var(--sr-heading-max)] mx-auto text-center space-y-4">
          {/* Category & Subcategory Kicker (Zero-Pill Unboxed Typography) */}
          <div className="flex items-center justify-center flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sr-accent)]">
            <Link
              href={`/topics/${article.categorySlug}`}
              className="hover:underline focus-visible:outline-2 focus-visible:outline-[var(--sr-accent)]"
            >
              {category?.name ?? article.categorySlug}
            </Link>
            {subcategoryNames.map((subName) => (
              <React.Fragment key={subName}>
                <span aria-hidden="true" className="text-[var(--sr-muted)]">
                  /
                </span>
                <span className="text-[var(--sr-muted)] font-medium">
                  {subName}
                </span>
              </React.Fragment>
            ))}
            <span aria-hidden="true" className="text-[var(--sr-muted)]">
              ·
            </span>
            <span className="text-[var(--sr-ink-secondary)] font-medium">
              {typeLabel}
            </span>
          </div>

          {/* Sole Semantic H1 on Article Page */}
          <h1 className="font-editorial text-2xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-[var(--sr-ink)] leading-[1.18] text-balance">
            {article.title}
          </h1>

          {/* Article Dek / Standfirst */}
          <p className="text-base sm:text-lg md:text-[20px] text-[var(--sr-ink-secondary)] leading-relaxed max-w-3xl mx-auto">
            {article.dek}
          </p>

          {/* Byline & Publication Date */}
          <div className="pt-3 border-t border-[var(--sr-rule)] flex items-center justify-center flex-wrap gap-x-2.5 gap-y-1 text-xs sm:text-[13px] text-[var(--sr-muted)]">
            <span>
              By{" "}
              <strong className="font-semibold text-[var(--sr-ink)]">
                {authors.map((a) => a.name).join(" & ")}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>
              Published {formatPublicationDate(article.publishedAt)}
            </time>
            {article.updatedAt && article.updatedAt !== article.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Updated {formatPublicationDate(article.updatedAt)}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{article.readingTimeMinutes} min read</span>
          </div>
        </div>

        {/* Lead Hero Figure (Up to --sr-figure-max = 1100px) */}
        {article.hero && (
          <div className="mt-8">
            <ScientificFigure
              media={article.hero}
              layout="wide"
              priority={true}
            />
          </div>
        )}
      </div>
    </header>
  );
}
