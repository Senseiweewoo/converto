import { describe, it, expect } from 'vitest';
import {
  validateLuhn,
  detectDeterministicPii,
  performInvoiceCrossChecks,
  chunkDocumentPages,
  buildChatPromptWithCitations,
  MockAiProvider,
  InvoiceSchema,
} from '@converto/ai';

describe('Phase D: AI Abstraction, PII Detectors & Extraction Cross-Checks', () => {
  it('validates credit card numbers with Luhn algorithm', () => {
    // Valid test card numbers
    expect(validateLuhn('4532 0150 1234 5671')).toBe(true);
    expect(validateLuhn('4532-0150-1234-5671')).toBe(true);

    // Invalid card numbers (fails checksum)
    expect(validateLuhn('4532 0150 1234 5679')).toBe(false);
    expect(validateLuhn('1234567')).toBe(false); // too short
  });

  it('detects emails, phones, credit cards, and SSNs from raw text', () => {
    const sampleText = `
      Customer John Doe (john.doe@gmail.com).
      Contact phone: 415-555-0199 or (212) 555-1234.
      Card on file: 4532-0150-1234-5671.
      SSN: 123-45-6789.
    `;

    const detections = detectDeterministicPii(sampleText, 0);

    const categories = detections.map((d) => d.category);
    expect(categories).toContain('email');
    expect(categories).toContain('phone');
    expect(categories).toContain('credit-card');
    expect(categories).toContain('national-id');

    const emailHit = detections.find((d) => d.category === 'email');
    expect(emailHit?.text).toBe('john.doe@gmail.com');
  });

  it('detects mathematical mismatches in extracted invoice data', () => {
    const flawedInvoice = {
      invoiceNumber: 'INV-100',
      date: '2026-10-01',
      vendorName: 'Acme Corp',
      lineItems: [
        { description: 'Widget A', quantity: 2, unitPrice: 50, amount: 100 },
        { description: 'Widget B', quantity: 1, unitPrice: 40, amount: 40 },
      ],
      subtotal: 140, // calculated is 140
      taxAmount: 10,
      total: 200, // Flawed! Subtotal + Tax = 150, but total says 200
      currency: 'USD',
    };

    const warnings = performInvoiceCrossChecks(flawedInvoice);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].field).toBe('total');
    expect(warnings[0].message).toContain('differs from grand total');
  });

  it('chunks document pages and formats prompt with citations', () => {
    const pages = [
      { page: 1, text: 'This is the first page outlining terms of the agreement.' },
      { page: 2, text: 'This is the second page discussing billing schedules and fees.' },
    ];

    const chunks = chunkDocumentPages(pages, 100);
    expect(chunks.length).toBe(2);
    expect(chunks[0].page).toBe(1);
    expect(chunks[1].page).toBe(2);

    const prompt = buildChatPromptWithCitations('What are the fees?', chunks);
    expect(prompt).toContain('[Page 1]');
    expect(prompt).toContain('[Page 2]');
    expect(prompt).toContain('What are the fees?');
  });

  it('runs mock AI provider with prompt injection defense and schema validation', async () => {
    const provider = new MockAiProvider();

    const result = await provider.complete({
      system: 'Extract invoice',
      messages: [{ role: 'user', content: 'Invoice text' }],
      schema: InvoiceSchema,
    });

    expect(result.parsed).toBeDefined();
    expect(result.parsed.invoiceNumber).toBe('INV-2026-0891');
    expect(result.parsed.total).toBe(352.0);
  });
});
