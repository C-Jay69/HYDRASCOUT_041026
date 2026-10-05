import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/** GET /api/leads/[id] — lead detail with communication history, follow-ups & deal. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const lead = await store.getLead(id);
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  const [communications, followUps, deal] = await Promise.all([
    store.listCommunications(id),
    store.listFollowUps(id),
    store.getDealByLead(id),
  ]);
  return NextResponse.json({ lead, communications, followUps, deal: deal ?? null });
}

/** PATCH /api/leads/[id] — update status, notes, tags, follow-up date. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const allowed = ['status', 'notes', 'tags', 'followUpAt'] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided (status, notes, tags, followUpAt)' }, { status: 400 });
  }

  const lead = await getStore().updateLead(id, patch);
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  return NextResponse.json({ lead });
}
