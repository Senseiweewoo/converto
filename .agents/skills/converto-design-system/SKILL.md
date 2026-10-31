---
name: converto-design-system
description: Brand, UX patterns, page templates, copywriting tone and accessibility standards for the Converto PDF toolkit. Use this skill whenever building or reviewing any Converto UI, including the homepage, tool pages, result screens, workflow builder, error messages, onboarding, pricing, dark mode, mobile layout, microcopy, or accessibility fixes, and whenever the user asks how Converto should look, feel, or read.
---

# Converto design system

Converto should feel friendly, fast and trustworthy. Users arrive with a small, slightly stressful task ("I need this under 1 MB by 5 pm"). The UI's job is to get them to a finished file with the least thinking.

For general visual-craft guidance (typography, spacing, avoiding templated looks), also consult the frontend-design skill if available; this file defines Converto-specific decisions.

## Brand

- Name: Converto. Tagline: "Convert, edit and fix any PDF, privately."
- Personality: calm, competent, plain-spoken. Never gimmicky, never fear-based.
- One strong accent color, neutral grays, rounded cards (12-16px radius), generous whitespace, simple wordmark.
- Light and dark themes via CSS variables/tokens; both must pass contrast.

## Tool page template (use for every tool)

1. **Header:** tool name, one-line promise, privacy badge.
2. **Drop zone:** large; also file picker, paste, URL import, cloud import. Accepts folders for batch tools.
3. **File list with thumbnails:** reorder by drag, remove, per-file status.
4. **Settings panel:** defaults pre-filled; advanced options collapsed. Right column on desktop, bottom sheet on mobile.
5. **Primary action button:** verb + object ("Compress PDF"), disabled until valid.
6. **Progress:** determinate bar, estimated time, Cancel. Never a bare spinner for more than 2 seconds.
7. **Result screen:** plain-language summary ("Reduced from 8.4 MB to 1.1 MB, 12 pages, text kept"), Download (primary), "Continue with..." chips for chaining, Share link, "Save as workflow step", Undo.
8. **Below the fold:** 3-step how-to, FAQ, related tools (also serves SEO).

## Homepage

Search box first ("What do you want to do with your PDF?"), Smart Fix drop zone, tool grid grouped by category with Local/Server/AI badges, then Workflows, privacy promise, Pro, API. No signup wall anywhere in the first-use path.

## Microcopy rules

- Say what happened and what to do next. Bad: "Error 422". Good: "This PDF is password protected. Enter the password to continue."
- Use verbs on buttons, sentence case, no exclamation-mark overload.
- Be exact about privacy: "Processed on your device" vs "Sent to our server and deleted within 1 hour".
- Don't promise quality you can't guarantee: "Layout is preserved as closely as possible; complex tables may need touch-ups."
- Numbers in results are specific and human ("12 pages", "1.1 MB").

## Mobile

Mobile-first. Touch targets at least 44x44 px, primary action in a sticky bottom bar, camera capture entry point for scan tools, no hover-only interactions, drag-and-drop always has a tap alternative (move up/down buttons).

## Accessibility (target WCAG 2.2 AA)

- Everything operable by keyboard; visible focus rings; logical focus order; focus moved to result heading when a job completes.
- Drag-and-drop reordering has a keyboard alternative.
- Progress and results announced via `aria-live="polite"`.
- Color is never the only signal (badges have text/icons).
- Respect `prefers-reduced-motion` and `prefers-color-scheme`; provide a high-contrast option.
- Form fields have visible labels and error text linked via `aria-describedby`.
- PDF thumbnails have meaningful alt text ("Page 3 of 12").
- Test with axe-core in CI plus manual screen-reader passes on the top flows.

## Internationalization

All strings via i18n keys. Plan for text expansion (German, Filipino run long), RTL (Arabic) using logical CSS properties (`margin-inline-start`), locale-aware number/date/size formatting, and no text baked into images.

## Components to build once and reuse

DropZone, FileCard, PageThumbnailGrid, SettingsPanel, ProgressBar, ResultSummary, PrivacyBadge, ToolChips, ConsentDialog, WorkflowStepCard, EmptyState, ErrorPanel (with suggested fix button), Toast, CompareSlider.

## Don'ts

No ads in the tool flow, no fake countdowns or scarcity, no pre-checked upsells, no forced signup to download, no surprise watermarks, no interstitials between "Download" and the file.
