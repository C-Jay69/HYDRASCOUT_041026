import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, Shield, Zap, Users } from 'lucide-react';

const values = [
  {
    icon: Zap,
    title: 'Automate the busywork',
    description:
      'Investors shouldn\u2019t have to babysit spreadsheets and county websites. One Launch click should do the work of a full acquisitions team.',
  },
  {
    icon: Shield,
    title: 'Lawful by default',
    description:
      'Every enrichment lookup is audited, every SMS template includes an opt-out, and outreach runs in simulation mode until you explicitly connect live providers.',
  },
  {
    icon: Target,
    title: 'Prioritize what matters',
    description:
      'Motivation scoring surfaces the sellers most likely to transact first, so your team spends time on calls — not sorting lists.',
  },
  {
    icon: Users,
    title: 'Built for real workflows',
    description:
      'Designed with wholesalers, flippers, and buy-and-hold investors so every stage maps to how acquisitions teams actually work.',
  },
];

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          About Hydrascout
        </h1>
        <p className="text-xl text-gray-600">
          Hydrascout is an automated distressed-property lead generation and outreach platform.
          We built it to turn the entire workflow — collection, classification, enrichment,
          scoring, and outreach — into a single, auditable, one-button automation.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {values.map((value) => (
          <div key={value.title} className="p-6 rounded-xl border border-gray-200 bg-white">
            <div className="w-12 h-12 rounded-lg bg-[#1a56db]/10 flex items-center justify-center mb-4">
              <value.icon className="w-6 h-6 text-[#1a56db]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How it works, end to end</h2>
        <p className="text-gray-600 mb-8">
          Press Launch and Hydrascout collects records from 21 government and public source
          types, classifies them into 17 distress categories, cleans and de-duplicates the data,
          enriches missing contact info with an audit trail, scores every lead 0&ndash;100, builds
          a campaign, and dispatches outreach across the channels you choose — logging every
          action and scheduling follow-ups automatically.
        </p>
        <Button asChild size="lg" className="bg-[#1a56db] hover:bg-[#1e40af] text-white">
          <Link href="/automation/launch">Try the Launch Wizard</Link>
        </Button>
      </div>
    </div>
  );
}
