'use client';

/**
 * Step 6 CRM + Step 10 Search & Filters.
 * Searchable lead database populated by automation runs, with status
 * tracking, notes, communication history, follow-ups and CSV export.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Download, Rocket, Phone, Mail, RefreshCw, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  tax_delinquent: 'Tax Delinquent', tax_lien: 'Tax Lien', tax_deed: 'Tax Deed',
  foreclosure: 'Foreclosure', pre_foreclosure: 'Pre-Foreclosure', sheriff_sale: 'Sheriff Sale',
  probate: 'Probate', bankruptcy: 'Bankruptcy', code_violation: 'Code Violations',
  vacant: 'Vacant', absentee_owner: 'Absentee Owner', high_equity: 'High Equity',
  inherited: 'Inherited', estate_sale: 'Estate Sale', utility_delinquent: 'Utility Delinquent',
  hoa_lien: 'HOA Lien', other_motivated: 'Other',
};

const STATUSES = ['new', 'contacted', 'replied', 'interested', 'appointment', 'converted', 'dead'];

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-slate-500/15 text-slate-600',
  contacted: 'bg-blue-500/15 text-blue-600',
  replied: 'bg-violet-500/15 text-violet-600',
  interested: 'bg-orange-500/15 text-orange-600',
  appointment: 'bg-emerald-500/15 text-emerald-600',
  converted: 'bg-emerald-600/20 text-emerald-700',
  dead: 'bg-red-500/15 text-red-600',
};

interface Lead {
  id: string;
  ownerName: string;
  ownerType: string;
  isInvestor: boolean;
  propertyAddress: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  categories: string[];
  motivationScore: number;
  equityPercent: number | null;
  equityEstimate: number | null;
  delinquentTaxes: number | null;
  auctionDate: string | null;
  phones: { number: string; type: string; confidence: number }[];
  emails: { address: string; confidence: number }[];
  enrichmentSource: string | null;
  enrichmentConfidence: number | null;
  aiSummary: string | null;
  recommendedChannel: string | null;
  sources: string[];
  status: string;
  notes: string;
  followUpAt: string | null;
}

interface Comm { channel: string; provider: string; status: string; simulated: boolean; message: string; sentAt: string }
interface FollowUp { dueAt: string; reason: string; done: boolean }

function scoreColor(score: number) {
  if (score >= 80) return 'text-red-600 font-bold';
  if (score >= 60) return 'text-orange-500 font-bold';
  if (score >= 40) return 'text-yellow-600 font-semibold';
  return 'text-muted-foreground';
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [minScore, setMinScore] = useState('0');
  const [county, setCounty] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [detail, setDetail] = useState<{ communications: Comm[]; followUps: FollowUp[] } | null>(null);
  const [notes, setNotes] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    if (status !== 'all') params.set('status', status);
    if (minScore !== '0') params.set('minScore', minScore);
    if (county) params.set('county', county);
    try {
      const res = await fetch(`/api/leads?${params}`, { cache: 'no-store' });
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  }, [search, category, status, minScore, county]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  const openLead = async (lead: Lead) => {
    setSelected(lead);
    setNotes(lead.notes);
    setDetail(null);
    const res = await fetch(`/api/leads/${lead.id}`, { cache: 'no-store' });
    const data = await res.json();
    setDetail({ communications: data.communications || [], followUps: data.followUps || [] });
  };

  const patchLead = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.lead) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data.lead } : l)));
      if (selected?.id === id) setSelected({ ...selected, ...data.lead });
    }
  };

  const exportCsv = () => {
    const headers = ['Owner', 'Property Address', 'City', 'County', 'State', 'ZIP', 'Categories', 'Score', 'Equity %', 'Phones', 'Emails', 'Status'];
    const rows = leads.map((l) => [
      l.ownerName, l.propertyAddress, l.city, l.county, l.state, l.zip,
      l.categories.map((c) => CATEGORY_LABELS[c] || c).join('; '),
      l.motivationScore, l.equityPercent ?? '',
      l.phones.map((p) => p.number).join('; '),
      l.emails.map((e) => e.address).join('; '),
      l.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hydrawire-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const empty = !loading && leads.length === 0;

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Lead CRM
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{leads.length} leads · sorted by motivation score</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLeads}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button variant="outline" onClick={exportCsv} disabled={!leads.length}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Button asChild><Link href="/automation/launch"><Rocket className="h-4 w-4 mr-1" /> Launch Automation</Link></Button>
        </div>
      </div>

      {/* Filters (Step 10) */}
      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search owner, address, city, APN…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Input placeholder="County" value={county} onChange={(e) => setCounty(e.target.value)} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger><SelectValue placeholder="Min score" /></SelectTrigger>
              <SelectContent>
                {['0', '40', '60', '80'].map((s) => <SelectItem key={s} value={s}>Score ≥ {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : empty ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-lg font-semibold">No leads yet</p>
              <p className="text-sm text-muted-foreground">Launch the automation to collect, enrich and score distressed property leads.</p>
              <Button asChild><Link href="/automation/launch"><Rocket className="h-4 w-4 mr-1" /> Launch Automation</Link></Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Score</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Equity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer" onClick={() => openLead(lead)}>
                      <TableCell><span className={cn('text-lg tabular-nums', scoreColor(lead.motivationScore))}>{lead.motivationScore}</span></TableCell>
                      <TableCell>
                        <div className="font-medium">{lead.ownerName || '—'}</div>
                        <div className="text-xs text-muted-foreground">{lead.ownerType.replace('_', ' ')}{lead.isInvestor && ' · investor'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium max-w-[260px] truncate">{lead.propertyAddress}</div>
                        <div className="text-xs text-muted-foreground">{lead.county} County, {lead.state}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {lead.categories.slice(0, 3).map((c) => (
                            <Badge key={c} variant="outline" className="text-[10px] px-1.5">{CATEGORY_LABELS[c] || c}</Badge>
                          ))}
                          {lead.categories.length > 3 && <Badge variant="outline" className="text-[10px] px-1.5">+{lead.categories.length - 3}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-muted-foreground">
                          {lead.phones.length > 0 && <span className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{lead.phones.length}</span>}
                          {lead.emails.length > 0 && <span className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{lead.emails.length}</span>}
                          {!lead.phones.length && !lead.emails.length && <span className="text-xs">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{lead.equityPercent !== null ? `${lead.equityPercent}%` : '—'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={lead.status} onValueChange={(v) => patchLead(lead.id, { status: v })}>
                          <SelectTrigger className={cn('h-7 w-32 text-xs border-0', STATUS_COLOR[lead.status])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.propertyAddress}</SheetTitle>
                <SheetDescription>
                  {selected.ownerName || 'Unknown owner'} · {selected.county} County, {selected.state} {selected.zip}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 mt-4 px-1">
                <div className="flex flex-wrap gap-1.5">
                  {selected.categories.map((c) => <Badge key={c} variant="secondary">{CATEGORY_LABELS[c] || c}</Badge>)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Motivation Score" value={<span className={scoreColor(selected.motivationScore)}>{selected.motivationScore}/100</span>} />
                  <Info label="Equity" value={selected.equityPercent !== null ? `${selected.equityPercent}% ($${(selected.equityEstimate || 0).toLocaleString()})` : '—'} />
                  <Info label="Delinquent Taxes" value={selected.delinquentTaxes ? `$${selected.delinquentTaxes.toLocaleString()}` : '—'} />
                  <Info label="Auction Date" value={selected.auctionDate || '—'} />
                  <Info label="Recommended Channel" value={selected.recommendedChannel?.replace('_', ' ') || '—'} />
                  <Info label="Follow-up" value={selected.followUpAt ? new Date(selected.followUpAt).toLocaleDateString() : '—'} />
                </div>

                {selected.aiSummary && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                    <p className="text-xs font-semibold text-primary mb-1">AI SUMMARY</p>
                    {selected.aiSummary}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">CONTACT INFO {selected.enrichmentSource && `(via ${selected.enrichmentSource}, confidence ${selected.enrichmentConfidence})`}</p>
                  <div className="space-y-1 text-sm">
                    {selected.phones.map((p, i) => (
                      <div key={i} className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {p.number} <span className="text-xs text-muted-foreground">({p.type}, {p.confidence}%)</span></div>
                    ))}
                    {selected.emails.map((e, i) => (
                      <div key={i} className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {e.address} <span className="text-xs text-muted-foreground">({e.confidence}%)</span></div>
                    ))}
                    {!selected.phones.length && !selected.emails.length && <p className="text-muted-foreground text-sm">No enriched contact info (low confidence match rejected).</p>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">SOURCES</p>
                  <div className="flex flex-wrap gap-1">{selected.sources.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">COMMUNICATION HISTORY</p>
                  {!detail ? <Loader2 className="h-4 w-4 animate-spin" /> : detail.communications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No outreach yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.communications.map((c, i) => (
                        <div key={i} className="p-2 rounded-md border text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{c.channel}</Badge>
                            <span className="font-medium">{c.status}</span>
                            {c.simulated && <Badge variant="secondary" className="text-[10px]">simulated</Badge>}
                            <span className="text-muted-foreground ml-auto">{new Date(c.sentAt).toLocaleString()}</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-3">{c.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {detail && detail.followUps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">FOLLOW-UPS</p>
                    {detail.followUps.map((f, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <Badge variant={f.done ? 'secondary' : 'outline'} className="text-[10px]">{new Date(f.dueAt).toLocaleDateString()}</Badge>
                        {f.reason}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">NOTES</p>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this lead…" />
                  <Button size="sm" className="mt-2" onClick={() => patchLead(selected.id, { notes })}>Save Notes</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-2 rounded-md bg-muted/40">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
