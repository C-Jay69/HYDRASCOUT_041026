import { CheckCircle2, Circle } from 'lucide-react';

interface Integration {
  name: string;
  description: string;
  href: string;
  configured: boolean;
  how: string;
}

function buildIntegrations(): { category: string; items: Integration[] }[] {
  const has = (...keys: string[]) => keys.some((k) => Boolean(process.env[k]));

  return [
    {
      category: 'Database',
      items: [
        {
          name: 'Supabase',
          description: 'Persistent Postgres-backed store for leads, runs, communications and audits.',
          href: 'https://supabase.com',
          configured: has('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_DATABASE_URL'),
          how: 'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.',
        },
        {
          name: 'PostgreSQL',
          description: 'Hydrascout\u2019s schema (database/schema.sql) runs on any Postgres instance, including self-hosted.',
          href: 'https://www.postgresql.org',
          configured: has('DATABASE_URL'),
          how: 'Point DATABASE_URL at your Postgres connection string or use Supabase\u2019s managed Postgres.',
        },
      ],
    },
    {
      category: 'Outreach',
      items: [
        {
          name: 'Sender.net',
          description: 'Primary email delivery provider for outreach campaigns (checked first).',
          href: 'https://www.sender.net',
          configured: has('SENDER_API_TOKEN'),
          how: 'Set SENDER_API_TOKEN, SENDER_FROM_EMAIL and SENDER_FROM_NAME.',
        },
        {
          name: 'SendGrid',
          description: 'Email fallback used when Sender.net isn\u2019t configured.',
          href: 'https://sendgrid.com',
          configured: has('SENDGRID_API_KEY'),
          how: 'Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.',
        },
        {
          name: 'Mailgun',
          description: 'Automatic email fallback when neither Sender.net nor SendGrid is configured.',
          href: 'https://www.mailgun.com',
          configured: has('MAILGUN_API_KEY'),
          how: 'Set MAILGUN_API_KEY, MAILGUN_DOMAIN and MAILGUN_FROM_EMAIL.',
        },
        {
          name: 'Twilio',
          description: 'SMS and voice/voicemail outreach delivery (requires lawful consent basis).',
          href: 'https://www.twilio.com',
          configured: has('TWILIO_ACCOUNT_SID'),
          how: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER.',
        },
      ],
    },
    {
      category: 'Data enrichment',
      items: [
        {
          name: 'Melissa',
          description: 'Skip-trace / address & contact data quality provider for enrichment lookups.',
          href: 'https://www.melissa.com',
          configured: has('MELISSA_API_KEY'),
          how: 'Set MELISSA_API_KEY. (Credential stored; not yet wired into the live enrichment path \u2014 the demo skip-trace provider is still active.)',
        },
        {
          name: 'Google Maps',
          description: 'Powers the interactive property map view.',
          href: 'https://developers.google.com/maps',
          configured: has('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API'),
          how: 'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.',
        },
      ],
    },
    {
      category: 'AI',
      items: [
        {
          name: 'OpenAI',
          description: 'Drafts personalized outreach, summaries and call scripts when connected.',
          href: 'https://openai.com',
          configured: has('OPENAI_API_KEY'),
          how: 'Set OPENAI_API_KEY (and optionally OPENAI_MODEL).',
        },
        {
          name: 'Anthropic',
          description: 'Alternate LLM provider for AI drafting and summaries.',
          href: 'https://www.anthropic.com',
          configured: has('ANTHROPIC_API_KEY'),
          how: 'Set ANTHROPIC_API_KEY (and optionally ANTHROPIC_MODEL).',
        },
        {
          name: 'Google Gemini',
          description: 'Alternate LLM provider, tried after OpenAI/Anthropic.',
          href: 'https://ai.google.dev',
          configured: has('GEMINI_API_KEY'),
          how: 'Set GEMINI_API_KEY (and optionally GEMINI_MODEL).',
        },
        {
          name: 'OpenRouter',
          description: 'Multi-model LLM gateway, tried after Gemini.',
          href: 'https://openrouter.ai',
          configured: has('OPENROUTER_API_KEY'),
          how: 'Set OPENROUTER_API_KEY (and optionally OPENROUTER_MODEL).',
        },
        {
          name: 'NVIDIA NIM',
          description: 'Alternate LLM provider, tried after OpenRouter.',
          href: 'https://build.nvidia.com',
          configured: has('NVIDIA_NIM_KEY'),
          how: 'Set NVIDIA_NIM_KEY (and optionally NVIDIA_NIM_MODEL).',
        },
        {
          name: 'OpenCode Zen',
          description: 'Final LLM fallback provider in the AI chain.',
          href: 'https://opencode.ai/zen',
          configured: has('OPENCODE_ZEN_KEY'),
          how: 'Set OPENCODE_ZEN_KEY (and optionally OPENCODE_ZEN_MODEL).',
        },
      ],
    },
    {
      category: 'Automation & CRM sync',
      items: [
        {
          name: 'n8n',
          description: 'Preferred workflow engine — feed real county scraping results into the Collect stage.',
          href: 'https://n8n.io',
          configured: has('N8N_WEBHOOK_URL'),
          how: 'Set N8N_WEBHOOK_URL to a webhook that returns { records: RawRecord[] }.',
        },
        {
          name: 'Make (Integromat)',
          description: 'Receives completed campaigns via webhook to fan out to any connected app.',
          href: 'https://www.make.com',
          configured: has('MAKE_WEBHOOK_URL'),
          how: 'Set MAKE_WEBHOOK_URL to a Make "Webhooks" trigger URL.',
        },
        {
          name: 'Zapier',
          description: 'Receives completed campaigns via webhook — the easiest way to reach 7,000+ apps.',
          href: 'https://zapier.com',
          configured: has('ZAPIER_WEBHOOK_URL'),
          how: 'Set ZAPIER_WEBHOOK_URL to a Zapier "Catch Hook" trigger URL.',
        },
        {
          name: 'Airtable',
          description: 'Sync leads into an Airtable base via a Zapier/Make automation or Airtable\u2019s own incoming webhook extension.',
          href: 'https://www.airtable.com',
          configured: has('CRM_WEBHOOK_URL'),
          how: 'Bridge through Zapier/Make, or set CRM_WEBHOOK_URL directly to an Airtable automation webhook.',
        },
        {
          name: 'Google Sheets',
          description: 'Append each completed campaign\u2019s leads to a spreadsheet, or just export CSV from the CRM.',
          href: 'https://www.google.com/sheets/about/',
          configured: has('CRM_WEBHOOK_URL'),
          how: 'Bridge through Zapier/Make\u2019s Google Sheets module, or export CSV directly from /leads.',
        },
        {
          name: 'Notion',
          description: 'Push new leads into a Notion database for team visibility.',
          href: 'https://www.notion.so',
          configured: has('CRM_WEBHOOK_URL'),
          how: 'Bridge through Zapier/Make\u2019s Notion module, or set CRM_WEBHOOK_URL to a Notion-connected automation.',
        },
        {
          name: 'HubSpot',
          description: 'Create or update CRM contacts/deals from new leads.',
          href: 'https://www.hubspot.com',
          configured: has('CRM_WEBHOOK_URL'),
          how: 'Point CRM_WEBHOOK_URL at a HubSpot workflow\u2019s inbound webhook trigger.',
        },
        {
          name: 'GoHighLevel',
          description: 'Sync leads and trigger GHL outreach workflows.',
          href: 'https://www.gohighlevel.com',
          configured: has('CRM_WEBHOOK_URL'),
          how: 'Point CRM_WEBHOOK_URL at a GoHighLevel workflow\u2019s inbound webhook trigger.',
        },
        {
          name: 'Salesforce',
          description: 'Create leads/opportunities in Salesforce from completed campaigns.',
          href: 'https://www.salesforce.com',
          configured: has('CRM_WEBHOOK_URL'),
          how: 'Bridge through a Salesforce Flow with an inbound webhook, or via Zapier/Make.',
        },
      ],
    },
    {
      category: 'Billing',
      items: [
        {
          name: 'Stripe',
          description: 'Subscription billing and credit top-ups.',
          href: 'https://stripe.com',
          configured: has('STRIPE_SECRET_KEY'),
          how: 'Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.',
        },
      ],
    },
  ];
}

export default function IntegrationsPage() {
  const groups = buildIntegrations();

  return (
    <div className="py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Integrations</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hydrascout runs fully in demo mode with zero configuration, and comes alive as you
            connect real providers. Status below reflects this deployment&apos;s environment.
          </p>
        </div>

        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{group.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.items.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.configured ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 className="w-4 h-4" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                          <Circle className="w-4 h-4" /> Not configured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <p className="text-xs text-gray-400">{item.how}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
