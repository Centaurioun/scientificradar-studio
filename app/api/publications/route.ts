import { errorResponse, noStoreJson } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { return noStoreJson(getServerPublishingStore().listPublications()); }
  catch (error) { return errorResponse(error); }
}
