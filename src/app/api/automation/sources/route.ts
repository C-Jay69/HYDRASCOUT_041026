import { NextResponse } from 'next/server';
import { SOURCE_REGISTRY } from '@/lib/automation/sources';

export const dynamic = 'force-dynamic';

/** GET /api/automation/sources — registered data-source connectors (Step 1). */
export async function GET() {
  return NextResponse.json({
    sources: SOURCE_REGISTRY.map(({ id, name, description, categories }) => ({ id, name, description, categories })),
  });
}
