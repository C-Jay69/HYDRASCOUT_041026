import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leads — searchable CRM (Step 6 + Step 10 filters).
 * Query params: search, state, county, city, zip, category, status,
 * ownerType, minScore, limit.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const leads = await getStore().listLeads({
    search: sp.get('search') || undefined,
    state: sp.get('state') || undefined,
    county: sp.get('county') || undefined,
    city: sp.get('city') || undefined,
    zip: sp.get('zip') || undefined,
    category: sp.get('category') || undefined,
    status: sp.get('status') || undefined,
    ownerType: sp.get('ownerType') || undefined,
    minScore: sp.get('minScore') ? Number(sp.get('minScore')) : undefined,
    limit: sp.get('limit') ? Number(sp.get('limit')) : 500,
  });
  return NextResponse.json({ leads, count: leads.length });
}
