import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const tutorials = [
  {
    title: 'Run your first automation',
    minutes: 5,
    steps: [
      'Open the Launch wizard and pick a state plus one or more counties.',
      'Select the lead types you want (foreclosure, probate, vacant, etc.).',
      'Choose outreach channels and review the default templates.',
      'Click Launch and watch the live run log collect, classify, enrich, score and send outreach.',
    ],
    href: '/automation/launch',
    cta: 'Open the Launch Wizard',
  },
  {
    title: 'Work the Lead CRM',
    minutes: 4,
    steps: [
      'Open the Lead CRM and filter by state, county, category, or motivation score.',
      'Click into a lead to see enrichment audit history and communication log.',
      'Update status, add notes and tags, and set a follow-up reminder.',
      'Export a filtered list to CSV for Airtable, Sheets, or your own CRM.',
    ],
    href: '/leads',
    cta: 'Open the Lead CRM',
  },
  {
    title: 'Build a targeted campaign',
    minutes: 6,
    steps: [
      'Go to Campaigns → New Campaign and choose a lead list or filter.',
      'Pick one or more channels and edit the message templates.',
      'Use merge variables like {{owner_name}}, {{property_address}} and {{estimated_equity}}.',
      'Launch and track delivery, replies, and appointments from the Campaigns page.',
    ],
    href: '/campaigns/new',
    cta: 'Build a Campaign',
  },
  {
    title: 'Skip trace a single property',
    minutes: 3,
    steps: [
      'Open Skip Trace and enter an address or owner name.',
      'Review the enrichment confidence score before you contact anyone.',
      'Save verified contacts directly back onto the lead record.',
    ],
    href: '/skip-trace',
    cta: 'Try Skip Tracing',
  },
  {
    title: 'Connect your own providers',
    minutes: 8,
    steps: [
      'Copy .env.example to .env.local.',
      'Add SendGrid/Mailgun and Twilio keys to send real outreach instead of simulated.',
      'Add OpenAI or Anthropic keys to enable AI-drafted messages and summaries.',
      'Add a Zapier, Make, or n8n webhook URL to sync completed campaigns to your CRM.',
    ],
    href: '/integrations',
    cta: 'View Integrations',
  },
];

export default function TutorialsPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Tutorials</h1>
        <p className="text-gray-600 mb-12">
          Short, hands-on walkthroughs for every part of the platform — each one links straight
          into the live app so you can follow along.
        </p>

        <div className="space-y-6">
          {tutorials.map((t) => (
            <div key={t.title} className="p-6 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
                <span className="text-xs text-gray-400">{t.minutes} min</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 mb-4">
                {t.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Button asChild size="sm" variant="outline">
                <Link href={t.href}>
                  {t.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
