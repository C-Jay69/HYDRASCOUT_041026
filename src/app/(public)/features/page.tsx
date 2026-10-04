import { Button } from '@/components/ui/button';
import { Check, Search, Layers, UserSearch, Target, Send, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

const featureSections = [
  {
    id: 'data-collection',
    title: 'Automated Data Collection',
    description:
      'Hydrascout pulls fresh records from 21 government and public source types — county tax assessors, recorders, sheriff sales, foreclosure auctions, probate courts, bankruptcy filings, code enforcement, tax lien/deed rolls, NOD/NTS/lis pendens notices, and more.',
    bullets: [
      'County Tax Assessor, Recorder & Tax Collector feeds',
      'Sheriff sale & foreclosure auction calendars',
      'Probate, bankruptcy & code enforcement records',
      'Extensible connector registry — add new counties over time',
    ],
    icon: Search,
    imageAlt: 'Data collection sources',
    cta: { label: 'Open the Launch Wizard', href: '/automation/launch' },
  },
  {
    id: 'classification-cleaning',
    title: 'Classification & Data Cleaning',
    description:
      'Every property is automatically categorized into one or more of 17 motivated-seller categories, then normalized and de-duplicated — owner names, addresses, parcel numbers, and financials are cleaned before anything hits your CRM.',
    bullets: [
      'Tax delinquent, lien, deed, pre-foreclosure, probate, vacant & more',
      'Address, owner name & ZIP normalization',
      'Automatic duplicate detection across runs',
      'Properties can belong to multiple categories at once',
    ],
    icon: Layers,
    imageAlt: 'Classification pipeline',
    cta: { label: 'View the Lead CRM', href: '/leads' },
  },
  {
    id: 'contact-enrichment',
    title: 'Contact Enrichment & Skip Tracing',
    description:
      'Missing owner contact info is enriched automatically with a confidence score for every match. Low-confidence results are rejected, and every lookup is written to an audit log.',
    bullets: [
      'Phone, email & mailing address enrichment',
      'LLC / corporate ownership lookups',
      'Confidence scoring with automatic rejection threshold',
      'Full enrichment audit trail per lead',
    ],
    icon: UserSearch,
    imageAlt: 'Skip tracing results',
    cta: { label: 'Try Skip Tracing', href: '/skip-trace' },
  },
  {
    id: 'lead-scoring',
    title: 'AI Motivation Scoring',
    description:
      'Every lead gets a 0–100 motivation score from equity, delinquent taxes, foreclosure stage, vacancy, probate, liens, bankruptcy, ownership length, absentee status, and condition indicators — highest priority leads always sort first.',
    bullets: [
      'Transparent, explainable 0–100 scoring model',
      'AI-generated property summaries & investor/owner-occupant detection',
      'Recommended outreach channel per lead',
      'Suggested follow-up timing based on urgency',
    ],
    icon: Target,
    imageAlt: 'Motivation scoring',
    cta: { label: 'See the Dashboard', href: '/dashboard' },
  },
  {
    id: 'outreach-campaigns',
    title: 'Multi-Channel Outreach Campaigns',
    description:
      'Launch personalized campaigns across email, SMS, ringless voicemail, direct mail, and manual call tasks — with editable templates, merge variables, and delivery tracking.',
    bullets: [
      'Email (SendGrid/Mailgun), SMS & voicemail (Twilio) when configured',
      'Direct mail & call-task workflows',
      'Variables: owner name, address, city, county, equity, foreclosure date',
      'Delivery status, replies & appointments tracked per lead',
    ],
    icon: Send,
    imageAlt: 'Campaign builder',
    cta: { label: 'Build a Campaign', href: '/campaigns/new' },
  },
  {
    id: 'dashboard-crm',
    title: 'Dashboard, CRM & Integrations',
    description:
      'A searchable CRM keeps every owner, property, contact, category, score, note, tag and follow-up in one place, with a live dashboard tracking the metrics that matter — and webhook sync out to Zapier, Make, n8n, Airtable, Google Sheets, Notion, HubSpot, GoHighLevel and Salesforce.',
    bullets: [
      'New leads, outreach sent, replies, appointments & cost per lead',
      'Search & filter by state, county, ZIP, score, status & more',
      'Supabase/PostgreSQL persistence with CSV export',
      'Outbound webhook sync to your CRM or spreadsheet of choice',
    ],
    icon: LayoutDashboard,
    imageAlt: 'Dashboard overview',
    cta: { label: 'View Integrations', href: '/integrations' },
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="text-center mb-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Everything in the Build Prompt, Built In
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Collection, classification, cleaning, enrichment, scoring, campaign building and
          outreach — one Launch button runs the entire distressed-property pipeline.
        </p>
      </div>

      {/* Feature Sections */}
      <div className="space-y-24 max-w-7xl mx-auto px-4">
        {featureSections.map((feature, index) => (
          <div
            key={feature.id}
            id={feature.id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Content */}
            <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a56db]/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-[#1a56db]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {feature.title}
                </h2>
              </div>
              <p className="text-lg text-gray-600 mb-6">{feature.description}</p>
              <ul className="space-y-3 mb-8">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#1a56db] flex-shrink-0" />
                    <span className="text-gray-700">{bullet}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="bg-[#1a56db] hover:bg-[#1e40af] text-white"
              >
                <Link href={feature.cta.href}>{feature.cta.label}</Link>
              </Button>
            </div>

            {/* Icon panel */}
            <div
              className={`bg-gradient-to-br from-[#1a56db]/10 to-[#f97316]/10 rounded-2xl aspect-video flex items-center justify-center ${
                index % 2 === 1 ? 'lg:order-1' : ''
              }`}
            >
              <div className="text-center">
                <feature.icon className="w-16 h-16 text-[#1a56db]/30 mx-auto mb-4" />
                <p className="text-sm text-gray-500">{feature.imageAlt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-24 text-center px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Find Your Next Deal?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Join the investors using Hydrascout to automate their lead generation.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold"
        >
          <Link href="/signup">Start Free</Link>
        </Button>
      </div>
    </div>
  );
}
