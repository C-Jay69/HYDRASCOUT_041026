import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/public/FeatureCard';
import { TestimonialCard } from '@/components/public/TestimonialCard';
import {
  Search,
  Layers,
  UserSearch,
  Target,
  Send,
  LayoutDashboard,
  ArrowRight,
  Rocket,
} from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Automated Data Collection',
    description:
      'Pulls distressed-property leads from 21 government and public source types — tax assessors, sheriff sales, foreclosure auctions, probate courts, lien databases, and more.',
  },
  {
    icon: Layers,
    title: 'Classification & Cleaning',
    description:
      'Every record is auto-categorized into 17 motivated-seller categories, normalized, and de-duplicated before it ever reaches your CRM.',
  },
  {
    icon: UserSearch,
    title: 'Contact Enrichment',
    description:
      'Missing owner contact info is skip-traced automatically with a confidence score, an audit trail, and low-confidence matches rejected for you.',
  },
  {
    icon: Target,
    title: 'AI Motivation Scoring',
    description:
      'Every property gets a 0–100 motivation score based on equity, foreclosure stage, vacancy, probate, liens, and more — highest priority leads first.',
  },
  {
    icon: Send,
    title: 'Multi-Channel Outreach',
    description:
      'Launch personalized email, SMS, ringless voicemail, direct mail, and call-task campaigns from editable templates with merge variables.',
  },
  {
    icon: LayoutDashboard,
    title: 'Live Dashboard & CRM',
    description:
      'Track new leads, outreach sent, replies, appointments, and cost per lead in real time, with full search, filters, and follow-up scheduling.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Select Counties & Lead Types',
    description: 'Choose the states, counties, and distress categories you want to target.',
  },
  {
    number: '2',
    title: 'Pick Outreach Channels',
    description: 'Select email, SMS, voicemail, direct mail, or call tasks — and customize templates.',
  },
  {
    number: '3',
    title: 'Press Launch',
    description: 'The pipeline collects, classifies, enriches, scores, and contacts leads automatically.',
  },
];

const testimonials = [
  {
    quote:
      'Hydrascout replaced four separate tools for us. One Launch click and the pipeline collects, scores, and texts our whole county list.',
    authorName: 'Michael Rodriguez',
    authorTitle: 'Real Estate Investor, 50+ deals',
  },
  {
    quote:
      'The motivation scoring alone changed how we prioritize calls. We stopped wasting time on low-equity, low-urgency leads.',
    authorName: 'Sarah Chen',
    authorTitle: 'Wholesale Real Estate, Houston TX',
  },
  {
    quote:
      'Skip tracing with a confidence score and audit log gives our acquisitions team the compliance paper trail we needed.',
    authorName: 'James Thompson',
    authorTitle: 'House Flipping, Dallas TX',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a56db]/5 via-transparent to-[#f97316]/5" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIHN0cm9rZT0iIzFhNTZkYiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-40" />

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1a56db]/10 text-[#1a56db] text-sm font-medium px-4 py-1.5 mb-6">
            <Rocket className="w-4 h-4" />
            One button. Full pipeline.
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Find & Contact Motivated Sellers{' '}
            <span className="text-[#1a56db]">Automatically</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Hydrascout collects distressed-property data from government and public sources,
            enriches owner contact info, scores every lead, and launches outreach — all from a
            single Launch button.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="h-12 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8"
              asChild
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8" asChild>
              <Link href="/demo">See How It Works</Link>
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1a56db]">21</p>
              <p className="text-sm text-gray-600">Public data sources</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1a56db]">17</p>
              <p className="text-sm text-gray-600">Distress categories</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1a56db]">5</p>
              <p className="text-sm text-gray-600">Outreach channels</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Every Step of the Workflow, Automated
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From raw county records to a dispatched, tracked outreach campaign — without
              spreadsheets or manual data entry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Launch → Select Counties → Select Lead Types → Select Outreach Channels → Review → Start.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-[#1a56db]/20" />
                )}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1a56db] text-white text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-[#1a56db] hover:bg-[#1e40af] text-white px-8" asChild>
              <Link href="/automation/launch">
                Try the Launch Wizard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Real Estate Investors
            </h2>
            <p className="text-lg text-gray-600">
              See what our customers are saying about Hydrascout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.authorName}
                quote={testimonial.quote}
                authorName={testimonial.authorName}
                authorTitle={testimonial.authorTitle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1a56db] to-[#1e40af]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Finding Deals Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Free to start. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8"
              asChild
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#1a56db] px-8"
              asChild
            >
              <Link href="/demo">Watch Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
