'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  formatEditorialHtmlSource,
  HtmlSourceValidationResult,
  validateAndAnalyzeHtmlSource,
} from '@/lib/html-source';

interface HtmlSourcePanelProps {
  canonicalBodyHtml: string;
  trustedImageSources?: ReadonlySet<string>;
  rawBuffer: string;
  onChangeRawBuffer: (next: string) => void;
  onApplyValidatedHtml: (
    sanitizedHtml: string,
    demotedH1Count: number,
    summaryNote: string
  ) => void;
  onExitToVisual: () => void;
}

export function HtmlSourcePanel({
  canonicalBodyHtml,
  trustedImageSources,
  rawBuffer,
  onChangeRawBuffer,
  onApplyValidatedHtml,
  onExitToVisual,
}: HtmlSourcePanelProps) {
  const [statusBanner, setStatusBanner] = useState<{
    tone: 'emerald' | 'amber' | 'red';
    message: string;
  } | null>(null);
  const [awaitingLossConfirm, setAwaitingLossConfirm] = useState(false);
  const [awaitingDiscardOnBack, setAwaitingDiscardOnBack] = useState(false);

  const formattedCanonical = useMemo(
    () => formatEditorialHtmlSource(canonicalBodyHtml),
    [canonicalBodyHtml]
  );
  const isDirty =
    rawBuffer.trim() !== formattedCanonical.trim() &&
    rawBuffer.trim() !== canonicalBodyHtml.trim();

  const validation: HtmlSourceValidationResult = useMemo(
    () => validateAndAnalyzeHtmlSource(rawBuffer, trustedImageSources),
    [rawBuffer, trustedImageSources]
  );

  const handleValidate = () => {
    setAwaitingLossConfirm(false);
    setAwaitingDiscardOnBack(false);
    if (!validation.validSyntax) {
      setStatusBanner({
        tone: 'red',
        message: `Validation failed with ${
          validation.diagnostics.filter((d) => d.severity === 'error').length
        } syntax error(s). Resolve errors below before applying.`,
      });
      return;
    }
    if (validation.requiresNormalizationConfirm) {
      setStatusBanner({
        tone: 'amber',
        message:
          'HTML syntax is valid, but unsupported or unsafe elements/attributes were detected. Review normalization details below.',
      });
      return;
    }
    setStatusBanner({
      tone: 'emerald',
      message:
        validation.demotedH1Count > 0
          ? `Valid manuscript HTML. Note: ${validation.demotedH1Count} body <h1> tag(s) will be normalized to <h2> on apply.`
          : 'HTML Source passed schema and security validation with zero loss.',
    });
  };

  const handleFormat = () => {
    const formatted = formatEditorialHtmlSource(rawBuffer);
    onChangeRawBuffer(formatted);
    setStatusBanner({
      tone: 'emerald',
      message: 'Formatted block HTML indentation.',
    });
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(rawBuffer);
        setStatusBanner({
          tone: 'emerald',
          message: 'Copied manuscript body HTML to clipboard.',
        });
      }
    } catch {
      setStatusBanner({
        tone: 'amber',
        message: 'Clipboard permission unavailable in this browser context.',
      });
    }
  };

  const handleApply = (confirmedNormalization = false) => {
    setAwaitingDiscardOnBack(false);
    if (!validation.validSyntax) {
      setStatusBanner({
        tone: 'red',
        message:
          'Cannot apply HTML Source while unbalanced tags or invalid LaTeX syntax errors remain.',
      });
      return;
    }

    if (validation.requiresNormalizationConfirm && !confirmedNormalization) {
      setAwaitingLossConfirm(true);
      setStatusBanner({
        tone: 'amber',
        message:
          'Normalization confirmation required: unsupported or unsafe tags/attributes would be stripped or unwrapped. Confirm below to apply.',
      });
      return;
    }

    setAwaitingLossConfirm(false);
    onApplyValidatedHtml(
      validation.sanitizedHtml,
      validation.demotedH1Count,
      confirmedNormalization
        ? 'Applied HTML Source edits with schema/security normalization'
        : 'Applied validated HTML Source edits'
    );
  };

  const handleDiscard = () => {
    onChangeRawBuffer(formatEditorialHtmlSource(canonicalBodyHtml));
    setAwaitingLossConfirm(false);
    setAwaitingDiscardOnBack(false);
    setStatusBanner({
      tone: 'emerald',
      message: 'Discarded unapplied HTML Source edits and restored canonical manuscript body.',
    });
  };

  const handleBackToVisualClick = () => {
    if (!isDirty) {
      onExitToVisual();
      return;
    }
    setAwaitingDiscardOnBack(true);
  };

  return (
    <div
      className="p-4 sm:p-6 space-y-4 bg-slate-50/70 dark:bg-[#0d161b]"
      data-testid="html-source-panel"
    >
      {/* Scope & Safety Disclosure */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Code2 className="w-4 h-4 text-[#087f83] dark:text-teal-400 shrink-0" />
          <span>
            <strong>Manuscript Body HTML Source</strong> — Scoped strictly to{' '}
            <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              article.bodyHtml
            </code>
            . The Article Title above remains the sole page{' '}
            <code className="font-mono text-[11px]">&lt;h1&gt;</code>; body{' '}
            <code className="font-mono text-[11px]">&lt;h1&gt;</code> tags normalize to{' '}
            <code className="font-mono text-[11px]">&lt;h2&gt;</code>.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {isDirty ? (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
              Unapplied Source Edits
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              In Sync with Visual Editor
            </span>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleValidate}
            aria-label="Validate HTML Source"
            className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#087f83]" />
            <span>Validate</span>
          </button>

          <button
            type="button"
            onClick={handleFormat}
            aria-label="Format HTML Source"
            className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Format</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy HTML Source"
            className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy HTML</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty}
            aria-label="Discard HTML Source Changes"
            className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 text-slate-600 dark:text-slate-300 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard Changes</span>
          </button>

          <button
            type="button"
            onClick={() => handleApply(false)}
            aria-label="Apply HTML Source Changes"
            className="px-3 py-1.5 rounded bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>

          <button
            type="button"
            onClick={handleBackToVisualClick}
            aria-label="Back to Visual Editor"
            className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Back to Visual</span>
          </button>
        </div>
      </div>

      {/* Dirty Guard when clicking Back to Visual */}
      {awaitingDiscardOnBack && (
        <div
          role="alert"
          className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              You have unapplied HTML Source edits. Apply them or discard before switching back to
              the Visual Editor.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApply(false)}
              className="px-2.5 py-1 rounded bg-[#087f83] text-white font-semibold"
            >
              Apply &amp; Switch
            </button>
            <button
              type="button"
              onClick={() => {
                handleDiscard();
                onExitToVisual();
              }}
              className="px-2.5 py-1 rounded border border-amber-400 dark:border-amber-700 bg-white dark:bg-slate-900 font-semibold"
            >
              Discard Edits &amp; Switch
            </button>
          </div>
        </div>
      )}

      {/* Loss / Normalization Confirmation Prompt */}
      {awaitingLossConfirm && (
        <div
          role="alert"
          className="p-3.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 text-xs text-amber-950 dark:text-amber-200 space-y-2"
        >
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Schema &amp; Security Normalization Required Before Applying
              </p>
              <p className="text-[11px] mt-0.5">
                Applying this HTML will strip disallowed elements/attributes so the manuscript
                complies with the shared editorial schema. Confirm below if you want to apply the
                normalized HTML, or edit the raw source to keep only supported tags.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApply(true)}
              className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-900 text-white font-semibold"
            >
              Confirm &amp; Apply Normalized HTML
            </button>
            <button
              type="button"
              onClick={() => setAwaitingLossConfirm(false)}
              className="px-2.5 py-1 rounded border border-amber-300 bg-white text-amber-900"
            >
              Keep Editing Source
            </button>
          </div>
        </div>
      )}

      {statusBanner && (
        <div
          role="status"
          className={`p-2.5 rounded-md border text-xs flex items-center gap-2 ${
            statusBanner.tone === 'emerald'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : statusBanner.tone === 'amber'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {statusBanner.tone === 'emerald' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusBanner.message}</span>
        </div>
      )}

      {/* Monospace HTML Source Editor */}
      <div>
        <label htmlFor="manuscript-html-source-textarea" className="sr-only">
          Manuscript Body HTML Source Editor
        </label>
        <textarea
          id="manuscript-html-source-textarea"
          aria-label="Manuscript Body HTML Source Editor"
          rows={18}
          value={rawBuffer}
          onChange={(e) => {
            onChangeRawBuffer(e.target.value);
            setAwaitingLossConfirm(false);
          }}
          spellCheck={false}
          className="w-full p-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#087f83]"
        />
      </div>

      {/* Live Diagnostics Panel */}
      {validation.diagnostics.length > 0 && (
        <div
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c22] p-3 space-y-1.5 text-xs"
          aria-label="HTML Source Validation Diagnostics"
        >
          <div className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider">
            Source Diagnostics ({validation.diagnostics.length})
          </div>
          <ul className="space-y-1">
            {validation.diagnostics.map((diag, idx) => (
              <li
                key={`${diag.code}-${idx}`}
                className={`flex items-start gap-2 text-[11px] ${
                  diag.severity === 'error'
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : diag.severity === 'warning'
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-sky-700 dark:text-sky-300'
                }`}
              >
                <span className="font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                  {diag.severity}
                </span>
                <span>{diag.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
