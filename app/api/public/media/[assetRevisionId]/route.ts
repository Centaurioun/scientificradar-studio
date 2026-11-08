import { createHash } from 'node:crypto';
import { errorResponse } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ assetRevisionId: string }> }) {
  try {
    const assetId = (await params).assetRevisionId;
    const asset = getServerPublishingStore().readPublicMedia(assetId);
    if (!asset) return Response.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const bytes = Buffer.from(asset.bytes);
    if (createHash('sha256').update(bytes).digest('hex') !== assetId) return Response.json({ error: 'MEDIA_INTEGRITY_FAILURE' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    return new Response(bytes, { headers: { 'Content-Type': asset.mime, 'Content-Length': String(bytes.length), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) { return errorResponse(error); }
}
