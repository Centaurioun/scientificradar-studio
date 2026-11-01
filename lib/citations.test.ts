import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeManuscriptCitations,
  formatVancouverReference,
  synchronizeCitationLabelsInHtml,
} from './citations';
import { ScientificSource } from './types';

const SAMPLE_SOURCES: ScientificSource[] = [
  {
    id: 'src-alpha',
    title: 'Fault-tolerant logical qubits in high-rate quantum LDPC codes',
    authors: 'Bravyi S, Cross AW, Gambetta JM',
    journal: 'Nature',
    year: 2024,
    doi: '10.1038/s41586-024-07107-7',
    url: 'https://doi.org/10.1038/s41586-024-07107-7',
    sourceType: 'peer_reviewed',
    accessDate: '2026-03-01',
    verificationStatus: 'unverified',
    notes: '',
    linkedClaim: 'Quantum LDPC threshold',
    humanClaimVerified: true,
  },
  {
    id: 'src-beta',
    title: 'Cryogenic bolometer readout noise characterization',
    authors: 'Chen L, Patel R',
    journal: 'Physical Review Applied',
    year: 2025,
    doi: '10.1103/PhysRevApplied.23.014002',
    url: 'https://doi.org/10.1103/PhysRevApplied.23.014002',
    sourceType: 'peer_reviewed',
    accessDate: '2026-03-01',
    verificationStatus: 'unverified',
    notes: '',
    linkedClaim: 'Readout noise floor',
    humanClaimVerified: true,
  },
];

test('analyzeManuscriptCitations numbers citations by manuscript appearance order and deduplicates repeated sources (SRS-CITE-001/002)', () => {
  const html = [
    '<p>First we cite Chen et al.<sup data-citation-source-id="src-beta">[Cite]</sup> and then Bravyi et al.<sup data-citation-source-id="src-alpha">[Cite]</sup>.</p>',
    '<p>Re-citing Chen et al.<sup data-citation-source-id="src-beta">[99]</sup> reuses number [1].</p>',
  ].join('');

  const analysis = analyzeManuscriptCitations(
    html,
    SAMPLE_SOURCES,
    SAMPLE_SOURCES
  );

  assert.deepEqual(
    analysis.orderedCitations.map((c) => c.sourceId),
    ['src-beta', 'src-alpha']
  );
  assert.equal(analysis.numberBySourceId.get('src-beta'), 1);
  assert.equal(analysis.numberBySourceId.get('src-alpha'), 2);
  assert.equal(analysis.orphanedSourceIds.length, 0);
  assert.equal(analysis.orderedCitations.length, 2);
  assert.equal(analysis.orderedCitations[0].number, 1);
  assert.equal(analysis.orderedCitations[0].citationCount, 2);
  assert.equal(analysis.orderedCitations[0].source?.id, 'src-beta');
  assert.equal(analysis.orderedCitations[1].number, 2);
  assert.equal(analysis.orderedCitations[1].source?.id, 'src-alpha');
});

test('analyzeManuscriptCitations flags orphaned citations when source is detached or deleted (SRS-CITE-004)', () => {
  const html =
    '<p>Valid citation<sup data-citation-source-id="src-alpha">[1]</sup> and orphaned citation<sup data-citation-source-id="src-missing">[2]</sup>.</p>';

  const attachedOnlyAlpha = [SAMPLE_SOURCES[0]];
  const analysis = analyzeManuscriptCitations(html, attachedOnlyAlpha, SAMPLE_SOURCES);
  assert.deepEqual(analysis.orphanedSourceIds, ['src-missing']);

  const synced = synchronizeCitationLabelsInHtml(html, attachedOnlyAlpha, SAMPLE_SOURCES);
  assert.match(synced.html, /<sup data-citation-source-id="src-alpha">\[1\]<\/sup>/);
  assert.match(synced.html, /<sup data-citation-source-id="src-missing">\[!2\]<\/sup>/);
});

test('formatVancouverReference formats structured Vancouver bibliography citations (SRS-CITE-002)', () => {
  const formatted = formatVancouverReference(SAMPLE_SOURCES[0]);
  assert.match(formatted, /Bravyi S, Cross AW, Gambetta JM\./);
  assert.match(formatted, /Fault-tolerant logical qubits in high-rate quantum LDPC codes\./);
  assert.match(formatted, /Nature\. 2024\./);
  assert.match(formatted, /doi:10\.1038\/s41586-024-07107-7/);
});
