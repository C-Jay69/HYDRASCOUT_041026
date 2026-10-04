const sections = [
  {
    title: '1. Acceptance of terms',
    body: `By creating an account or using Hydrascout you agree to these Terms of Service. If you are using Hydrascout on behalf of a company, you represent that you have authority to bind that company.`,
  },
  {
    title: '2. The service',
    body: `Hydrascout automates the collection, classification, cleaning, enrichment, scoring and outreach of distressed-property leads from public and lawfully licensed data sources, and lets you launch marketing campaigns across channels you select.`,
  },
  {
    title: '3. Your responsibilities',
    body: `You are solely responsible for complying with all applicable laws when using the platform, including but not limited to the TCPA, state Do-Not-Call registries, CAN-SPAM, fair housing laws, and the terms of service of any enrichment or outreach provider you connect. Hydrascout provides tooling (consent flags, opt-out language, audit logs) to help, but compliance is your responsibility.`,
  },
  {
    title: '4. Outreach & consent',
    body: `SMS and ringless voicemail outreach requires prior express consent or another lawful basis in your jurisdiction. Without live provider credentials configured, outreach runs in simulation mode and nothing is actually delivered.`,
  },
  {
    title: '5. Acceptable use',
    body: `You may not use Hydrascout to scrape or enrich data in violation of a source's terms of service, to harass property owners, or to send unlawful or deceptive communications.`,
  },
  {
    title: '6. Plans & billing',
    body: `Paid plans are billed in advance on a recurring basis. You can cancel at any time; access continues through the end of the current billing period. See the Pricing page for current plan details.`,
  },
  {
    title: '7. Disclaimer',
    body: `Public-record and enrichment data is provided "as is" and may contain inaccuracies. Hydrascout is not a licensed real estate brokerage, law firm, or skip-tracing bureau, and outputs should be independently verified before being relied upon.`,
  },
  {
    title: '8. Limitation of liability',
    body: `To the maximum extent permitted by law, Hydrascout is not liable for indirect, incidental, or consequential damages arising from use of the platform, including outreach sent through your connected provider accounts.`,
  },
  {
    title: '9. Changes',
    body: `We may update these terms from time to time. Continued use of the platform after changes take effect constitutes acceptance of the revised terms.`,
  },
  {
    title: '10. Contact',
    body: `Questions about these terms can be sent through our Contact page.`,
  },
];

export default function TermsPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
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
