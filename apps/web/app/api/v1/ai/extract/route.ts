import { NextRequest, NextResponse } from 'next/server';
import { MockAiProvider, InvoiceSchema, performInvoiceCrossChecks } from '@converto/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentType = 'invoice', text } = body;

    const provider = new MockAiProvider();
    const result = await provider.complete({
      system: 'Extract structured financial data into JSON conforming strictly to the requested schema.',
      messages: [{ role: 'user', content: text || 'Invoice sample' }],
      schema: InvoiceSchema,
    });

    const parsed = result.parsed;
    const warnings = performInvoiceCrossChecks(parsed);

    return NextResponse.json({
      data: parsed,
      warnings,
      model: result.model,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 });
  }
}
