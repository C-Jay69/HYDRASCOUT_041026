'use client';

/**
 * Disposition module — Buyer CRM.
 * Manage the investor network: buy-box criteria (markets, price range,
 * property types, financing, rehab budget), contact info and deal stats.
 * Buyers created here are scored against leads by the matching engine
 * (see /api/leads/[id]/matches and the Disposition panel in the Lead CRM).
 */

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Handshake, Plus, Pencil, Trash2, RefreshCw, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = ['Single Family', 'Townhouse', 'Condo', 'Duplex', 'Multi-Family', 'Mobile Home', 'Land', 'Commercial'];

interface Buyer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  markets: string[];
  minPrice: number | null;
  maxPrice: number | null;
  propertyTypes: string[];
  financing: 'cash' | 'financing' | 'either';
  minEquityPercent: number | null;
  maxRehabBudget: number | null;
  active: boolean;
  notes: string;
  dealsClosed: number;
  createdAt: string;
}

const emptyForm = {
  name: '', company: '', email: '', phone: '', markets: '',
  minPrice: '', maxPrice: '', propertyTypes: [] as string[],
  financing: 'either', minEquityPercent: '', maxRehabBudget: '',
  notes: '', active: true,
};

export default function BuyersPage() {
  const { toast } = useToast();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Buyer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buyers', { cache: 'no-store' });
      const data = await res.json();
      setBuyers(data.buyers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBuyers(); }, [fetchBuyers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setSheetOpen(true);
  };

  const openEdit = (buyer: Buyer) => {
    setEditing(buyer);
    setForm({
      name: buyer.name,
      company: buyer.company,
      email: buyer.email,
      phone: buyer.phone,
      markets: buyer.markets.join(', '),
      minPrice: buyer.minPrice?.toString() ?? '',
      maxPrice: buyer.maxPrice?.toString() ?? '',
      propertyTypes: buyer.propertyTypes,
      financing: buyer.financing,
      minEquityPercent: buyer.minEquityPercent?.toString() ?? '',
      maxRehabBudget: buyer.maxRehabBudget?.toString() ?? '',
      notes: buyer.notes,
      active: buyer.active,
    });
    setSheetOpen(true);
  };

  const toggleActive = async (buyer: Buyer) => {
    const res = await fetch(`/api/buyers/${buyer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !buyer.active }),
    });
    if (res.ok) {
      setBuyers((prev) => prev.map((b) => (b.id === buyer.id ? { ...b, active: !b.active } : b)));
      toast({ title: !buyer.active ? 'Buyer activated' : 'Buyer deactivated', description: buyer.name });
    }
  };

  const removeBuyer = async (buyer: Buyer) => {
    const res = await fetch(`/api/buyers/${buyer.id}`, { method: 'DELETE' });
    if (res.ok) {
      setBuyers((prev) => prev.filter((b) => b.id !== buyer.id));
      toast({ title: 'Buyer removed', description: `${buyer.name} was removed from the network.` });
    }
  };

  const saveBuyer = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', description: 'Give the buyer a name.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        markets: form.markets.split(',').map((m) => m.trim()).filter(Boolean),
        minPrice: form.minPrice ? Number(form.minPrice) : null,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : null,
        propertyTypes: form.propertyTypes,
        financing: form.financing,
        minEquityPercent: form.minEquityPercent ? Number(form.minEquityPercent) : null,
        maxRehabBudget: form.maxRehabBudget ? Number(form.maxRehabBudget) : null,
        notes: form.notes,
        active: form.active,
      };
      const res = await fetch(editing ? `/api/buyers/${editing.id}` : '/api/buyers', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Could not save buyer', description: data.error || 'Unknown error', variant: 'destructive' });
        return;
      }
      toast({
        title: editing ? 'Buyer updated' : 'Buyer added',
        description: `${data.buyer.name} is ${data.buyer.active ? 'in' : 'paused in'} your buyer network.`,
      });
      setSheetOpen(false);
      fetchBuyers();
    } finally {
      setSaving(false);
    }
  };

  const money = (n: number | null) => (n === null ? '—' : `$${n.toLocaleString()}`);

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Handshake className="h-7 w-7 text-primary" /> Buyers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {buyers.filter((b) => b.active).length} active · {buyers.length} total · investor network & buy boxes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBuyers}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Buyer</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : buyers.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-lg font-semibold">No buyers yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add the investors you work with — their buy-box criteria power the lead matching engine and deal disposition flow.
              </p>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add your first buyer</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Markets</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead>Property Types</TableHead>
                    <TableHead>Financing</TableHead>
                    <TableHead>Rehab Budget</TableHead>
                    <TableHead>Deals Closed</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyers.map((buyer) => (
                    <TableRow key={buyer.id} className={cn(!buyer.active && 'opacity-50')}>
                      <TableCell>
                        <div className="font-medium">{buyer.name}</div>
                        <div className="text-xs text-muted-foreground">{buyer.company || '—'}</div>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          {buyer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{buyer.email}</span>}
                          {buyer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{buyer.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {buyer.markets.length ? buyer.markets.slice(0, 3).map((m) => (
                            <Badge key={m} variant="outline" className="text-[10px] px-1.5">{m}</Badge>
                          )) : <span className="text-xs text-muted-foreground">any</span>}
                          {buyer.markets.length > 3 && <Badge variant="outline" className="text-[10px] px-1.5">+{buyer.markets.length - 3}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{buyer.minPrice === null && buyer.maxPrice === null ? 'any' : `${money(buyer.minPrice)}–${money(buyer.maxPrice)}`}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {buyer.propertyTypes.length ? buyer.propertyTypes.slice(0, 2).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px] px-1.5">{t}</Badge>
                          )) : <span className="text-xs text-muted-foreground">any</span>}
                          {buyer.propertyTypes.length > 2 && <Badge variant="secondary" className="text-[10px] px-1.5">+{buyer.propertyTypes.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={buyer.financing === 'cash' ? 'default' : 'outline'} className="text-[10px]">{buyer.financing}</Badge>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{money(buyer.maxRehabBudget)}</TableCell>
                      <TableCell><span className="font-bold tabular-nums">{buyer.dealsClosed}</span></TableCell>
                      <TableCell>
                        <Switch checked={buyer.active} onCheckedChange={() => toggleActive(buyer)} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(buyer)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => removeBuyer(buyer)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit buyer' : 'Add buyer'}</SheetTitle>
            <SheetDescription>Buy-box criteria drive the lead matching score (0–100+).</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4 px-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Investor" />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Capital LLC" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Markets</Label>
              <Input value={form.markets} onChange={(e) => setForm({ ...form, markets: e.target.value })} placeholder="TX, Dallas County, Atlanta, GA — or leave blank for nationwide" />
              <p className="text-xs text-muted-foreground">Comma-separated: state codes/names, cities, or counties.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min price ($)</Label>
                <Input type="number" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} placeholder="100000" />
              </div>
              <div className="space-y-1.5">
                <Label>Max price ($)</Label>
                <Input type="number" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} placeholder="350000" />
              </div>
              <div className="space-y-1.5">
                <Label>Min equity (%)</Label>
                <Input type="number" value={form.minEquityPercent} onChange={(e) => setForm({ ...form, minEquityPercent: e.target.value })} placeholder="25" />
              </div>
              <div className="space-y-1.5">
                <Label>Max rehab budget ($)</Label>
                <Input type="number" value={form.maxRehabBudget} onChange={(e) => setForm({ ...form, maxRehabBudget: e.target.value })} placeholder="75000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Financing</Label>
                <Select value={form.financing} onValueChange={(v) => setForm({ ...form, financing: v as typeof form.financing })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="financing">Financing</SelectItem>
                    <SelectItem value="either">Either</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex items-end gap-2 pb-1">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} id="buyer-active" />
                <Label htmlFor="buyer-active">Active in matching</Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Property types</Label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {PROPERTY_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.propertyTypes.includes(t)}
                      onCheckedChange={(checked) =>
                        setForm({
                          ...form,
                          propertyTypes: checked ? [...form.propertyTypes, t] : form.propertyTypes.filter((x) => x !== t),
                        })
                      }
                    />
                    {t}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Leave all unchecked to match any property type.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Preferences, past deals, reminders…" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveBuyer} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? 'Save changes' : 'Add buyer'}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Tiny indirection so the Refresh button reads clearly at the call site.
function fetchLeadsRefetch(fn: () => void) {
  return fn;
}
