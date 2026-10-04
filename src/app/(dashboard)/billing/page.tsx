'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, PlanKey, formatPrice } from '@/lib/subscription';
import { UsageDashboard } from '@/components/billing/UsageDashboard';
import { BillingHistory } from '@/components/billing/BillingHistory';
import { CreditTopUp } from '@/components/billing/CreditTopUp';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Crown,
  Check,
  X,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Calendar,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

const PLAN_FEATURES = {
  free: [
    { label: 'Leads (1 county)', value: '100/month' },
    { label: 'Skip Traces', value: false },
    { label: 'Direct Mail', value: false },
    { label: 'Export Data', value: false },
    { label: 'Priority Support', value: false },
  ],
  basic: [
    { label: 'Leads (3 counties)', value: '1,000/month' },
    { label: 'Skip Traces', value: '100/month' },
    { label: 'Direct Mail', value: false },
    { label: 'Export Data', value: 'CSV only' },
    { label: 'Priority Support', value: false },
  ],
  pro: [
    { label: 'Leads (10 counties)', value: '5,000/month' },
    { label: 'Skip Traces', value: '500/month' },
    { label: 'Direct Mail', value: '500 pieces' },
    { label: 'Export Data', value: 'CSV + Excel' },
    { label: 'Priority Support', value: true },
  ],
  team: [
    { label: 'Leads (unlimited counties)', value: 'Unlimited' },
    { label: 'Skip Traces', value: 'Unlimited' },
    { label: 'Direct Mail', value: '2,000 pieces' },
    { label: 'Export Data', value: 'CSV + Excel + API' },
    { label: 'Priority Support', value: true },
  ],
} as const;

function PlanCard({
  planKey,
  currentPlan,
  onSelect,
  isLoading,
}: {
  planKey: PlanKey;
  currentPlan: PlanKey;
  onSelect: (plan: PlanKey) => void;
  isLoading: boolean;
}) {
  const plan = PLANS[planKey];
  const features = PLAN_FEATURES[planKey];
  const isCurrent = currentPlan === planKey;
  const isUpgrade = planKey !== 'free' && PLANS[currentPlan].price < plan.price;

  return (
    <Card
      className={`relative ${planKey === 'pro' ? 'border-primary shadow-lg' : ''}`}
    >
      {planKey === 'pro' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {planKey === 'team' && <Crown className="h-5 w-5 text-yellow-500" />}
          {plan.name}
        </CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
          <span className="text-muted-foreground">/month</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-center gap-2">
              {typeof feature.value === 'boolean' ? (
                feature.value ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
              <span>
                {feature.label}:{' '}
                <span className="font-medium">
                  {typeof feature.value === 'string' ? feature.value : 'N/A'}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={planKey === 'pro' ? 'default' : 'outline'}
          disabled={isCurrent || isLoading}
          onClick={() => onSelect(planKey)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCurrent ? (
            'Current Plan'
          ) : isUpgrade ? (
            <>
              <ArrowUpRight className="h-4 w-4" />
              <span className="ml-1">Upgrade</span>
            </>
          ) : (
            'Downgrade'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function UpgradeDialog({
  open,
  onOpenChange,
  targetPlan,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan: PlanKey;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const plan = PLANS[targetPlan];
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Plan Change</DialogTitle>
          <DialogDescription>
            You are about to change your subscription to the {plan.name} plan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">New Plan</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Monthly Cost</span>
              <span className="font-medium">{formatPrice(plan.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Billing Date</span>
              <span className="font-medium">
                {currentPeriodEnd.toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <p>
              Your subscription will be upgraded immediately. Unused credits from
              your current billing period will not be refunded.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BillingPage() {
  const { subscription, upgradePlan, cancelSubscription, isLoading } =
    useSubscription();
  const [upgradeTarget, setUpgradeTarget] = useState<PlanKey | null>(null);
  const [activeTab, setActiveTab] = useState('usage');

  const handleUpgrade = async () => {
    if (!upgradeTarget) return;
    await upgradePlan(upgradeTarget);
    setUpgradeTarget(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, usage, and billing history
        </p>
      </div>

      {/* Current Plan Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/20 p-3">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-2xl font-bold">{PLANS[subscription.plan].name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Renews {subscription.currentPeriodEnd.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {subscription.plan !== 'free' && (
              <Button variant="outline" onClick={cancelSubscription}>
                Cancel Subscription
              </Button>
            )}
            <Button onClick={() => setActiveTab('plans')}>Change Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">Usage & Plan</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          <UsageDashboard />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(['free', 'basic', 'pro', 'team'] as PlanKey[]).map((planKey) => (
              <PlanCard
                key={planKey}
                planKey={planKey}
                currentPlan={subscription.plan}
                onSelect={(plan) => setUpgradeTarget(plan)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <BillingHistory />
        </TabsContent>
      </Tabs>

      {/* Upgrade Confirmation Dialog */}
      <UpgradeDialog
        open={!!upgradeTarget}
        onOpenChange={(open) => !open && setUpgradeTarget(null)}
        targetPlan={upgradeTarget || 'free'}
        onConfirm={handleUpgrade}
        isLoading={isLoading}
      />

      {/* Credit Top Up Dialog - triggered internally by UsageDashboard */}
    </div>
  );
}
