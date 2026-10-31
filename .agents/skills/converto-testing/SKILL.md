---
name: converto-testing
description: Testing strategy, fixture PDFs, edge cases, and quality gates for Converto's PDF tools. Use this skill whenever writing or reviewing tests for Converto, adding fixtures, verifying a new tool, debugging a corrupt-file or large-file bug, setting up unit/e2e/accessibility/performance tests or CI, or when the user asks "how do we test this", "what could break", or "is this ready to ship".
---

# Converto testing

PDFs in the wild are messy. Most production bugs come from unusual files, not unusual code, so the fixture set matters more than the test count.

## Test layers

1. **Unit (Vitest/Jest) on `packages/core`:** every PDF operation, bytes in and bytes out, no DOM. Fast and deterministic.
2. **Tool integration:** run each plugin through the same path the UI uses (worker, progress, abort).
3. **E2E (Playwright):** the top user flows in real browsers (Chromium, Firefox, WebKit, and a mobile viewport).
4. **Accessibility:** axe-core on every tool page plus keyboard-only passes on key flows.
5. **Performance:** large-file and memory budgets measured in CI.
6. **AI evaluation:** small document+expected-answer sets per AI feature (see converto-ai-features).

## Fixture library (`/fixtures`)

Keep small, license-clean files. Name by what they test.

| Fixture | Purpose |
|---|---|
| `simple-1p.pdf`, `text-10p.pdf` | baseline |
| `empty-or-blank-pages.pdf` | blank page detection, edge ranges |
| `encrypted-user-pw.pdf`, `encrypted-owner-only.pdf` | password prompts, unlock, permissions |
| `corrupt-truncated.pdf`, `corrupt-xref.pdf` | repair and graceful errors |
| `scanned-300dpi.pdf`, `scanned-skewed.pdf`, `scanned-low-contrast.pdf` | OCR, cleanup studio |
| `mixed-orientation.pdf`, `mixed-page-sizes.pdf` | rotate, merge, page numbers |
| `forms-acroform.pdf`, `forms-xfa-unsupported.pdf` | fill, flatten, clear unsupported message |
| `rtl-arabic.pdf`, `cjk-japanese.pdf`, `filipino-diacritics.pdf` | fonts, search, translate, watermark text |
| `bookmarks-links.pdf`, `attachments.pdf`, `layers.pdf` | preservation and scrubbing |
| `big-images-200mb.pdf` (generate in CI, don't commit) | memory and compression |
| `many-pages-2000.pdf` (generate) | performance, thumbnails |
| `injection-attempt.pdf` | prompt-injection tests |
| `pii-sample.pdf` (fake data only) | redaction and extraction |

Never commit real personal documents. Generate synthetic ones.

## What every tool test must cover

- Happy path with default settings.
- Boundaries: first/last page, one-page file, empty range, reversed range, duplicates in range list.
- Encrypted input: asks for password, correct and wrong password paths.
- Corrupt input: typed error with suggested fix, no crash, no partial download.
- Cancel mid-run: no leaked worker, no half-written workspace version.
- Output validity: reopen with a second parser (pdf.js and qpdf --check) to confirm the file is valid.
- Preservation: text selectable, links/bookmarks/forms kept where promised, with warnings where not.
- Idempotence where relevant: running twice doesn't degrade further.

## Special verifications

- **Redaction:** extract text from output and assert redacted strings are absent, including from annotations, metadata and embedded files.
- **Metadata scrub:** assert Info dict, XMP, attachments, comments, hidden layers and image EXIF/GPS are gone.
- **Compress-to-target:** assert size under target when feasible, plus a visual-diff threshold (SSIM) against the original; assert the "can't reach target" path reports the achievable minimum.
- **Compare:** known edited pair yields the expected changed regions.
- **Privacy:** Playwright intercepts network traffic; assert local tools make zero requests carrying file data (compare request bodies and sizes against input).
- **Share links:** expiry, revoke, password, download limit, and deletion from storage.

## E2E top flows (minimum set)

1. Merge three files, reorder, download.
2. Compress to under 1 MB with preview.
3. Unlock then merge then compress via tool chaining.
4. Split by ranges, download ZIP.
5. Scan with camera mock, cleanup, OCR, search the output.
6. Fill a form, sign, flatten.
7. Redact manually, verify text removal.
8. Smart Fix on a messy file, "Fix everything".
9. Build and run a custom workflow on a batch of 20 files.
10. Create and open a secure share link, then revoke it.

## Performance budgets (adjust after measuring)

- First tool interaction under 2 s on a mid-range phone profile.
- 100 MB file merge/compress completes without exceeding ~1.5 GB tab memory; UI stays responsive (no main-thread blocks over 100 ms).
- Thumbnails for a 2000-page file render lazily and don't block.

## CI gates

Type-check, lint, unit, integration, e2e (smoke on PRs, full nightly), axe-core, dependency audit, bundle-size check, license check for new dependencies, and a build that fails if any local tool imports a network client.

## Reporting a bug in a PDF operation

Capture: file characteristics (size, pages, producer, encrypted, scanned), tool and settings, browser/OS, and a minimal synthetic reproduction. Never ask users to send real documents; ask for the producing app and characteristics instead.
