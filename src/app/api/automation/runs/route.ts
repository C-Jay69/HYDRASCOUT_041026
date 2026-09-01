import { NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/** GET /api/automation/runs — list all automation runs (most recent first). */
export async function GET() {
  const runs = await getStore().listRuns();
  return NextResponse.json({ runs });
}
