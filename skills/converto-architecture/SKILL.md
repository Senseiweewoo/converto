---
name: converto-architecture
description: Core architecture, folder structure, and coding conventions for Converto, a privacy-first, local-first PDF toolkit (Next.js + TypeScript + Web Workers + pdf-lib/pdf.js/WASM). Use this skill whenever working on the Converto codebase, planning a Converto feature, deciding where code belongs, choosing between browser-side and server-side processing, or reviewing Converto code, even if the user only says "the PDF app", "our toolkit", or "add a feature to the project".
---

# Converto architecture

Converto is a free PDF toolkit whose headline promise is privacy: files are processed in the user's browser by default. Every design decision follows from that promise, so read this before writing code.

## Decision rule: local or server?

Default to local. Move work to the server only when it genuinely cannot run in the browser, and when it does, surface that to the user before upload.

| Work | Where | Why |
|---|---|---|
| merge, split, rotate, crop, page numbers, watermark, organize, protect, unlock, sign, forms, compare, image<->PDF | Local (Web Worker) | pdf-lib / pdf.js / qpdf-wasm handle it |
| compress, compress-to-target | Local | MuPDF/Ghostscript WASM + canvas re-encoding |
| OCR | Local (Tesseract.js) by default; Server OCR as opt-in "high accuracy" | Local keeps privacy; server is better on poor scans |
| Word/PowerPoint/Excel to PDF, PDF to Word/PPT/Excel | Server | No reliable browser engine for Office layout |
| AI: summarize, translate, chat, extraction, auto-redaction detection | Server (LLM API) | Keys must never reach the client |
| Secure share links | Server | Needs storage and expiry |

If unsure, ask the user before choosing server. Never silently upload.

## Folder structure

```
converto/
├── apps/
│   ├── web/                 # Next.js App Router frontend
│   │   ├── app/             # routes: /, /tools/[slug], /workflows, /share/[id]
│   │   ├── components/      # UI components (design-system primitives in components/ui)
│   │   ├── lib/             # client utilities (workspace store, i18n, storage)
│   │   └── workers/         # Web Worker entry points
│   └── api/                 # Fastify/FastAPI server (server-only features)
├── packages/
│   ├── core/                # PDF operations, framework-agnostic, no DOM access
│   ├── tools/               # one folder per tool (plugin interface below)
│   ├── workflow/            # pipeline engine used by tool chaining and saved workflows
│   └── ai/                  # provider-agnostic AI interface + prompts
├── fixtures/                # test PDFs (see converto-testing)
└── docs/
```

`packages/core` must not import from `apps/*` and must not touch `window`/`document`, so it can run in Workers, Node (CLI), and tests.

## Tool plugin interface

Every tool is a self-contained plugin so it can be reused by the UI, the workflow engine, the CLI and the API. See converto-tool-builder for the full procedure.

```ts
export interface ConvertoTool<S = unknown> {
  id: string;                         // kebab-case, matches URL slug
  category: 'organize' | 'optimize' | 'convert-to' | 'convert-from' | 'edit' | 'security' | 'intelligence';
  runtime: 'local' | 'server' | 'ai'; // drives the privacy badge
  inputs: { accept: string[]; min: number; max: number };
  settingsSchema: ZodSchema<S>;       // single source of truth for UI + validation
  run(files: WorkspaceFile[], settings: S, ctx: RunContext): Promise<ToolResult>;
  preview?(files: WorkspaceFile[], settings: S): Promise<PreviewResult>;
}
```

`RunContext` provides `onProgress(0..1)`, `signal` (AbortSignal, so Cancel works), and `log()` (never log file content).

## Workspace model

Files live in an in-session workspace backed by IndexedDB. Each tool run produces a new `WorkspaceFile` version linked to its parent, which powers tool chaining, undo/redo and the history timeline. Never mutate a file in place; always create a new version.

## Conventions

- TypeScript strict; no `any` without a comment explaining why.
- Validate every setting with Zod at the boundary.
- Heavy work (anything over ~50 ms) runs in a Web Worker; transfer ArrayBuffers instead of copying.
- Large files: stream or process page-by-page; never hold more than necessary in memory.
- Errors are typed (`PasswordRequiredError`, `CorruptPdfError`, `UnsupportedFeatureError`) and each maps to a human message with a suggested fix.
- No file content, filenames or metadata in logs or analytics.
- Check each dependency's license before adding it. Flag AGPL/GPL (MuPDF, Ghostscript, some qpdf builds) to the user, because they affect how the product can be distributed.
- Keep user-facing strings in i18n files from the start, never hard-coded.

## Definition of done for any feature

1. Works locally unless a server need was agreed with the user.
2. Has a settings schema, progress, cancel, and a human-readable result summary.
3. Has unit tests and passes the edge-case fixtures (see converto-testing).
4. Privacy badge is correct; any upload has an explicit consent step.
5. Keyboard accessible and screen-reader labelled.
6. Strings externalized for translation.
