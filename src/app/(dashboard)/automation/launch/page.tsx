'use client';

/**
 * Step 13 UX — Launch → Select Counties → Select Lead Types →
 * Select Outreach Channels → Review → Start Automation.
 * Submits to POST /api/automation/launch and redirects to the live run monitor.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Rocket, MapPin, AlertTriangle, Send, Loader2, ChevronLeft, ChevronRight, ClipboardCheck, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATE_COUNTIES: Record<string, string[]> = {
  Texas: ['Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis', 'Collin', 'Denton', 'Hidalgo', 'El Paso', 'Montgomery'],
  Florida: ['Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough', 'Orange', 'Duval', 'Pinellas', 'Lee'],
  Georgia: ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Chatham', 'Clayton'],
  Arizona: ['Maricopa', 'Pima', 'Pinal', 'Yuma'],
  California: ['Los Angeles', 'San Diego', 'Orange', 'Riverside', 'San Bernardino', 'Santa Clara'],
};

const LEAD_TYPES = [
  { id: 'foreclosure', label: 'Foreclosure', description: 'Active foreclosure / trustee sale' },
  { id: 'pre_foreclosure', label: 'Pre-Foreclosure', description: 'NOD / lis pendens filed' },
  { id: 'sheriff_sale', label: 'Sheriff Sale', description: 'Scheduled sheriff auctions' },
  { id: 'tax_delinquent', label: 'Tax Delinquent', description: 'Behind on property taxes' },
  { id: 'tax_lien', label: 'Tax Lien', description: 'Lien certificates outstanding' },
  { id: 'tax_deed', label: 'Tax Deed', description: 'Tax deed sale pipeline' },
  { id: 'probate', label: 'Probate', description: 'Estate settlement filings' },
  { id: 'bankruptcy', label: 'Bankruptcy', description: 'Ch.7 / Ch.13 with real property' },
  { id: 'code_violation', label: 'Code Violations', description: 'Open enforcement cases' },
  { id: 'vacant', label: 'Vacant', description: 'Registered vacant properties' },
  { id: 'absentee_owner', label: 'Absentee Owner', description: 'Owner lives elsewhere' },
  { id: 'high_equity', label: 'High Equity', description: 'Estimated equity 50%+' },
  { id: 'inherited', label: 'Inherited', description: 'Recently inherited homes' },
  { id: 'utility_delinquent', label: 'Utility Delinquent', description: 'Water/utility shutoffs' },
  { id: 'hoa_lien', label: 'HOA Lien', description: 'HOA liens recorded' },
];

const CHANNELS = [
  { id: 'email', label: 'Email', note: 'SendGrid (simulated without API key)' },
  { id: 'sms', label: 'SMS / Text', note: 'Twilio — requires consent/lawful basis' },
  { id: 'voicemail', label: 'Ringless Voicemail', note: 'Where legally permitted' },
  { id: 'direct_mail', label: 'Direct Mail', note: 'Letters & postcards' },
  { id: 'call_task', label: 'Manual Call Tasks', note: 'Creates call tasks for your team' },
];

const STEPS = ['Counties', 'Lead Types', 'Channels', 'Review'];

export default function LaunchPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceCount, setSourceCount] = useState<number | null>(null);

  const [state, setState] = useState('');
  const [counties, setCounties] = useState<string[]>([]);
  const [leadTypes, setLeadTypes] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [minScore, setMinScore] = useState(40);
  const [smsTemplate, setSmsTemplate] = useState('');

  useEffect(() => {
    fetch('/api/automation/sources')
      .then((r) => r.json())
      .then((d) => setSourceCount(d.sources?.length ?? null))
      .catch(() => setSourceCount(null));
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const canNext =
    step === 0 ? Boolean(state && counties.length) :
    step === 1 ? leadTypes.length > 0 :
    step === 2 ? channels.length > 0 : true;

  const handleLaunch = async () => {
    setIsLaunching(true);
    setError(null);
    try {
      const res = await fetch('/api/automation/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          counties,
          leadTypes,
          channels,
          minScore,
          campaignName: campaignName || undefined,
          templates: smsTemplate ? { sms: smsTemplate } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Launch failed');
      router.push(`/automation/runs/${data.runId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Launch failed');
      setIsLaunching(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Automation Control Center</h1>
        <p className="text-muted-foreground text-lg">
          One click runs the full pipeline: Collect → Classify → Clean → Enrich → Score → Campaign → Outreach → Follow-ups.
        </p>
        {sourceCount !== null && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Database className="h-3 w-3" /> {sourceCount} government & public data source connectors registered
          </p>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-primary/15 text-primary cursor-pointer' : 'bg-muted text-muted-foreground',
              )}
            >
              <span className="font-bold">{i + 1}</span> {label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 0: Counties */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Select Counties</CardTitle>
            <CardDescription>Choose the state and counties to collect distressed property records from.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label>State</Label>
              <Select onValueChange={(v) => { setState(v); setCounties([]); }} value={state}>
                <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATE_COUNTIES).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {state && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Counties ({counties.length} selected)</Label>
                  <Button variant="ghost" size="sm" onClick={() => setCounties(counties.length === STATE_COUNTIES[state].length ? [] : [...STATE_COUNTIES[state]])}>
                    {counties.length === STATE_COUNTIES[state].length ? 'Clear all' : 'Select all'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STATE_COUNTIES[state].map((county) => (
                    <label key={county} className="flex items-center space-x-2 p-2 rounded-md border hover:bg-muted transition-colors cursor-pointer">
                      <Checkbox checked={counties.includes(county)} onCheckedChange={() => toggle(counties, setCounties, county)} />
                      <span className="text-sm">{county}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Lead types */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /> Select Lead Types</CardTitle>
            <CardDescription>Which motivated-seller indicators should the pipeline target?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {LEAD_TYPES.map((t) => (
                <label key={t.id} className="flex items-start space-x-2 p-2 rounded-md border hover:bg-muted transition-colors cursor-pointer">
                  <Checkbox className="mt-0.5" checked={leadTypes.includes(t.id)} onCheckedChange={() => toggle(leadTypes, setLeadTypes, t.id)} />
                  <span>
                    <span className="text-sm font-medium block">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Channels */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Select Outreach Channels</CardTitle>
            <CardDescription>
              The AI recommends the best channel per lead among your selection. Without provider API keys, sends are simulated and fully logged.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CHANNELS.map((c) => (
                <label key={c.id} className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted transition-colors cursor-pointer">
                  <Checkbox className="mt-0.5" checked={channels.includes(c.id)} onCheckedChange={() => toggle(channels, setChannels, c.id)} />
                  <span>
                    <span className="text-sm font-medium block">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.note}</span>
                  </span>
                </label>
              ))}
            </div>
            {channels.includes('sms') && (
              <div className="space-y-2">
                <Label>Custom SMS template (optional — variables: {'{{owner_first_name}}, {{property_address}}, {{estimated_equity}}'})</Label>
                <Textarea rows={3} placeholder="Leave blank to use the built-in compliant template" value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-emerald-500" /> Review & Start Automation</CardTitle>
            <CardDescription>Confirm the configuration. Progress, logs and results stream live once launched.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Campaign name (optional)</Label>
                <Input placeholder={`${state} ${counties[0] || ''} Distressed — ${new Date().toLocaleDateString()}`} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Minimum motivation score for outreach: <span className="font-bold text-primary">{minScore}</span></Label>
                <Slider value={[minScore]} min={0} max={100} step={5} onValueChange={(v) => setMinScore(v[0])} />
                <p className="text-xs text-muted-foreground">Leads below this score are stored in the CRM but excluded from outreach.</p>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-muted/40 border">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-semibold w-24 text-muted-foreground">Target:</span>
                <Badge variant="outline">{state}</Badge>
                {counties.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-semibold w-24 text-muted-foreground">Lead types:</span>
                {leadTypes.map((t) => <Badge key={t} variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">{LEAD_TYPES.find((x) => x.id === t)?.label || t}</Badge>)}
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-semibold w-24 text-muted-foreground">Channels:</span>
                {channels.map((c) => <Badge key={c} variant="outline" className="bg-primary/10 text-primary border-primary/20">{CHANNELS.find((x) => x.id === c)?.label || c}</Badge>)}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚖️ Compliance: SMS and ringless voicemail require prior consent or another lawful basis in most jurisdictions (TCPA).
              Without provider credentials this run executes in simulation mode — nothing is actually delivered.
            </p>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <Button onClick={handleLaunch} disabled={isLaunching} size="lg" className="w-full py-7 text-lg font-bold shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]">
              {isLaunching ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Launching Automation...</>
              ) : (
                <><Rocket className="mr-2 h-6 w-6" /> START AUTOMATION</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Nav buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isLaunching}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < 3 && (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
