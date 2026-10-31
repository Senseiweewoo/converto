import { NextRequest, NextResponse } from 'next/server';
import { MockAiProvider, PROMPT_INJECTION_DEFENSE_HEADER } from '@converto/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, chunks } = body;

    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    // In production, instantiate OpenAI / Claude / Gemini provider using process.env
    // MockAiProvider handles zero-key local environments deterministically
    const provider = new MockAiProvider();

    const formattedContext = (chunks || [])
      .map((c: any) => `[Page ${c.page}]: ${c.text}`)
      .join('\n\n');

    const result = await provider.complete({
      system: `${PROMPT_INJECTION_DEFENSE_HEADER}\nYou are Converto AI, a document analysis assistant. Always cite sources as [Page X].`,
      messages: [
        {
          role: 'user',
          content: `Document Context:\n${formattedContext}\n\nQuestion: ${question}`,
        },
      ],
      maxTokens: 500,
    });

    return NextResponse.json({
      answer: result.content,
      tokensUsed: result.tokensUsed,
      model: result.model,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
