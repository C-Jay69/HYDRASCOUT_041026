import Link from 'next/link';
import { FileText, ShieldCheck, Scale } from 'lucide-react';

const docs = [
  {
    icon: ShieldCheck,
    title: 'Privacy Policy',
    description: 'What data we collect, how it is used, and your choices.',
    href: '/privacy',
  },
  {
    icon: FileText,
    title: 'Terms of Service',
    description: 'The rules for using Hydrascout, including outreach compliance.',
    href: '/terms',
  },
];

export default function LegalPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Legal</h1>
        <p className="text-gray-600 mb-10">
          Hydrascout automates outreach to property owners sourced from public records. We take
          compliance seriously — here is where our governing documents and compliance notes live.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {docs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1a56db]/10 flex items-center justify-center mb-3">
                <doc.icon className="w-5 h-5 text-[#1a56db]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
              <p className="text-sm text-gray-600">{doc.description}</p>
            </Link>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 flex gap-4">
          <Scale className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Compliance notice</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              SMS and ringless voicemail outreach requires prior express consent or another
              lawful basis under the TCPA and applicable state law in most jurisdictions. Honor
              Do-Not-Call lists, include opt-out language (built into the default templates), and
              consult your own counsel before sending live outreach at scale. Hydrascout runs
              outreach in simulation mode by default until you connect live provider credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
