const sections = [
  {
    title: '1. What we collect',
    body: `We collect the account information you provide (name, email, company), usage data about how you interact with the platform, and the property/owner records your automation runs retrieve from public government sources or enrichment providers you connect.`,
  },
  {
    title: '2. How we use data',
    body: `Data is used to operate the platform: running your automations, enriching and scoring leads, sending outreach you authorize, and showing you dashboard analytics. We do not sell your lead lists or outreach data to third parties.`,
  },
  {
    title: '3. Public record & enrichment data',
    body: `Property and ownership data is collected from publicly available government sources (tax assessor, recorder, court filings, etc.) or from licensed enrichment providers you configure with your own API credentials. You are responsible for ensuring your use of enrichment providers complies with that provider's terms of service and applicable law.`,
  },
  {
    title: '4. Data retention & deletion',
    body: `Lead, communication, and audit records are retained for as long as your account is active so you retain a compliance trail of enrichment sources and outreach history. You may request deletion of your account data at any time via the Contact page.`,
  },
  {
    title: '5. Third-party processors',
    body: `When configured, outreach and AI features are processed by the providers you connect (e.g. SendGrid, Mailgun, Twilio, OpenAI, Anthropic, Supabase). Data sent to those providers is governed by their respective privacy policies.`,
  },
  {
    title: '6. Security',
    body: `We use industry-standard encryption in transit (TLS) and access controls on stored data. No system is 100% secure, and you should use strong, unique credentials for your account and connected provider keys.`,
  },
  {
    title: '7. Your choices',
    body: `You can export or delete your lead data at any time from the CRM, and you can disconnect any enrichment or outreach provider by removing its API keys from your environment configuration.`,
  },
  {
    title: '8. Contact',
    body: `Questions about this policy can be sent through our Contact page.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: {new Date().getFullYear()}</p>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
