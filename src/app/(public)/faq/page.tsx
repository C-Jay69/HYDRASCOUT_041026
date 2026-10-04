import { FAQAccordion } from '@/components/public/FAQAccordion';

const faqs = [
  {
    question: 'What does pressing "Launch" actually do?',
    answer:
      'It runs the full pipeline in order: collect records from your selected counties and data sources, classify them into lead categories, clean and de-duplicate, enrich missing contact info, score motivation 0–100, build a campaign, send outreach on your selected channels, log every action, and schedule follow-ups.',
  },
  {
    question: 'Where does the property data come from?',
    answer:
      'From 21 categories of government and public sources — county tax assessors, recorders, tax collectors, sheriff sales, foreclosure auctions, probate courts, bankruptcy filings, code enforcement, vacant property registries, tax lien/deed databases, open-data portals, HUD/FHA listings, and public notice/NOD/NTS/lis pendens/eviction filings.',
  },
  {
    question: 'What happens if I don\u2019t connect any provider API keys?',
    answer:
      'Everything still works end-to-end in demo/simulation mode: records are generated deterministically, enrichment runs with a demo provider, and outreach is logged as simulated instead of actually sent — so you can test the full workflow before connecting real providers.',
  },
  {
    question: 'How is the motivation score calculated?',
    answer:
      'From equity, delinquent taxes, foreclosure stage, vacancy, probate status, number of liens, bankruptcy, length of ownership, absentee ownership, and condition indicators. Scores range 0–100 and the CRM sorts the highest-priority leads first.',
  },
  {
    question: 'Which outreach channels are supported?',
    answer:
      'Email (SendGrid, with Mailgun fallback), SMS and ringless voicemail (Twilio for SMS; a pluggable adapter for voicemail), direct mail (pluggable adapter), and manual call-task creation for your team.',
  },
  {
    question: 'How do I get my leads into Airtable, Google Sheets, HubSpot, GoHighLevel, Notion or Salesforce?',
    answer:
      'Export any filtered list as CSV straight from the CRM, or configure an outbound webhook (Zapier, Make, n8n, or a direct CRM webhook) in your environment variables — Hydrascout POSTs every completed campaign to it automatically. See the Integrations page for details.',
  },
  {
    question: 'Is this legal?',
    answer:
      'Hydrascout is built around lawful public records and licensed enrichment providers, with audit logs and opt-out language built in. You remain responsible for complying with TCPA, Do-Not-Call rules, and other applicable law in your jurisdiction — see our Legal page.',
  },
  {
    question: 'Can I add new counties or data sources?',
    answer:
      'Yes. The source connector registry is designed to be extended — new counties, new scrapers, or an n8n/Make.com workflow (via a webhook) can be plugged in without changing the rest of the pipeline.',
  },
];

export default function FAQPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600 text-center mb-12">
          Can&apos;t find what you&apos;re looking for? <a href="/contact" className="text-[#1a56db] hover:underline">Contact us</a>.
        </p>
        <FAQAccordion items={faqs} />
      </div>
    </div>
  );
}
