const endpoints = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check. Returns { status: "ok" }.',
  },
  {
    method: 'GET',
    path: '/api/automation/sources',
    description: 'List all 21 registered data-source connectors and the lead categories each one feeds.',
  },
  {
    method: 'POST',
    path: '/api/automation/launch',
    description: 'Validate a launch config and queue a pipeline run in the background.',
    body: `{
  "state": "TX",
  "counties": ["Harris", "Dallas"],
  "leadTypes": ["tax_delinquent", "foreclosure", "pre_foreclosure", "probate", "vacant"],
  "channels": ["email", "sms", "direct_mail", "call_task"],
  "campaignName": "Q4 Harris & Dallas Push",
  "minScore": 40
}`,
    returns: '202 Accepted — { runId, status: "queued", backend }',
  },
  {
    method: 'GET',
    path: '/api/automation/runs',
    description: 'List recent automation runs with their status and stats.',
  },
  {
    method: 'GET',
    path: '/api/automation/runs/{id}',
    description: 'Poll a single run for live stage progress, logs, and final stats.',
  },
  {
    method: 'GET',
    path: '/api/leads',
    description:
      'Searchable CRM with filters: search, state, county, city, zip, category, status, ownerType, minScore, limit.',
    returns: '200 OK — { leads: Lead[], count }',
  },
  {
    method: 'GET',
    path: '/api/leads/{id}',
    description: 'Fetch a single lead with full enrichment, communication and follow-up history.',
  },
  {
    method: 'PATCH',
    path: '/api/leads/{id}',
    description: 'Update a lead\u2019s status, notes, or tags.',
  },
  {
    method: 'GET',
    path: '/api/campaigns',
    description: 'List campaigns with channel mix, lead counts, and delivery/engagement stats.',
  },
  {
    method: 'GET',
    path: '/api/dashboard/stats',
    description:
      'Aggregate dashboard metrics: new leads today, totals by category, outreach sent, replies, appointments, conversion rate, and cost per lead.',
  },
];

const methodColor: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-amber-100 text-amber-700',
};

export default function ApiPage() {
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">API Reference</h1>
        <p className="text-gray-600 mb-10">
          Every automation action in Hydrascout is backed by a REST endpoint so you can trigger
          runs, pull leads, or build your own front end. These are the live routes this
          deployment exposes.
        </p>

        <div className="space-y-4">
          {endpoints.map((e) => (
            <div key={e.path + e.method} className="p-5 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${methodColor[e.method] || 'bg-gray-100 text-gray-700'}`}
                >
                  {e.method}
                </span>
                <code className="text-sm font-mono text-gray-900">{e.path}</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">{e.description}</p>
              {e.body && (
                <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto mb-2">
                  <code>{e.body}</code>
                </pre>
              )}
              {e.returns && <p className="text-xs text-gray-400">Returns: {e.returns}</p>}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl bg-[#1a56db]/5 border border-[#1a56db]/20">
          <h2 className="font-semibold text-gray-900 mb-2">Authentication</h2>
          <p className="text-sm text-gray-600">
            In this deployment the API is scoped to your logged-in session. For server-to-server
            automation (n8n, Zapier, Make), use the outbound/inbound webhook integrations
            described on the <a href="/integrations" className="text-[#1a56db] hover:underline">Integrations</a> page instead of calling these routes directly from another service.
          </p>
        </div>
      </div>
    </div>
  );
}
