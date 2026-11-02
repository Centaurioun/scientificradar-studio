import React from "react";
import Image from "next/image";
import { PublicMedia } from "@/lib/content/types";

interface ScientificFigureProps {
  media?: PublicMedia;
  figureNumber?: string;
  layout?: "column" | "wide";
  priority?: boolean;
}

export default function ScientificFigure({
  media,
  figureNumber,
  layout = "column",
  priority = false,
}: ScientificFigureProps) {
  if (!media || !media.src) {
    return (
      <figure className="my-8 p-6 border border-[var(--sr-rule)] bg-[var(--sr-surface)] rounded-sm text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--sr-muted)]">
          {figureNumber ?? "Scientific Figure"} · Illustration Unavailable in
          Fixture
        </div>
        <figcaption className="mt-2 text-xs text-[var(--sr-muted)]">
          Graceful fallback for absent figure media; no synthetic credit claimed.
        </figcaption>
      </figure>
    );
  }

  const containerClass =
    layout === "wide"
      ? "my-10 w-full max-w-[var(--sr-figure-max)] mx-auto"
      : "my-8 w-full max-w-[var(--sr-reading-max)] mx-auto";

  return (
    <figure className={containerClass}>
      <div className="overflow-hidden rounded-sm border border-[var(--sr-rule)] bg-[#102028]">
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width || 1200}
          height={media.height || 750}
          priority={priority}
          sizes={
            layout === "wide"
              ? "(max-width: 1140px) 100vw, 1100px"
              : "(max-width: 768px) 100vw, 700px"
          }
          className="w-full h-auto block"
          referrerPolicy="no-referrer"
        />
      </div>
      <figcaption className="mt-3 text-xs sm:text-[13px] text-[var(--sr-ink-secondary)] leading-relaxed space-y-1">
        <div>
          {figureNumber && (
            <strong className="font-semibold text-[var(--sr-ink)] mr-1.5">
              {figureNumber}:
            </strong>
          )}
          <span>{media.caption}</span>
        </div>
        <div className="text-[11.5px] text-[var(--sr-muted)]">
          <span>Credit: {media.credit}</span>
          {media.license && (
            <>
              <span aria-hidden="true"> · </span>
              <span>License: {media.license}</span>
            </>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
