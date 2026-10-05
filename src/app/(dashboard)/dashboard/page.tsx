"use client";

/**
 * Step 9 — Dashboard with live automation metrics:
 * new leads today, totals per distress category, outreach sent, replies,
 * interested sellers, appointments, conversion rate and cost per lead.
 */

import * as React from "react";
import Link from "next/link";
import {
  Home,
  Gavel,
  Landmark,
  ScrollText,
  DoorOpen,
  Send,
  MessageSquare,
  Flame,
  CalendarCheck,
  Percent,
  DollarSign,
  Sparkles,
  Rocket,
  Users,
  Mail,
  ArrowRight,
  Loader2,
  Handshake,
  FileText,
  UserCheck,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Stats {
  newLeadsToday: number;
  totalProperties: number;
  foreclosures: number;
  preForeclosures: number;
  taxLiens: number;
  probates: number;
  vacant: number;
  outreachSent: number;
  repliesReceived: number;
  interestedSellers: number;
  appointments: number;
  conversionRate: number;
  costPerLead: number;
  totalCost: number;
  runsCompleted: number;
  activeBuyers: number;
  dealsPitched: number;
  dealsAssigned: number;
  dealsClosed: number;
  suppressedContacts: number;
}

interface RunSummary {
  id: string;
  status: string;
  startedAt: string;
  config: { state: string; counties: string[] };
  stats: { afterDedupe: number; outreachSent: number };
}

function StatCard({ title, value, description, icon: Icon, color }: {
  title: string; value: string | number; description: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [runs, setRuns] = React.useState<RunSummary[]>([]);
  const [backend, setBackend] = React.useState<string>("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          fetch("/api/dashboard/stats", { cache: "no-store" }),
          fetch("/api/automation/runs", { cache: "no-store" }),
        ]);
        const sData = await sRes.json();
        const rData = await rRes.json();
        setStats(sData.stats);
        setBackend(sData.backend);
        setRuns((rData.runs || []).slice(0, 6));
      } catch {
        /* retry on next poll */
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString();
  const kpis = [
    { title: "New Leads Today", value: fmt(stats.newLeadsToday), description: "Added by automation runs", icon: Sparkles, color: "bg-[#1a56db]" },
    { title: "Total Distressed Properties", value: fmt(stats.totalProperties), description: `${stats.runsCompleted} runs completed`, icon: Home, color: "bg-[#f97316]" },
    { title: "Outreach Sent", value: fmt(stats.outreachSent), description: `$${stats.totalCost.toFixed(2)} total spend`, icon: Send, color: "bg-[#10b981]" },
    { title: "Replies Received", value: fmt(stats.repliesReceived), description: "Across all channels", icon: MessageSquare, color: "bg-[#8b5cf6]" },
    { title: "Interested Sellers", value: fmt(stats.interestedSellers), description: "Marked interested or better", icon: Flame, color: "bg-[#ef4444]" },
    { title: "Appointments", value: fmt(stats.appointments), description: "Scheduled with sellers", icon: CalendarCheck, color: "bg-[#0ea5e9]" },
    { title: "Conversion Rate", value: `${stats.conversionRate}%`, description: "Interested / total leads", icon: Percent, color: "bg-[#f59e0b]" },
    { title: "Cost Per Lead", value: `$${stats.costPerLead.toFixed(2)}`, description: "Outreach spend / leads", icon: DollarSign, color: "bg-[#10b981]" },
    { title: "Active Buyers", value: fmt(stats.activeBuyers), description: "Investors in your network", icon: Handshake, color: "bg-[#6366f1]" },
    { title: "Deals Pitched", value: fmt(stats.dealsPitched), description: "Pitched to buyers", icon: FileText, color: "bg-[#8b5cf6]" },
    { title: "Deals Assigned", value: fmt(stats.dealsAssigned), description: "Buyers working the deal", icon: UserCheck, color: "bg-[#0ea5e9]" },
    { title: "Closed Deals", value: fmt(stats.dealsClosed), description: `${stats.suppressedContacts} contacts suppressed (DNC)`, icon: Trophy, color: "bg-[#059669]" },
  ];

  const categories = [
    { title: "Foreclosures", value: stats.foreclosures, icon: Gavel },
    { title: "Pre-Foreclosures", value: stats.preForeclosures, icon: ScrollText },
    { title: "Tax Liens", value: stats.taxLiens, icon: Landmark },
    { title: "Probates", value: stats.probates, icon: ScrollText },
    { title: "Vacant", value: stats.vacant, icon: DoorOpen },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Live results from your automated lead generation & outreach pipeline.
            {backend === "memory" && (
              <Badge variant="outline" className="ml-2 text-[10px]">demo mode — in-memory data</Badge>
            )}
          </p>
        </div>
        <Button asChild className="bg-[#1a56db] hover:bg-[#1a4bc7] w-full md:w-auto">
          <Link href="/automation/launch">
            <Rocket className="h-4 w-4 mr-2" /> Launch Automation
          </Link>
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => <StatCard key={k.title} {...k} />)}
      </div>

      {/* Category counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {categories.map((c) => (
          <Card key={c.title}>
            <CardContent className="pt-5 flex items-center gap-3">
              <c.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold tabular-nums">{fmt(c.value)}</p>
                <p className="text-xs text-muted-foreground">{c.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Runs + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Automation Runs</CardTitle>
                <CardDescription>Latest pipeline executions and results</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-[#1a56db]">
                <Link href="/automation/launch">New Run <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-sm text-muted-foreground">No runs yet. Press Launch to run the full pipeline:<br />Collect → Classify → Clean → Enrich → Score → Campaign → Outreach → Follow-ups.</p>
                <Button asChild size="sm"><Link href="/automation/launch"><Rocket className="h-4 w-4 mr-1" /> Launch Automation</Link></Button>
              </div>
            ) : (
              <div className="divide-y">
                {runs.map((run) => (
                  <Link key={run.id} href={`/automation/runs/${run.id}`} className="flex items-center gap-4 py-3 hover:bg-accent/40 px-2 rounded-md transition-colors">
                    <div className={cn("p-2 rounded-lg", run.status === "completed" ? "bg-emerald-500" : run.status === "failed" ? "bg-red-500" : "bg-blue-500")}> 
                      <Rocket className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {run.config.state} — {run.config.counties.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.stats.afterDedupe} leads · {run.stats.outreachSent} outreach sent
                      </p>
                    </div>
                    <Badge variant={run.status === "completed" ? "secondary" : run.status === "failed" ? "destructive" : "outline"} className="text-[10px]">
                      {run.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(run.startedAt).toLocaleTimeString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: "Launch Automation", description: "Run the full pipeline with one click", icon: Rocket, color: "bg-[#1a56db]", href: "/automation/launch" },
              { title: "Lead CRM", description: "Search, filter and work your scored leads", icon: Users, color: "bg-[#f97316]", href: "/leads" },
              { title: "Buyers", description: "Manage your investor network & buy boxes", icon: Handshake, color: "bg-[#6366f1]", href: "/buyers" },
              { title: "Compliance", description: "Do-Not-Contact list & consent audit log", icon: ShieldCheck, color: "bg-[#ef4444]", href: "/compliance" },
              { title: "Campaigns", description: "Review outreach campaigns & results", icon: Mail, color: "bg-[#10b981]", href: "/campaigns" },
            ].map((action) => (
              <Link key={action.title} href={action.href} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left w-full">
                <div className={cn("p-3 rounded-lg", action.color)}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
