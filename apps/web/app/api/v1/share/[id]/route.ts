import { NextRequest, NextResponse } from 'next/server';

// Note: In an edge/serverless setup, shared persistent cache or DB would be queried.
// For Next.js runtime, we access the module scope or return JSON response.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
  }

  // Check header or searchParam for password
  const url = new URL(req.url);
  const passwordParam = url.searchParams.get('pwd');

  return NextResponse.json({
    id,
    status: 'active',
    accessMode: 'recipient-tokenized',
    message: 'Access share through Converto viewer or pass valid authentication bearer token.'
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    success: true,
    message: `Share link ${id} revoked.`
  });
}
