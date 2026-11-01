'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudio } from '@/lib/studio-context';
import { MediaAsset, MediaKind } from '@/lib/types';
import { getMediaDisplayPolicy } from '@/lib/editorial-rules';
import { AppShell } from '@/components/layout/app-shell';
import {
  Plus,
  Image as ImageIcon,
  Lock,
  Unlock,
  Plug,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function MediaLibraryPage() {
  const { media, addMediaAsset, updateMediaAsset, deleteMediaAsset } = useStudio();

  const [selectedAssetId, setSelectedAssetId] = useState<string>(media[0]?.id || '');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [newKind, setNewKind] = useState<MediaKind>('scientific_figure');
  const [newAltText, setNewAltText] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newCredit, setNewCredit] = useState('ScientificRadar Lab Graphics');
  const [newLicence, setNewLicence] = useState('CC BY 4.0');

  const selectedAsset: MediaAsset | undefined = media.find((m) => m.id === selectedAssetId) || media[0];
  const selectedPolicy = selectedAsset ? getMediaDisplayPolicy(selectedAsset) : null;

  const handleCreateDemoAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420"><rect width="800" height="420" fill="#0f172a"/><polyline fill="none" stroke="#14b8a6" stroke-width="3" points="80,320 200,260 320,180 440,210 560,120 700,90"/><text x="80" y="60" fill="#f8fafc" font-family="monospace" font-size="15" font-weight="bold">${newTitle
      .replace(/[<>&]/g, '')
      .slice(0, 48)}</text><text x="80" y="370" fill="#94a3b8" font-family="monospace" font-size="12">Local Demo Storage · Preset Variant Preview</text></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    const created = addMediaAsset({
      filename: newFilename.trim() || `${newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`,
      title: newTitle.trim(),
      kind: newKind,
      src: dataUri,
      altText: newAltText.trim(),
      caption: newCaption.trim(),
      credit: newCredit.trim(),
      licence: newLicence.trim(),
    });
    setSelectedAssetId(created.id);
    setNewTitle('');
    setNewFilename('');
    setNewAltText('');
    setNewCaption('');
    setUploadModalOpen(false);
  };

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const allowedMimes = new Set([
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/avif',
      'image/svg+xml',
    ]);
    const mime = file.type || 'image/png';
    if (!allowedMimes.has(mime)) {
      setUploadError(
        `Unsupported media format (${mime}). Allowed formats: PNG, JPEG, WebP, AVIF, SVG.`
      );
      e.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File exceeds 8 MB local IndexedDB media limit.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl.startsWith('data:image/')) {
        setUploadError('Failed to encode image file as a durable data URI.');
        return;
      }
      const probe = new window.Image();
      probe.onload = () => {
        const created = addMediaAsset({
          filename: file.name,
          title: file.name.replace(/\.[^.]+$/, ''),
          kind: 'scientific_figure',
          src: dataUrl,
          mime,
          width: probe.naturalWidth || 1200,
          height: probe.naturalHeight || 675,
          byteSize: file.size,
          altText: `Uploaded figure: ${file.name}`,
        });
        setSelectedAssetId(created.id);
      };
      probe.onerror = () => {
        const created = addMediaAsset({
          filename: file.name,
          title: file.name.replace(/\.[^.]+$/, ''),
          kind: 'scientific_figure',
          src: dataUrl,
          mime,
          byteSize: file.size,
          altText: `Uploaded figure: ${file.name}`,
        });
        setSelectedAssetId(created.id);
      };
      probe.src = dataUrl;
    };
    reader.onerror = () => {
      setUploadError('Could not read selected file from disk.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <AppShell
      title="Media Library"
      breadcrumbs={[{ label: 'Media Library' }]}
      actions={
        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-medium cursor-pointer">
            <span>Upload Local File</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-[#087f83] hover:bg-[#086b70] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scientific Figure</span>
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
        {/* Truthful Storage Adapter Banner (Spec §11, AT-18) */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Plug className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Storage Adapter: Local Demo Storage (IndexedDB)
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-2">
                Cloudflare R2 Standard &amp; Cloudflare Image Transformations (5,000 free monthly unique transforms) are not connected in P0.
              </span>
            </div>
          </div>
          <Link
            href="/settings/integrations"
            className="text-[#087f83] dark:text-teal-400 font-medium hover:underline whitespace-nowrap"
          >
            Configure R2 in P1 →
          </Link>
        </div>

        {uploadError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Media Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {media.map((asset) => {
              const policy = getMediaDisplayPolicy(asset);
              const isSelected = selectedAsset?.id === asset.id;
              const missingAlt = !asset.altText || asset.altText.trim().length < 10;

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`rounded-lg border bg-white dark:bg-[#111c22] overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#087f83] ring-2 ring-[#087f83]/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="h-44 bg-slate-950 flex items-center justify-center p-2 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.src}
                      alt={asset.altText || asset.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full ${
                        policy.objectFit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />
                  </div>
                  <div className="p-3.5 space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {asset.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{asset.kind}</span>
                      <span>Layout: {asset.layout}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {missingAlt ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Missing verified alt text</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Alt text verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 5 Columns: Selected Asset Inspector & Responsive Preset Preview */}
          {selectedAsset && selectedPolicy && (
            <div className="lg:col-span-5 bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedAsset.title}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    {selectedAsset.filename} · {selectedAsset.width}×{selectedAsset.height}px
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMediaAsset(selectedAsset.id)}
                  aria-label={`Delete media ${selectedAsset.title}`}
                  className="p-1.5 rounded text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                <strong>Crop &amp; Integrity Policy:</strong> {selectedPolicy.policyLabel}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Media Kind
                </label>
                <select
                  value={selectedAsset.kind}
                  onChange={(e) =>
                    updateMediaAsset(selectedAsset.id, { kind: e.target.value as MediaKind })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="scientific_figure">Scientific Figure (Default Contain / No Crop)</option>
                  <option value="chart">Data Chart / Plot (Default Contain / No Crop)</option>
                  <option value="diagram">Technical Diagram (Default Contain / No Crop)</option>
                  <option value="photograph">Editorial Photograph (Cover with Focal Point)</option>
                  <option value="illustration">Illustration</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Inline Placement &amp; Lock Control (AT-19)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['auto', 'manual', 'locked'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateMediaAsset(selectedAsset.id, { layout: mode })}
                      className={`py-1.5 px-2 rounded border font-medium flex items-center justify-center gap-1 ${
                        selectedAsset.layout === mode
                          ? 'border-[#087f83] bg-[#087f83] text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mode === 'locked' ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{mode} Layout</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="media-alt-input"
                  className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  Verified Alt Text
                </label>
                <textarea
                  id="media-alt-input"
                  rows={3}
                  value={selectedAsset.altText}
                  onChange={(e) =>
                    updateMediaAsset(selectedAsset.id, { altText: e.target.value })
                  }
                  placeholder="Describe visible scientific data, axes, and units..."
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="media-caption-input"
                  className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  Figure Caption
                </label>
                <input
                  id="media-caption-input"
                  type="text"
                  value={selectedAsset.caption || ''}
                  onChange={(e) =>
                    updateMediaAsset(selectedAsset.id, { caption: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Attribution / Credit
                  </label>
                  <input
                    type="text"
                    value={selectedAsset.credit || ''}
                    onChange={(e) =>
                      updateMediaAsset(selectedAsset.id, { credit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Licence
                  </label>
                  <input
                    type="text"
                    value={selectedAsset.licence || ''}
                    onChange={(e) =>
                      updateMediaAsset(selectedAsset.id, { licence: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Finite Responsive Preset Definitions (Zero Manual Pixel Resizing)
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-500">
                  <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    hero: 1600×900 (format=auto)
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    article: max 1200w
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    card: 640×360
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    thumb: 320×180
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Scientific Figure Modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateDemoAsset}
              aria-label="Add Scientific Figure to Local Demo Storage"
              className="bg-white dark:bg-[#111c22] border border-slate-200 dark:border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-3 text-xs shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#087f83]" />
                  <span>Add Media Asset (Local Demo Storage)</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div>
                <label htmlFor="modal-fig-title" className="block font-medium mb-1">
                  Figure / Media Title *
                </label>
                <input
                  id="modal-fig-title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Cryogenic Bolometer Spectral Response Curve"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="modal-fig-kind" className="block font-medium mb-1">
                    Media Kind
                  </label>
                  <select
                    id="modal-fig-kind"
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as MediaKind)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="scientific_figure">Scientific Figure</option>
                    <option value="chart">Chart / Plot</option>
                    <option value="diagram">Diagram</option>
                    <option value="photograph">Photograph</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="modal-fig-filename" className="block font-medium mb-1">
                    Filename
                  </label>
                  <input
                    id="modal-fig-filename"
                    type="text"
                    value={newFilename}
                    onChange={(e) => setNewFilename(e.target.value)}
                    placeholder="bolometer-response.svg"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-fig-alt" className="block font-medium mb-1">
                  Alt Text Description
                </label>
                <textarea
                  id="modal-fig-alt"
                  rows={2}
                  value={newAltText}
                  onChange={(e) => setNewAltText(e.target.value)}
                  placeholder="Describe visible axes, curves, and units..."
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#087f83] text-white font-semibold"
                >
                  Save to Local Demo Library
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
