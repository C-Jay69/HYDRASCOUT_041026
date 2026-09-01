'use client';

/**
 * Property detail view — key metrics for a single property record
 * (works with both Supabase rows and demo data).
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, User, DollarSign, Landmark } from 'lucide-react';

type PropertyRecord = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type?: string;
  owner_name?: string;
  owner_type?: string;
  mailing_address?: string;
  estimated_value?: number;
  equity?: number;
  equity_percent?: number;
  loan_balance?: number;
  assessed_value?: number;
  annual_taxes?: number;
  tax_delinquency?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  listing_status?: string;
  days_on_market?: number;
  last_sale_date?: string;
};

const money = (n?: number | null) =>
  n === undefined || n === null ? '—' : `$${Math.round(Number(n)).toLocaleString()}`;

const STATUS_COLORS: Record<string, string> = {
  foreclosure: 'bg-red-500/15 text-red-600',
  pre_foreclosure: 'bg-orange-500/15 text-orange-600',
  auction: 'bg-red-500/15 text-red-600',
  reo: 'bg-purple-500/15 text-purple-600',
  off_market: 'bg-slate-500/15 text-slate-600',
  active: 'bg-emerald-500/15 text-emerald-600',
};

export default function PropertyDetailView({ property }: { property: PropertyRecord }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/search"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Search</Link>
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{property.address}</h1>
          {property.listing_status && (
            <Badge className={STATUS_COLORS[property.listing_status] || ''} variant="outline">
              {property.listing_status.replace('_', ' ')}
            </Badge>
          )}
          {property.tax_delinquency && <Badge variant="destructive">Tax Delinquent</Badge>}
        </div>
        <p className="text-muted-foreground mt-1">
          {property.city}, {property.state} {property.zip}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valuation</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Estimated Value" value={money(property.estimated_value)} bold />
            <Row label="Assessed Value" value={money(property.assessed_value)} />
            <Row label="Loan Balance" value={money(property.loan_balance)} />
            <Row label="Equity" value={`${money(property.equity)}${property.equity_percent != null ? ` (${property.equity_percent}%)` : ''}`} bold />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Home className="h-4 w-4" /> Property</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Type" value={property.property_type?.replace('_', ' ') || '—'} />
            <Row label="Beds / Baths" value={`${property.bedrooms ?? '—'} / ${property.bathrooms ?? '—'}`} />
            <Row label="Sqft" value={property.sqft?.toLocaleString() || '—'} />
            <Row label="Year Built" value={String(property.year_built ?? '—')} />
            <Row label="Lot Size" value={property.lot_size ? `${property.lot_size} ac` : '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Ownership</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Owner" value={property.owner_name || '—'} bold />
            <Row label="Owner Type" value={property.owner_type?.replace('_', ' ') || '—'} />
            <Row label="Mailing Address" value={property.mailing_address || 'Same as property'} />
            <Row label="Last Sale" value={property.last_sale_date || '—'} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Landmark className="h-4 w-4" /> Taxes</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Row label="Annual Taxes" value={money(property.annual_taxes)} />
          <Row label="Tax Delinquent" value={property.tax_delinquency ? 'Yes' : 'No'} />
          <Row label="Days on Market" value={String(property.days_on_market ?? '—')} />
          <Row label="Status" value={property.listing_status?.replace('_', ' ') || '—'} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
