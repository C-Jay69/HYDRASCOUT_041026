'use client';

/**
 * TCPA / opt-out compliance center.
 * - Do-Not-Contact list (every suppressed phone/email, with source)
 * - Manual suppression entry
 * - Consent audit log: every opt-out, opt-in, blocked send and HELP request
 *
 * Enforcement is automatic: sendOutreach() and notifyBuyer() hard-gate on
 * this list before any dispatch (blocked sends show as provider
 * "compliance-gate" in the lead communication history).
 */

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShieldCheck, Plus, Trash2, RefreshCw, PhoneOff, MailX, ScrollText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Suppression {
  id: string;
  value: string;
  type: 'phone' | 'email';
  reason: string;
  source: string;
  leadId: string | null;
  note: string;
  createdAt: string;
}

interface ConsentEvent {
  id: string;
  leadId: string | null;
  buyerId: string | null;
  type: 'opt_out' | 'opt_in' | 'blocked_send' | 'help_request';
  channel: string;
  value: string | null;
  detail: string;
  createdAt: string;
}

const EVENT_BADGE: Record<string, string> = {
  opt_out: 'bg-red-500/15 text-red-600',
  opt_in: 'bg-emerald-500/15 text-emerald-600',
  blocked_send: 'bg-orange-500/15 text-orange-600',
  help_request: 'bg-blue-500/15 text-blue-600',
};

export default function CompliancePage() {
  const { toast } = useToast();
  const [suppressions, setSuppressions] = useState<Suppression[]>([]);
  const [events, setEvents] = useState<ConsentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, eRes] = await Promise.all([
        fetch('/api/compliance', { cache: 'no-store' }),
        fetch('/api/compliance/events?limit=100', { cache: 'no-store' }),
      ]);
      const sData = await sRes.json();
      const eData = await eRes.json();
      setSuppressions(sData.suppressions || []);
      setEvents(eData.events || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addSuppression = async () => {
    const v = value.trim();
    if (!v) {
      toast({ title: 'Value required', description: 'Enter a phone number or email address.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: v, reason: reason.trim() || 'manual', note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Could not add suppression', description: data.error || 'Unknown error', variant: 'destructive' });
        return;
      }
      toast({
        title: 'Added to Do-Not-Contact list',
        description: `${data.suppression.value} (${data.suppression.type}) — outreach is now blocked.`,
      });
      setValue(''); setReason(''); setNote('');
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const removeSuppression = async (s: Suppression) => {
    const res = await fetch(`/api/compliance/${s.id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuppressions((prev) => prev.filter((x) => x.id !== s.id));
      toast({ title: 'Removed from list', description: `${s.value} may be contacted again (opt-in logged).` });
      fetchAll();
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Compliance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            TCPA / CAN-SPAM enforcement — {suppressions.length} contacts on the Do-Not-Contact list
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>

      {/* Manual suppression */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a suppression</CardTitle>
          <CardDescription>
            Manually opt a contact out of all outreach. Phone vs email is detected automatically. STOP texts and
            email unsubscribe links land here too.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.4fr_1fr_1.4fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label>Phone or email</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="+1 555 010 1234 or owner@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="manual, seller request…" />
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Context for the audit log (optional)" />
          </div>
          <Button onClick={addSuppression} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Suppress
          </Button>
        </CardContent>
      </Card>

      {/* Do-Not-Contact list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Do-Not-Contact list</CardTitle>
          <CardDescription>sendOutreach() and notifyBuyer() hard-gate on these values before any dispatch.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : suppressions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">No suppressed contacts. Every opt-out (STOP, unsubscribe link, manual) will appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppressions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {s.type === 'phone' ? <PhoneOff className="h-3.5 w-3.5 text-red-500" /> : <MailX className="h-3.5 w-3.5 text-red-500" />}
                          {s.value}
                        </span>
                        {s.note && <div className="text-xs text-muted-foreground mt-0.5">{s.note}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.type}</Badge></TableCell>
                      <TableCell className="text-sm">{s.reason}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{s.source}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => removeSuppression(s)} title="Remove (opt back in)">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ScrollText className="h-4 w-4" /> Consent audit log</CardTitle>
          <CardDescription>Immutable trail of every opt-out, opt-in, blocked send and HELP request.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : events.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">No consent events yet.</p>
          ) : (
            <div className="divide-y">
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <Badge className={`text-[10px] shrink-0 ${EVENT_BADGE[e.type] || ''}`} variant="outline">{e.type.replace('_', ' ')}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{e.detail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(e.createdAt).toLocaleString()}
                      {e.leadId && <> · lead <span className="font-mono">{e.leadId.slice(0, 16)}…</span></>}
                      {e.buyerId && <> · buyer <span className="font-mono">{e.buyerId.slice(0, 16)}…</span></>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
