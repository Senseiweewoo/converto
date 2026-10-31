---
name: converto-tool-builder
description: Step-by-step procedure for adding or modifying a PDF tool in Converto (merge, split, compress, rotate, watermark, sign, redact, OCR, convert, etc.) using the tool plugin interface, Web Workers, pdf-lib, pdf.js and WASM engines. Use this skill whenever the user asks to build, add, fix, extend, or optimize any individual PDF tool or PDF operation in the Converto project, including "add a crop tool", "make compress hit a target size", or "support a new file format".
---

# Building a Converto tool

Follow this order. Skipping the early steps is how tools end up uploading files they didn't need to or freezing the browser.

## 1. Classify the tool

Decide `runtime` (local, server, ai) using the decision table in converto-architecture. Pick the category and a kebab-case `id`. If server or AI is required, tell the user why and confirm before building.

## 2. Define the settings schema first

Write the Zod schema before any UI. The same schema drives the settings panel, validation, workflow-builder forms, CLI flags, and API parameters.

```ts
export const settings = z.object({
  mode: z.enum(['ranges', 'every-n', 'by-size']).default('ranges'),
  ranges: z.string().regex(/^[\d,\-\s]+$/).optional(),
  everyN: z.number().int().min(1).optional(),
});
```

Choose sensible defaults so the tool works with one click.

## 3. Implement the operation in packages/core

- Pure functions: bytes in, bytes out. No DOM, no network.
- Accept an `AbortSignal` and an `onProgress` callback; check `signal.aborted` between pages.
- Process page by page for large documents.
- Preserve what users expect to survive: text selectability, bookmarks, links, form fields, metadata (unless the tool's purpose is to remove them). If an operation cannot preserve something, return a warning in `ToolResult.warnings` rather than silently dropping it.

Engine choice guidance:
- **pdf-lib**: structural edits (merge, split, rotate, crop, page numbers, watermark, forms, metadata). Pure JS, easy in workers.
- **pdf.js**: rendering, thumbnails, text extraction, search, text positions for redaction and compare.
- **qpdf (WASM)**: encryption/decryption, repair, linearization, object-stream rewriting.
- **MuPDF or Ghostscript (WASM)**: compression, PDF/A, robust rendering. Both are AGPL or similar; flag licensing to the user.
- **Canvas / OffscreenCanvas**: image re-encoding, deskew, cleanup.
- **Tesseract.js**: local OCR; run in its own worker and lazy-load the language data.

## 4. Wrap it in the plugin

Register `run()` calling the core function inside a Worker. Return a `ToolResult` with:
- output files,
- a plain-language `summary` ("Reduced from 8.4 MB to 1.1 MB, 12 pages, text preserved"),
- `warnings` (non-fatal problems),
- `suggestedNext` (tool ids to chain, e.g. after unlock suggest merge or compress).

## 5. Handle failure like a product, not a stack trace

Map every failure to a typed error with a fix suggestion:
- Encrypted: ask for the password inline and retry.
- Corrupt: offer the Repair tool.
- Too large for memory: say so and suggest splitting first.
- Unsupported feature: explain what and why.

## 6. UI

Use the standard tool page template from converto-design-system: drop zone, thumbnails, settings, progress with cancel, result summary, "continue with another tool" chips, privacy badge, short how-to and FAQ.

## 7. Register everywhere

Add the tool to: the tools registry, homepage grid, search index, workflow builder step list, CLI command list, API route (if exposed), sitemap, and i18n files.

## 8. Test

Run the shared fixtures through the tool (converto-testing). At minimum: a normal file, an encrypted file, a corrupt file, a huge file, a scanned file, an RTL/CJK file, and an empty or one-page file.

## Redaction and metadata rules (high stakes)

Redaction must permanently remove the underlying text and image data, not draw a black box over it. Verify by extracting text from the output and confirming the redacted strings are gone. Metadata scrubbing must cover Info dictionary, XMP, embedded files, annotations/comments, hidden layers, revision history and GPS EXIF in images.

## Compress-to-target-size approach

Binary-search over image quality and downscale resolution, re-encoding images and rewriting object streams each iteration, with a maximum iteration count. Stop when the output is under target or no further gain is possible; in the latter case tell the user the smallest achievable size and what the quality cost is. Always show a before/after preview.
