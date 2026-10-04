import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlayCircle, Users, CalendarClock } from 'lucide-react';

const sessions = [
  {
    icon: PlayCircle,
    title: 'Platform Walkthrough: Launch → Dashboard',
    description:
      'A full tour of the Launch wizard, live run monitor, Lead CRM, and dashboard metrics — recorded on demand.',
    href: '/demo',
    cta: 'Watch the walkthrough',
  },
  {
    icon: Users,
    title: 'Live Group Demo',
    description:
      'Join a live session with our team where we run a real automation end-to-end and answer questions about compliance, scoring, and integrations.',
    href: '/contact',
    cta: 'Request a seat',
  },
  {
    icon: CalendarClock,
    title: '1:1 Onboarding Session',
    description:
      'Book time with our team to configure your counties, lead types, outreach channels, and CRM sync for your market.',
    href: '/contact',
    cta: 'Book onboarding',
  },
];

export default function WebinarsPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Webinars</h1>
        <p className="text-gray-600 mb-12">
          Live and on-demand sessions to help your team get the most out of Hydrascout.
        </p>

        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.title}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-gray-200 bg-white"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a56db]/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-5 h-5 text-[#1a56db]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                </div>
              </div>
              <Button asChild variant="outline" className="flex-shrink-0">
                <Link href={s.href}>{s.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
