'use client';

/**
 * Live automation run monitor — streams stage progress, logs and final
 * stats for a pipeline run (Step 13: progress updates, logs, error handling).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, XCircle, Rocket, Users, Send, CalendarClock, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'collect', label: 'Collect property records' },
  { id: 'classify', label: 'Classify distress categories' },
  { id: 'clean', label: 'Clean, normalize & de-duplicate' },
  { id: 'enrich', label: 'Enrich owner contact info' },
  { id: 'score', label: 'Score lead motivation (0-100)' },
  { id: 'build_lists', label: 'Build campaign lists' },
  { id: 'outreach', label: 'Send outreach & log delivery' },
  { id: 'followups', label: 'Schedule follow-ups' },
];

interface RunData {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentStage: string | null;
  stagesDone: string[];
  logs: { ts: string; level: string; stage: string; message: string }[];
  stats: Record<string, number>;
  config: { state: string; counties: string[]; leadTypes: string[]; channels: string[] };
  error: string | null;
}

const LEVEL_COLOR: Record<string, string> = {
  info: 'text-slate-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
};

export default function RunMonitorPage() {
  const params = useParams<{ id: string }>();
  const [run, setRun] = useState<RunData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/automation/runs/${params.id}`, { cache: 'no-store' });
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      setRun(data.run);
    } catch { /* transient */ }
  }, [params.id]);

  useEffect(() => {
    fetchRun();
    const t = setInterval(() => {
      fetchRun();
    }, 1500);
    return () => clearInterval(t);
  }, [fetchRun]);

  useEffect(() => {
    if (run?.status === 'running' || run?.status === 'queued') {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
    }
  }, [run?.logs?.length, run?.status]);

  if (notFound) {
    return (
      <div className="container mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Run not found</h1>
        <p className="text-muted-foreground">In demo mode (no database configured), run history resets when the server restarts.</p>
        <Button asChild><Link href="/automation/launch">Start a new run</Link></Button>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = Math.round((run.stagesDone.length / STAGES.length) * 100);
  const done = run.status === 'completed';
  const failed = run.status === 'failed';

  return (
    <div className="container mx-auto py-8 max-w-6xl px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Rocket className="h-7 w-7 text-primary" /> Automation Run
            {done && <Badge className="bg-emerald-500 hover:bg-emerald-500">Completed</Badge>}
            {failed && <Badge variant="destructive">Failed</Badge>}
            {(run.status === 'running' || run.status === 'queued') && (
              <Badge variant="secondary" className="animate-pulse">Running…</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {run.config.state} · {run.config.counties.join(', ')} · {run.config.leadTypes.length} lead types · {run.config.channels.length} channels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/automation/launch">New Run</Link></Button>
          {done && <Button asChild><Link href="/leads">View Leads <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Stage checklist */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Pipeline Stages</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {STAGES.map((stage) => {
              const isDone = run.stagesDone.includes(stage.id);
              const isCurrent = run.currentStage === stage.id;
              return (
                <div key={stage.id} className={cn('flex items-center gap-3 p-2 rounded-md', isCurrent && 'bg-primary/5')}>
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    failed ? <XCircle className="h-5 w-5 text-red-500 shrink-0" /> : <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn('text-sm', isDone && 'text-muted-foreground', isCurrent && 'font-semibold')}>{stage.label}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Live logs */}
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Live Logs</CardTitle></CardHeader>
          <CardContent>
            <div ref={logRef} className="bg-slate-950 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs space-y-1">
              {run.logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">{new Date(log.ts).toLocaleTimeString()}</span>
                  <span className={cn('shrink-0 uppercase w-14', LEVEL_COLOR[log.level] || 'text-slate-400')}>[{log.stage}]</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))}
              {run.logs.length === 0 && <span className="text-slate-500">Waiting for pipeline output…</span>}
            </div>
            {failed && run.error && (
              <p className="text-sm text-red-500 mt-3 font-medium">Error: {run.error}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {done && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard icon={Target} label="Raw Records" value={run.stats.rawRecords} sub={`${run.stats.sourcesQueried} sources queried`} />
          <StatCard icon={Users} label="Unique Leads" value={run.stats.afterDedupe} sub={`${run.stats.duplicatesRemoved} duplicates merged`} />
          <StatCard icon={Send} label="Outreach Sent" value={run.stats.outreachSent} sub={`avg score ${run.stats.avgScore}/100 · $${run.stats.cost}`} />
          <StatCard icon={CalendarClock} label="Follow-ups" value={run.stats.followUpsScheduled} sub={`${run.stats.enriched} enriched · ${run.stats.enrichmentRejected} rejected`} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
          <Icon className="h-4 w-4" /> {label}
        </div>
        <div className="text-3xl font-bold">{value?.toLocaleString?.() ?? value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
