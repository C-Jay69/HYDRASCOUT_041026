'use client';

/**
 * Property search view — table of live properties with quick text search
 * and status filter. Used by the /search page (works with Supabase data or
 * built-in demo data when no database is configured).
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '@/types';
import { PropertyList } from '@/components/property/PropertyList';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pre_foreclosure', label: 'Pre-Foreclosure' },
  { value: 'foreclosure', label: 'Foreclosure' },
  { value: 'auction', label: 'Auction' },
  { value: 'reo', label: 'REO' },
  { value: 'off_market', label: 'Off-Market' },
  { value: 'active', label: 'Active' },
];

export default function PropertySearch({ initialProperties }: { initialProperties: Property[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [ownerType, setOwnerType] = useState('all');

  const filtered = useMemo(() => {
    let out = initialProperties;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (p) =>
          p.address?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.owner_name?.toLowerCase().includes(q) ||
          p.zip?.includes(q),
      );
    }
    if (status !== 'all') out = out.filter((p) => p.listing_status === status);
    if (ownerType !== 'all') out = out.filter((p) => p.owner_type === ownerType);
    return out;
  }, [initialProperties, search, status, ownerType]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search address, city, owner, ZIP…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ownerType} onValueChange={setOwnerType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owner types</SelectItem>
              <SelectItem value="owner_occupied">Owner Occupied</SelectItem>
              <SelectItem value="absentee">Absentee</SelectItem>
              <SelectItem value="tenant_occupied">Tenant Occupied</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{filtered.length} properties</p>

      <PropertyList
        properties={filtered}
        onViewDetails={(p) => router.push(`/property/${p.id}`)}
        onPropertySelect={(p) => router.push(`/property/${p.id}`)}
      />
    </div>
  );
}
