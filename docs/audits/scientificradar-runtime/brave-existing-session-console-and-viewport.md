# Sanitized live-Brave evidence — ScientificRadar local app

Observation time: 2026-11-01 00:58 UTC / 03:58 Europe/Istanbul.
Browser: existing installed Brave 156.1.98.60, Chromium 156.0.8078.48; user tab remained open.
URL: `http://127.0.0.1:4175/articles/art-amoc-mooring-2026/edit` during editor observations; returned to `/dashboard`.
Automation: attached through existing Brave extension tab control; no separate browser process/profile launched.

Console warnings (two observations after editor navigation and reload):

```text
2026-11-01T00:58:05.691Z warn [tiptap warn]: Duplicate extension names found: ['link', 'underline']. This can lead to issues.
2026-11-01T00:58:29.506Z warn [tiptap warn]: Duplicate extension names found: ['link', 'underline']. This can lead to issues.
```

Measured dashboard viewport: `innerWidth=2520`, `innerHeight=1187`, `clientWidth=2520`, `scrollWidth=2520`. This is not one of the required target sizes.

Source candidate: [`components/editor/article-tiptap-editor.tsx` (lines 57–72)](https://github.com/Centaurioun/scientificradar-studio/blob/083b30a6ea9070372ca86484994ca5ccb0bef12d/components/editor/article-tiptap-editor.tsx#L57-L72) registers `Underline` and `LinkExtension` alongside `StarterKit`; root cause remains a candidate pending controlled confirmation.

Safety: the browser profile was `Personal` and contained existing local app records. This continuation was read-only; no editor fields, role selector, schedule, upload or import was changed. No production/external URL was opened.
