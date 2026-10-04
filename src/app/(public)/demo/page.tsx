import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Layers, UserSearch, Target, Send, LayoutDashboard, ArrowRight } from 'lucide-react';

const flow = [
  { icon: Search, title: 'Collect', description: '21 data sources queried across your selected counties.' },
  { icon: Layers, title: 'Classify & Clean', description: '17 categories applied, records normalized & de-duplicated.' },
  { icon: UserSearch, title: 'Enrich', description: 'Owner contact info skip-traced with confidence scoring.' },
  { icon: Target, title: 'Score', description: 'Every lead scored 0\u2013100 and sorted by priority.' },
  { icon: Send, title: 'Outreach', description: 'Email, SMS, voicemail, direct mail or call tasks dispatched.' },
  { icon: LayoutDashboard, title: 'Track', description: 'Dashboard updates live with replies, appointments & cost per lead.' },
];

export default function DemoPage() {
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          See the Full Pipeline Run
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          No video to sit through — the fastest way to see Hydrascout is to run it yourself. The
          Launch wizard works immediately in demo mode, with no API keys required.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
        {flow.map((step, i) => (
          <div key={step.title} className="p-6 rounded-xl border border-gray-200 bg-white text-center">
            <div className="w-10 h-10 rounded-full bg-[#1a56db] text-white flex items-center justify-center mx-auto mb-3 text-sm font-bold">
              {i + 1}
            </div>
            <step.icon className="w-6 h-6 text-[#1a56db] mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{step.title}</h3>
            <p className="text-xs text-gray-500">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8">
            <Link href="/automation/launch">
              Run the Launch Wizard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8">
            <Link href="/contact">Request a Live Walkthrough</Link>
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Prefer to see it on your own data first? <Link href="/signup" className="text-[#1a56db] hover:underline">Create a free account</Link> — it includes one county on us.
        </p>
      </div>
    </div>
  );
}
