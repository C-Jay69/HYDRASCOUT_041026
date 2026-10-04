'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { CREDIT_PACKAGES, formatPrice } from '@/lib/subscription';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Zap, Loader2 } from 'lucide-react';

interface CreditTopUpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditTopUp({ open, onOpenChange }: CreditTopUpProps) {
  const { topUpCredits, isLoading } = useSubscription();
  const [selectedPackage, setSelectedPackage] = useState<number | 'custom' | null>(
    CREDIT_PACKAGES[2].credits
  );
  const [customCredits, setCustomCredits] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const getSelectedCredits = (): number => {
    if (selectedPackage === 'custom') {
      return parseInt(customCredits, 10) || 0;
    }
    const pkg = CREDIT_PACKAGES.find((p) => p.credits === selectedPackage);
    return pkg?.credits || 0;
  };

  const getSelectedPrice = (): number => {
    if (selectedPackage === 'custom') {
      const credits = parseInt(customCredits, 10) || 0;
      return Math.ceil(credits * 0.08 * 100); // $0.08 per credit
    }
    const pkg = CREDIT_PACKAGES.find((p) => p.credits === selectedPackage);
    return pkg?.price || 0;
  };

  const getPricePerCredit = (): string => {
    if (selectedPackage === 'custom') {
      return '$0.08';
    }
    const pkg = CREDIT_PACKAGES.find((p) => p.credits === selectedPackage);
    if (!pkg) return '';
    const pricePerCredit = (pkg.price / pkg.credits / 100).toFixed(2);
    return `$${pricePerCredit}`;
  };

  const handlePurchase = async () => {
    const credits = getSelectedCredits();
    const amount = getSelectedPrice();

    if (credits <= 0 || amount <= 0) return;

    setIsPurchasing(true);
    try {
      const checkoutUrl = await topUpCredits(credits, amount);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        onOpenChange(false);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const isDisabled = getSelectedCredits() <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Top Up Credits
          </DialogTitle>
          <DialogDescription>
            Purchase additional credits to use across all Hydrascout features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Package Selection */}
          <div className="space-y-3">
            <Label>Select Package</Label>
            <RadioGroup
              value={selectedPackage?.toString() || ''}
              onValueChange={(value) => {
                if (value === 'custom') {
                  setSelectedPackage('custom');
                } else {
                  setSelectedPackage(parseInt(value, 10));
                }
              }}
              className="grid grid-cols-2 gap-3"
            >
              {CREDIT_PACKAGES.map((pkg) => (
                <div key={pkg.credits}>
                  <RadioGroupItem
                    value={pkg.credits.toString()}
                    id={`pkg-${pkg.credits}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`pkg-${pkg.credits}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-lg font-bold">{pkg.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(pkg.price)}
                    </span>
                    <span className="text-xs text-green-600">
                      ~${(pkg.price / pkg.credits / 100).toFixed(2)}/credit
                    </span>
                  </Label>
                </div>
              ))}
              <div>
                <RadioGroupItem
                  value="custom"
                  id="pkg-custom"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="pkg-custom"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-lg font-bold">Custom</span>
                  <span className="text-sm text-muted-foreground">
                    Pick amount
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Amount Input */}
          {selectedPackage === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-credits">Number of Credits</Label>
              <Input
                id="custom-credits"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={customCredits}
                onChange={(e) => setCustomCredits(e.target.value)}
              />
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {getSelectedCredits()} Credits
              </span>
              <span>{formatPrice(getSelectedPrice())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per credit</span>
              <span className="font-medium text-green-600">{getPricePerCredit()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatPrice(getSelectedPrice())}</span>
            </div>
          </div>

          {/* Secure Payment Note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isDisabled || isPurchasing}
            className="gap-2"
          >
            {isPurchasing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPurchasing ? 'Processing...' : 'Purchase Credits'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
