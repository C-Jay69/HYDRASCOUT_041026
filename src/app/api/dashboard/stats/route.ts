import { NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/** GET /api/dashboard/stats — Step 9 dashboard metrics. */
export async function GET() {
  const store = getStore();
  const stats = await store.getStats();
  return NextResponse.json({ stats, backend: store.backend });
}
