import { NextRequest, NextResponse } from 'next/server';
import { getServerShare, revokeServerShare, recordServerShareDownload } from '@/lib/server-share-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
  }

  const record = getServerShare(id);
  if (!record) {
    return NextResponse.json({ error: 'Share link has expired, was revoked, or does not exist.' }, { status: 404 });
  }

  const url = new URL(req.url);
  const passwordParam = url.searchParams.get('pwd');
  const isDownload = url.searchParams.get('download') === '1';

  // Check password if configured
  if (record.passwordHash) {
    if (!passwordParam) {
      return NextResponse.json({
        id: record.id,
        filename: record.filename,
        requiresPassword: true,
        isViewOnly: record.isViewOnly,
      });
    }

    const providedHash = Buffer.from(passwordParam).toString('base64');
    if (providedHash !== record.passwordHash) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }
  }

  if (isDownload) {
    if (record.isViewOnly) {
      return NextResponse.json({ error: 'This document is view-only.' }, { status: 403 });
    }
    const allowed = recordServerShareDownload(record.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Download limit has been exceeded.' }, { status: 410 });
    }
  }

  return NextResponse.json({
    id: record.id,
    filename: record.filename,
    dataBase64: record.dataBase64,
    fileSizeBytes: record.fileSizeBytes,
    isViewOnly: record.isViewOnly,
    maxDownloads: record.maxDownloads,
    downloadCount: record.downloadCount,
    expiresAt: record.expiresAt,
    requiresPassword: false,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = revokeServerShare(id);
  return NextResponse.json({
    success,
    message: success ? `Share link ${id} revoked.` : 'Share not found.',
  });
}
