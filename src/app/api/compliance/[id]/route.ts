import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';
import { uid } from '@/lib/automation/rng';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/compliance/[id] — remove an entry from the Do-Not-Contact list
 * (e.g. the contact opted back in and provided written consent).
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const suppressions = await store.listSuppressions();
  const record = suppressions.find((s) => s.id === id);
  const removed = await store.removeSuppression(id);
  if (!removed) {
    return NextResponse.json({ error: 'Suppression record not found' }, { status: 404 });
  }
  await store.addConsentEvent({
    id: uid('ce_'),
    leadId: record?.leadId ?? null,
    buyerId: null,
    type: 'opt_in',
    channel: record?.type === 'email' ? 'email' : 'sms',
    value: record?.value ?? null,
    detail: `Removed from Do-Not-Contact list by admin: ${record?.value ?? id}${record?.leadId ? ` — lead ${record.leadId}` : ''}. Outreach may resume.`,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ removed: true });
}
