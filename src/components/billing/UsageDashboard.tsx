'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, formatLimit, getUsagePercentage } from '@/lib/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CreditTopUp } from './CreditTopUp';
import {
  Building2,
  MapPin,
  Mail,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';

interface UsageMetricProps {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number;
}

function UsageMetric({ icon, label, used, limit }: UsageMetricProps) {
  const percentage = getUsagePercentage(used, limit);
  const isInfinite = limit === Infinity;

  let colorClass = 'bg-primary';
  if (percentage >= 90) colorClass = 'bg-destructive';
  else if (percentage >= 75) colorClass = 'bg-yellow-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {used.toLocaleString()} / {formatLimit(limit)}
        </span>
      </div>
      {!isInfinite && <Progress value={percentage} className="h-2" />}
      {percentage >= 75 && !isInfinite && (
        <div className="flex items-center gap-1 text-xs text-yellow-500">
          <AlertCircle className="h-3 w-3" />
          <span>
            {percentage >= 90 ? 'Critical' : 'Warning'}: Approaching limit
          </span>
        </div>
      )}
    </div>
  );
}

export function UsageDashboard() {
  const { subscription, credits } = useSubscription();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const plan = PLANS[subscription.plan];
  const isFree = subscription.plan === 'free';

  return (
    <div className="space-y-6">
      {/* Plan Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 px-4 py-1.5">
            <span className="text-sm font-semibold text-primary">
              {plan.name} Plan
            </span>
          </div>
          {subscription.status === 'active' && (
            <div className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>Active</span>
            </div>
          )}
          {subscription.status === 'cancelled' && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Cancelled</span>
            </div>
          )}
        </div>
        {credits > 0 && (
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {credits} Bonus Credits
            </span>
          </div>
        )}
      </div>

      {/* Usage Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Leads Processed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {subscription.usage.lookups.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {formatLimit(plan.lookups)}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(subscription.usage.lookups, plan.lookups)}
              className="h-2"
            />
            {getUsagePercentage(subscription.usage.lookups, plan.lookups) >= 75 && (
              <p className="text-xs text-yellow-500">Consider upgrading for more</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Skip Traces
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {subscription.usage.skipTraces.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {formatLimit(plan.skipTraces)}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(subscription.usage.skipTraces, plan.skipTraces)}
              className="h-2"
            />
            {isFree && (
              <p className="text-xs text-muted-foreground">
                Upgrade to access skip traces
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Mail Pieces
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {subscription.usage.mailPieces.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {formatLimit(plan.mailPieces)}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(subscription.usage.mailPieces, plan.mailPieces)}
              className="h-2"
            />
            {isFree && (
              <p className="text-xs text-muted-foreground">
                Upgrade to access direct mail
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Up Button */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium">Need more credits?</p>
            <p className="text-sm text-muted-foreground">
              Top up anytime with pay-as-you-go credits
            </p>
          </div>
        </div>
        <Button onClick={() => setTopUpOpen(true)}>Top Up Credits</Button>
      </div>

      <CreditTopUp open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  );
}
