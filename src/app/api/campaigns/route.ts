import { NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/** GET /api/campaigns — campaigns created by automation runs. */
export async function GET() {
  const campaigns = await getStore().listCampaigns();
  return NextResponse.json({ campaigns });
}
