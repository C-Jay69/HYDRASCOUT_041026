import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';
import { newBuyer } from '@/lib/automation/buyers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/buyers — list the buyer network.
 * Query: activeOnly=true to exclude inactive buyers.
 */
export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get('activeOnly') === 'true';
  const buyers = await getStore().listBuyers(activeOnly);
  return NextResponse.json({ buyers, count: buyers.length });
}

/**
 * POST /api/buyers — create a buyer with buy-box criteria.
 * Body: { name, company?, email?, phone?, markets?: string[], minPrice?, maxPrice?,
 *         propertyTypes?: string[], financing?, minEquityPercent?, maxRehabBudget?, notes? }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Buyer name is required' }, { status: 400 });
  }
  const email = String(body.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const num = (v: unknown) => {
    const n = Number(v);
    return v === null || v === undefined || v === '' || Number.isNaN(n) ? null : n;
  };

  const buyer = newBuyer({
    name,
    company: String(body.company || '').trim(),
    email,
    phone: String(body.phone || '').trim(),
    markets: Array.isArray(body.markets) ? body.markets.map((m) => String(m).trim()).filter(Boolean) : [],
    minPrice: num(body.minPrice),
    maxPrice: num(body.maxPrice),
    propertyTypes: Array.isArray(body.propertyTypes) ? body.propertyTypes.map((t) => String(t)) : [],
    financing: body.financing === 'cash' || body.financing === 'financing' ? body.financing : 'either',
    minEquityPercent: num(body.minEquityPercent),
    maxRehabBudget: num(body.maxRehabBudget),
    notes: String(body.notes || ''),
  });

  await getStore().createBuyer(buyer);
  return NextResponse.json({ buyer }, { status: 201 });
}
