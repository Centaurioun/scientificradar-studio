import { ScientificSource } from './types';

export interface ResolvedCitationItem {
  number: number;
  sourceId: string;
  source?: ScientificSource;
  isOrphaned: boolean;
  citationCount: number;
  occurrenceCount: number;
  vancouverText: string;
}

export interface ManuscriptCitationAnalysis {
  /** Ordered list of unique cited sources (and orphaned IDs) in order of first appearance in bodyHtml */
  orderedCitations: ResolvedCitationItem[];
  /** Alias for orderedCitations */
  occurrences: ResolvedCitationItem[];
  /** Map from sourceId -> 1-based citation number (or 0 if orphaned) */
  numberBySourceId: Map<string, number>;
  /** Source IDs referenced inline in bodyHtml that do not exist in the article's attached sources */
  orphanedSourceIds: string[];
  /** Attached sources on the article that are not yet cited inline in the body */
  uncitedAttachedSources: ScientificSource[];
}

/**
 * Formats a `ScientificSource` into a deterministic Vancouver-style bibliographic string
 * using only genuine human-supplied fields (never fabricating pages, volume, or verification).
 */
export function formatVancouverReference(source: ScientificSource): string {
  const authors = (source.authors || '').trim() || 'Unknown Authors';
  const title = (source.title || '').trim() || 'Untitled Source';
  const journal = (source.journal || '').trim();
  const year = source.year ? String(source.year) : '';
  const doi = (source.doi || '').trim();

  const parts: string[] = [`${authors}.`, `${title}.`];
  if (journal && year) {
    parts.push(`${journal}. ${year}.`);
  } else if (journal) {
    parts.push(`${journal}.`);
  } else if (year) {
    parts.push(`${year}.`);
  }
  if (doi) {
    parts.push(`doi:${doi}`);
  }
  return parts.join(' ');
}

/**
 * Scans `bodyHtml` for `<sup data-citation-source-id="...">` markers in document appearance order,
 * deduplicates repeated references, assigns sequential `[1]`, `[2]` numbers, and flags orphaned anchors
 * (`SRS-SCI-001`, `SRS-SCI-002`).
 */
export function analyzeManuscriptCitations(
  bodyHtml: string,
  attachedSources: ScientificSource[],
  allRepositorySources?: ScientificSource[]
): ManuscriptCitationAnalysis {
  const html = typeof bodyHtml === 'string' ? bodyHtml : '';
  const attachedById = new Map<string, ScientificSource>(
    attachedSources.map((s) => [s.id, s])
  );
  const repoById = new Map<string, ScientificSource>(
    (allRepositorySources || attachedSources).map((s) => [s.id, s])
  );

  const orderedCitations: ResolvedCitationItem[] = [];
  const itemBySourceId = new Map<string, ResolvedCitationItem>();
  const numberBySourceId = new Map<string, number>();
  const orphanedSet = new Set<string>();

  const citationRegex = /<sup\b[^>]*\bdata-citation-source-id=["']([^"']+)["'][^>]*>[\s\S]*?<\/sup>/gi;
  let match: RegExpExecArray | null;
  let nextNumber = 1;

  while ((match = citationRegex.exec(html)) !== null) {
    const sourceId = match[1].trim();
    if (!sourceId) continue;

    const existing = itemBySourceId.get(sourceId);
    if (existing) {
      existing.citationCount += 1;
      existing.occurrenceCount = existing.citationCount;
      continue;
    }

    const source = attachedById.get(sourceId) || repoById.get(sourceId);
    const isOrphaned = !attachedById.has(sourceId);

    if (isOrphaned) {
      orphanedSet.add(sourceId);
    }

    const assignedNumber = nextNumber++;
    numberBySourceId.set(sourceId, assignedNumber);

    const item: ResolvedCitationItem = {
      number: assignedNumber,
      sourceId,
      source,
      isOrphaned,
      citationCount: 1,
      occurrenceCount: 1,
      vancouverText: source
        ? formatVancouverReference(source)
        : `Missing or detached scientific source (${sourceId}) — re-attach or update citation.`,
    };
    itemBySourceId.set(sourceId, item);
    orderedCitations.push(item);
  }

  const uncitedAttachedSources = attachedSources.filter(
    (s) => !itemBySourceId.has(s.id)
  );

  return {
    orderedCitations,
    occurrences: orderedCitations,
    numberBySourceId,
    orphanedSourceIds: Array.from(orphanedSet),
    uncitedAttachedSources,
  };
}

/**
 * Rewrites inline `<sup data-citation-source-id="ID">[...]</sup>` labels in `bodyHtml`
 * so their visible `[N]` numbers match their exact document appearance order (`[1]`, `[2]`, etc.),
 * or `[!N]` when a cited source has been detached/deleted (`SRS-SCI-002`).
 */
export function synchronizeCitationLabelsInHtml(
  bodyHtml: string,
  attachedSources: ScientificSource[],
  allRepositorySources?: ScientificSource[]
): { html: string; analysis: ManuscriptCitationAnalysis } {
  const analysis = analyzeManuscriptCitations(bodyHtml, attachedSources, allRepositorySources);
  const itemBySourceId = new Map(
    analysis.orderedCitations.map((item) => [item.sourceId, item])
  );

  const updatedHtml = (bodyHtml || '').replace(
    /(<sup\b[^>]*\bdata-citation-source-id=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/sup>)/gi,
    (_full, openTag: string, sourceId: string, _inner: string, closeTag: string) => {
      const item = itemBySourceId.get(sourceId.trim());
      if (!item) return `${openTag}[?]${closeTag}`;
      const label = item.isOrphaned ? `[!${item.number}]` : `[${item.number}]`;
      return `${openTag}${label}${closeTag}`;
    }
  );

  return {
    html: updatedHtml,
    analysis,
  };
}
