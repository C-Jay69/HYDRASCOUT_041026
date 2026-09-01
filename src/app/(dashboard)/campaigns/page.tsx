'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Plus, Mail, FileText, Stamp, Inbox, Rocket } from 'lucide-react';
import { CampaignStatus } from '@/lib/campaign-data';

interface AutoCampaign {
  id: string;
  runId: string | null;
  name: string;
  channels: string[];
  status: string;
  leadIds: string[];
  stats: { sent: number; delivered: number; failed: number; replies: number; interested: number; appointments: number; cost: number };
  createdAt: string;
}


type TabValue = 'all' | 'active' | 'scheduled' | 'completed';

const tabs: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
];

const statusMap: Record<TabValue, CampaignStatus | null> = {
  all: null,
  active: 'sending',
  scheduled: 'scheduled',
  completed: 'completed',
};

export default function CampaignsPage() {
  const { campaigns, deleteCampaign, duplicateCampaign } = useCampaigns();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [autoCampaigns, setAutoCampaigns] = useState<AutoCampaign[]>([]);

  useEffect(() => {
    fetch('/api/campaigns', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setAutoCampaigns(d.campaigns || []))
      .catch(() => setAutoCampaigns([]));
  }, []);

  const filteredCampaigns = statusMap[activeTab] === null
    ? campaigns
    : campaigns.filter((c) => c.status === statusMap[activeTab]);

  const handleDelete = async (campaign: { id: string; name: string }) => {
    if (confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      await deleteCampaign(campaign.id);
    }
  };

  const handleDuplicate = async (campaign: { id: string }) => {
    await duplicateCampaign(campaign.id);
  };

  const getCount = (tab: TabValue) => {
    if (tab === 'all') return campaigns.length;
    const status = statusMap[tab];
    if (status === null) return campaigns.length;
    return campaigns.filter((c) => c.status === status).length;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your direct mail and email campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Automation campaigns (created by the Launch pipeline) */}
      {autoCampaigns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" /> Automation Campaigns
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {autoCampaigns.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-tight">{c.name}</p>
                  <Badge variant={c.status === 'completed' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">{c.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.channels.map((ch) => <Badge key={ch} variant="outline" className="text-[10px]">{ch.replace('_', ' ')}</Badge>)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="text-lg font-bold tabular-nums">{c.stats.sent}</p><p className="text-muted-foreground">Sent</p></div>
                  <div><p className="text-lg font-bold tabular-nums">{c.stats.replies}</p><p className="text-muted-foreground">Replies</p></div>
                  <div><p className="text-lg font-bold tabular-nums">${c.stats.cost.toFixed(2)}</p><p className="text-muted-foreground">Cost</p></div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.leadIds.length} leads · {new Date(c.createdAt).toLocaleDateString()}</span>
                  {c.runId && <Link className="text-primary hover:underline" href={`/automation/runs/${c.runId}`}>View run</Link>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {getCount(tab.value)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          ) : (
            <EmptyState activeTab={activeTab} />
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <QuickStat
          icon={<Mail className="h-5 w-5" />}
          label="Total Campaigns"
          value={campaigns.length.toString()}
        />
        <QuickStat
          icon={<Stamp className="h-5 w-5" />}
          label="Postcards Sent"
          value={campaigns
            .filter((c) => c.type === 'postcard')
            .reduce((acc, c) => acc + c.stats.sent, 0)
            .toLocaleString()}
        />
        <QuickStat
          icon={<FileText className="h-5 w-5" />}
          label="Letters Sent"
          value={campaigns
            .filter((c) => c.type === 'letter')
            .reduce((acc, c) => acc + c.stats.sent, 0)
            .toLocaleString()}
        />
        <QuickStat
          icon={<Inbox className="h-5 w-5" />}
          label="Total Delivered"
          value={campaigns
            .reduce((acc, c) => acc + c.stats.delivered, 0)
            .toLocaleString()}
        />
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ activeTab }: { activeTab: TabValue }) {
  const messages: Record<TabValue, { title: string; description: string }> = {
    all: {
      title: 'No campaigns yet',
      description: 'Create your first marketing campaign to get started',
    },
    active: {
      title: 'No active campaigns',
      description: 'Campaigns that are currently sending will appear here',
    },
    scheduled: {
      title: 'No scheduled campaigns',
      description: 'Campaigns scheduled for future sending will appear here',
    },
    completed: {
      title: 'No completed campaigns',
      description: 'Campaigns that have finished sending will appear here',
    },
  };

  const { title, description } = messages[activeTab];

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Mail className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button className="mt-4" asChild>
        <Link href="/campaigns/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Link>
      </Button>
    </div>
  );
}
