import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/** GET /api/automation/runs/[id] — run status, stage progress, logs, stats. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const run = await store.getRun(id);
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  const audits = await store.listAudits(id);
  return NextResponse.json({ run, auditCount: audits.length });
}
