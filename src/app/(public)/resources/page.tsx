import Link from 'next/link';
import { BookOpen, GraduationCap, Video, HelpCircle, Plug, Code2 } from 'lucide-react';

const resources = [
  {
    icon: GraduationCap,
    title: 'Tutorials',
    description: 'Step-by-step, hands-on guides for every part of the platform.',
    href: '/tutorials',
  },
  {
    icon: BookOpen,
    title: 'Blog',
    description: 'Notes on distressed-property data, lead scoring, and outreach compliance.',
    href: '/blog',
  },
  {
    icon: Video,
    title: 'Webinars',
    description: 'Live and on-demand walkthroughs with our team.',
    href: '/webinars',
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    description: 'Answers to the most common questions about the pipeline and compliance.',
    href: '/faq',
  },
  {
    icon: Plug,
    title: 'Integrations',
    description: 'Connect Supabase, SendGrid, Twilio, OpenAI, Zapier, Make, n8n and more.',
    href: '/integrations',
  },
  {
    icon: Code2,
    title: 'API Reference',
    description: 'REST endpoints for launching runs, querying leads, and reading stats.',
    href: '/api',
  },
];

export default function ResourcesPage() {
  return (
    <div className="py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resources</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to get the most out of Hydrascout, in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-[#1a56db]/10 flex items-center justify-center mb-4">
                <r.icon className="w-6 h-6 text-[#1a56db]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{r.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{r.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
