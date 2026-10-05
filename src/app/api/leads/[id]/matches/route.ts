import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';
import { matchBuyers } from '@/lib/automation/buyers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leads/[id]/matches — rank the buyer network against a lead.
 * Query: top=N (default 5), includeInactive=true to score inactive buyers too.
 * Returns matches sorted by score with human-readable reasons.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const lead = await store.getLead(id);
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const top = sp.get('top') ? Math.max(1, Number(sp.get('top'))) : 5;
  const includeInactive = sp.get('includeInactive') === 'true';

  const buyers = await store.listBuyers(false);
  const all = matchBuyers(lead, buyers, !includeInactive);
  const matches = all.slice(0, top).map((m) => ({
    buyer: m.buyer,
    score: m.score,
    reasons: m.reasons,
  }));

  return NextResponse.json({
    leadId: lead.id,
    matches,
    totalBuyersScored: all.length,
  });
}
