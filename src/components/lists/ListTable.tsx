'use client';

import { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Property, PropertyStatus } from '@/hooks/useLeadLists';
import { cn } from '@/lib/utils';

interface ListTableProps {
  properties: Property[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
  onStatusChange: (propertyId: string, status: PropertyStatus) => void;
  onRemove: (propertyId: string) => void;
  statusFilter?: PropertyStatus | 'all';
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

type SortField = 'address' | 'city' | 'value' | 'equity' | 'equityPercent' | 'ownerType' | 'status';
type SortDirection = 'asc' | 'desc';

const STATUS_COLORS: Record<PropertyStatus, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  interested: 'bg-green-500',
  skip: 'bg-gray-500',
  converted: 'bg-purple-500',
};

const STATUS_LABELS: Record<PropertyStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  skip: 'Skip',
  converted: 'Converted',
};

export function ListTable({
  properties,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onStatusChange,
  onRemove,
  statusFilter = 'all',
  currentPage = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
}: ListTableProps) {
  const [sortField, setSortField] = useState<SortField>('address');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter properties
  const filteredProperties = useMemo(() => {
    if (statusFilter === 'all') return properties;
    return properties.filter((p) => p.status === statusFilter);
  }, [properties, statusFilter]);

  // Sort properties
  const sortedProperties = useMemo(() => {
    return [...filteredProperties].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'address':
          aVal = a.address.toLowerCase();
          bVal = b.address.toLowerCase();
          break;
        case 'city':
          aVal = `${a.city} ${a.state}`.toLowerCase();
          bVal = `${b.city} ${b.state}`.toLowerCase();
          break;
        case 'value':
          aVal = a.value;
          bVal = b.value;
          break;
        case 'equity':
          aVal = a.equity;
          bVal = b.equity;
          break;
        case 'equityPercent':
          aVal = a.equityPercent;
          bVal = b.equityPercent;
          break;
        case 'ownerType':
          aVal = a.ownerType.toLowerCase();
          bVal = b.ownerType.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProperties, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedProperties.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedProperties.length);
  const paginatedProperties = sortedProperties.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const allSelected =
    paginatedProperties.length > 0 &&
    paginatedProperties.every((p) => selectedIds.has(p.id));

  const handleSelectAll = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll(paginatedProperties.map((p) => p.id));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary" />
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (filteredProperties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No properties found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-12 px-3 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('address')}
                >
                  Address
                  <SortIcon field="address" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('city')}
                >
                  City/State
                  <SortIcon field="city" />
                </button>
              </th>
              <th className="px-3 py-3 text-right">
                <button
                  type="button"
                  className="flex items-center justify-end gap-1 text-sm font-medium hover:text-primary transition-colors ml-auto"
                  onClick={() => handleSort('value')}
                >
                  Value
                  <SortIcon field="value" />
                </button>
              </th>
              <th className="px-3 py-3 text-right">
                <button
                  type="button"
                  className="flex items-center justify-end gap-1 text-sm font-medium hover:text-primary transition-colors ml-auto"
                  onClick={() => handleSort('equity')}
                >
                  Equity
                  <SortIcon field="equity" />
                </button>
              </th>
              <th className="px-3 py-3 text-right">
                <button
                  type="button"
                  className="flex items-center justify-end gap-1 text-sm font-medium hover:text-primary transition-colors ml-auto"
                  onClick={() => handleSort('equityPercent')}
                >
                  Equity %
                  <SortIcon field="equityPercent" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('ownerType')}
                >
                  Owner Type
                  <SortIcon field="ownerType" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-sm font-medium">Tags</span>
              </th>
              <th className="w-24 px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedProperties.map((property) => (
              <tr
                key={property.id}
                className={cn(
                  'border-b transition-colors hover:bg-muted/30',
                  selectedIds.has(property.id) && 'bg-muted/50'
                )}
              >
                <td className="px-3 py-3">
                  <Checkbox
                    name="property-checkbox"
                    checked={selectedIds.has(property.id)}
                    onCheckedChange={() => onToggleSelect(property.id)}
                    value={property.id}
                    aria-label={`Select ${property.address}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm font-medium">{property.address}</div>
                  {property.zip && (
                    <div className="text-xs text-muted-foreground">{property.zip}</div>
                  )}
                </td>
                <td className="px-3 py-3 text-sm">
                  {property.city}, {property.state}
                </td>
                <td className="px-3 py-3 text-sm text-right font-medium">
                  {formatCurrency(property.value)}
                </td>
                <td className="px-3 py-3 text-sm text-right">
                  <span className="text-green-600 font-medium">
                    {formatCurrency(property.equity)}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-right">
                  <Badge
                    variant={property.equityPercent >= 50 ? 'default' : 'secondary'}
                    className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                  >
                    {property.equityPercent}%
                  </Badge>
                </td>
                <td className="px-3 py-3 text-sm">{property.ownerType}</td>
                <td className="px-3 py-3">
                  <Select
                    value={property.status}
                    onValueChange={(value) => onStatusChange(property.id, value as PropertyStatus)}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as PropertyStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[status])} />
                            {STATUS_LABELS[status]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {property.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {property.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        +{property.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onRemove(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange?.(Number(value))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of {sortedProperties.length} properties
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange?.(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange?.(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
