import { NextRequest, NextResponse } from 'next/server';
import { ServerShareRecord, saveServerShare, purgeExpiredShares } from '@/lib/server-share-store';

export async function POST(req: NextRequest) {
  try {
    purgeExpiredShares();

    const body = await req.json();
    const { filename, dataBase64, isViewOnly, password, expiryHours = 24, maxDownloads } = body;

    if (!filename || !dataBase64) {
      return NextResponse.json(
        { error: 'Filename and dataBase64 are required.' },
        { status: 400 }
      );
    }

    // Limit share size on server API to 25MB for security
    const approxBytes = Math.round((dataBase64.length * 3) / 4);
    if (approxBytes > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Document exceeds max server share size limit (25MB).' },
        { status: 413 }
      );
    }

    const id = (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)).replace(/-/g, '');
    const clampedHours = Math.min(Math.max(1, expiryHours), 168); // Max 7 days
    const expiresAt = Date.now() + clampedHours * 60 * 60 * 1000;

    const record: ServerShareRecord = {
      id,
      filename: filename.replace(/[^a-zA-Z0-9._-]/g, '_'),
      fileSizeBytes: approxBytes,
      dataBase64,
      isViewOnly: !!isViewOnly,
      passwordHash: password ? Buffer.from(password).toString('base64') : undefined,
      maxDownloads: maxDownloads ? Math.max(1, maxDownloads) : undefined,
      downloadCount: 0,
      createdAt: Date.now(),
      expiresAt,
      revoked: false,
    };

    saveServerShare(record);

    return NextResponse.json({
      success: true,
      shareId: id,
      shareUrl: `/share/${id}`,
      filename: record.filename,
      expiresAt: new Date(expiresAt).toISOString(),
      maxDownloads: record.maxDownloads,
      isViewOnly: record.isViewOnly,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate secure share link.' },
      { status: 500 }
    );
  }
}
