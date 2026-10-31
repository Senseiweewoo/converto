---
name: converto-ai-features
description: Design and implementation guide for Converto's AI features, covering chat with PDF (with page citations), summarize, translate with layout, structured data extraction from invoices, receipts and bank statements to CSV/XLSX/JSON, and AI auto-redaction of personal data. Use this skill whenever building or changing any LLM-powered PDF feature in Converto, including chunking, retrieval, citations, prompts, structured output validation, review screens, PII detection, cost control, and prompt-injection defense.
---

# Converto AI features

All AI features are server-side (keys never reach the client) and are labeled "Uses AI (file sent to our server)". Follow converto-privacy-security for consent, retention and provider terms.

## Provider abstraction

Put all model calls behind one interface in `packages/ai` so providers and models can be swapped and costs tracked:

```ts
interface AiProvider {
  complete(req: { system: string; messages: Msg[]; schema?: ZodSchema; maxTokens: number }): Promise<AiResult>;
  embed?(texts: string[]): Promise<number[][]>;
}
```

Log token counts and latency per feature (never content). Enforce per-user quotas and a hard per-request token cap.

## Text extraction pipeline (shared by all AI features)

1. Extract text with positions per page (pdf.js in the browser, or server-side equivalent). Keep `{page, text, bbox}` for every text run, because citations and redaction need coordinates.
2. If a page has little or no text, run OCR first and mark those pages `ocr: true` (lower confidence).
3. Normalize: fix hyphenation across line breaks, fix reading order for multi-column pages, keep tables as row/column text where detectable.
4. Chunk by structure (headings, paragraphs, table blocks), about 500-800 tokens with small overlap, each chunk carrying its page range and bboxes.

## Chat with PDF

- Short documents (fit comfortably in context): send the full text with page markers like `[Page 7]`.
- Long documents or multi-document chat: embed chunks, retrieve top-k per question (plus neighbors), and send only those with page markers.
- Require the model to answer only from provided text and to cite as `[doc:page]`. Parse citations; on click, jump to the page and highlight the matching bbox.
- If the answer isn't in the text, the model must say so. Prefer "I couldn't find that in this document" over guessing. Add an evaluation test for this.
- Support follow-ups by keeping a short conversation window; re-retrieve per turn.
- For numeric questions (totals, dates) quote the source text next to the answer so users can verify.

## Summarize

Offer short / medium / detailed and bullets / paragraph. For long documents use map-reduce: summarize sections, then summarize summaries, keeping page references. State when the document was truncated or OCR was low quality.

## Translate with layout

Translate text runs while preserving fonts, positions and sizes. Expect expansion (e.g. English to German/Filipino grows 20-30%); shrink font within limits or reflow the box, and flag overflow. Keep numbers, URLs, and proper nouns intact. Be upfront that complex layouts may need touch-ups. For right-to-left targets, mirror alignment.

## Structured extraction (invoices, receipts, statements, tables)

1. Pick or let the user choose a schema (invoice, receipt, bank statement, generic table, custom). Define it with Zod.
2. Ask the model for JSON that matches the schema only; validate; on failure, retry once with the validation error.
3. Return each field with `value`, `confidence`, and `source` (`page` + `bbox`).
4. **Review screen is mandatory:** show the PDF region beside each field, low-confidence fields flagged, editable values. Users must confirm before export.
5. Cross-checks catch silent errors: line items should sum to the subtotal, subtotal plus tax equals total, dates parse, currency consistent. Surface mismatches as warnings.
6. Export CSV, XLSX, JSON. Allow saving a template for recurring document types, and batch-run it across many files.

## AI auto-redaction

Detection is a suggestion, never an automatic final action.

- Combine deterministic detectors (regex plus checksum for emails, phones, IBANs, card numbers via Luhn, national ID formats) with an LLM/NER pass for names, addresses, and context-dependent items. Deterministic hits get high confidence; model-only hits are marked for review.
- Show all detections highlighted with category filters (names, emails, phones, addresses, IDs, financial, dates of birth, custom keywords). User approves or rejects each, or by category.
- Apply with the permanent-removal procedure in converto-tool-builder, then verify by re-extracting text and confirming removed strings are gone, including in annotations, metadata, and OCR layers.
- Be honest in the UI: automatic detection can miss things, and the user should review the result before sharing.

## Prompt-injection defense

PDF text is untrusted. It may say "ignore previous instructions" or try to exfiltrate data.
- Keep system instructions separate from document content; wrap document text in clearly delimited blocks and tell the model it is data.
- Give the model no tools or actions driven by document content.
- Validate all structured output against schemas; never render model output as HTML without sanitizing.
- Add test PDFs containing injection attempts to the evaluation set.

## Cost and quality controls

- Cache extraction and embeddings per file hash for the retention window.
- Use smaller/cheaper models for classification and detection, larger ones for reasoning-heavy answers.
- Stream chat responses; show progress for long jobs and make them cancelable.
- Maintain a small evaluation set per feature (documents plus expected answers/fields) and run it when changing prompts or models.

## Language

Answer in the language the user asks in, not necessarily the document's language, unless they request otherwise.
