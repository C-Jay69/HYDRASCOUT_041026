'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLeadLists, Property } from '@/hooks/useLeadLists';

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertiesToAdd?: Property[];
}

export function CreateListDialog({
  open,
  onOpenChange,
  propertiesToAdd = [],
}: CreateListDialogProps) {
  const router = useRouter();
  const { createList } = useLeadLists();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startFromFilters, setStartFromFilters] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const newList = await createList(name.trim(), description.trim(), propertiesToAdd);
      onOpenChange(false);
      setName('');
      setDescription('');
      if (newList?.id) {
        router.push(`/lists/${newList.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
      setDescription('');
      setStartFromFilters(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a new lead list to organize and manage your properties.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., High Equity Investors"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this list..."
                rows={3}
              />
            </div>

            {propertiesToAdd.length > 0 && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  This list will include {propertiesToAdd.length}{' '}
                  {propertiesToAdd.length === 1 ? 'property' : 'properties'}.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create List
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
