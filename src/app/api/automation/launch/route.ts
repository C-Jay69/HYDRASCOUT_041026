import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { createRun, executePipeline } from '@/lib/automation/pipeline';
import { getStore } from '@/lib/automation/store';
import { LEAD_CATEGORY_LABELS, CHANNEL_LABELS } from '@/lib/automation/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const configSchema = z.object({
  state: z.string().min(2),
  counties: z.array(z.string().min(1)).min(1, 'Select at least one county'),
  leadTypes: z.array(z.enum(Object.keys(LEAD_CATEGORY_LABELS) as [string, ...string[]])).min(1, 'Select at least one lead type'),
  channels: z.array(z.enum(Object.keys(CHANNEL_LABELS) as [string, ...string[]])).min(1, 'Select at least one outreach channel'),
  campaignName: z.string().optional(),
  templates: z.record(z.string(), z.string()).optional(),
  minScore: z.number().min(0).max(100).optional(),
});

/**
 * POST /api/automation/launch
 * Validates the wizard config, creates a run and executes the full
 * pipeline in the background. Poll /api/automation/runs/[id] for progress.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid launch configuration', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const run = createRun(parsed.data as never);
  const store = getStore();
  await store.createRun(run);

  // Execute after the response is sent (works on Node + Vercel via `after`)
  after(async () => {
    await executePipeline(run);
  });

  return NextResponse.json({ runId: run.id, status: 'queued', backend: store.backend }, { status: 202 });
}
