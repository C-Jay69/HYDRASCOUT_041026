'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from 'lucide-react';

const posts = [
  {
    date: 'Updated this quarter',
    title: 'The 17 distress signals Hydrascout tracks — and why they matter',
    excerpt:
      'A breakdown of every lead category in the platform, from tax delinquency to probate to absentee ownership, and what each one tells you about seller motivation.',
    body: `Every property Hydrascout collects is automatically classified into one or more of 17 categories: tax delinquent, tax lien, tax deed, foreclosure, pre-foreclosure, sheriff sale, probate, bankruptcy, code violations, vacant property, absentee owner, high equity, inherited property, estate sale, water utility delinquent, HOA lien, and other motivated-seller indicators. Properties often match multiple categories at once — a vacant, absentee-owned house in pre-foreclosure is a very different lead than a high-equity probate property, and the motivation score reflects that nuance so your team can prioritize accordingly.`,
  },
  {
    date: 'Updated this quarter',
    title: 'How the 0–100 motivation score is calculated',
    excerpt:
      'Equity, foreclosure stage, vacancy, liens, bankruptcy, ownership length and more all feed into a single, explainable score.',
    body: `Motivation scoring combines signals that correlate with a seller's willingness and urgency to sell: equity position, delinquent taxes, how far along a foreclosure is, vacancy status, probate/estate involvement, number of liens, bankruptcy filings, length of ownership, absentee ownership, and condition indicators from code enforcement data. The result is a single 0–100 score so the highest-priority leads always surface first on your dashboard and in your campaign lists.`,
  },
  {
    date: 'Updated this quarter',
    title: 'A compliant approach to SMS and ringless voicemail outreach',
    excerpt:
      'Why outreach runs in simulation mode by default, and what to check before you go live.',
    body: `SMS and ringless voicemail require prior express consent or another lawful basis in most jurisdictions under the TCPA. Hydrascout ships with opt-out language baked into every SMS template, keeps a full delivery and engagement log per lead, and runs every channel in simulation mode until you explicitly add live provider credentials (Twilio, SendGrid/Mailgun). That means you can build and test full campaigns with zero compliance risk before flipping the switch.`,
  },
];

export default function BlogPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
        <p className="text-gray-600 mb-12">
          Notes on distressed-property data, lead scoring, and compliant outreach automation.
        </p>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {posts.map((post, i) => (
            <AccordionItem
              key={post.title}
              value={`post-${i}`}
              className="border border-gray-200 rounded-xl px-6 bg-white"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="text-left">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> {post.date}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
                  <p className="text-sm text-gray-500 mt-1 font-normal">{post.excerpt}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                {post.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
