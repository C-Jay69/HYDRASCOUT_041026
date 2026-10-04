'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FAQAccordion } from '@/components/public/FAQAccordion';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Try the full pipeline on one county',
    features: [
      { label: '1 county, up to 100 leads/mo', included: true },
      { label: 'All 17 lead categories', included: true },
      { label: 'Motivation scoring & dashboard', included: true },
      { label: 'Skip tracing / enrichment', included: false },
      { label: 'Outreach campaigns', included: false },
      { label: 'CRM webhook sync', included: false },
    ],
    cta: 'Get Started',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Basic',
    price: 49,
    description: 'For solo investors running one market',
    features: [
      { label: '3 counties, up to 1,000 leads/mo', included: true },
      { label: 'All 17 lead categories', included: true },
      { label: 'Motivation scoring & dashboard', included: true },
      { label: '100 skip traces/mo', included: true },
      { label: 'Email + SMS outreach', included: true },
      { label: 'CRM webhook sync', included: false },
    ],
    cta: 'Get Started',
    href: '/signup?plan=basic',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 99,
    description: 'For active investors & small teams',
    features: [
      { label: '10 counties, up to 5,000 leads/mo', included: true },
      { label: 'All 17 lead categories', included: true },
      { label: 'Motivation scoring & dashboard', included: true },
      { label: '500 skip traces/mo', included: true },
      { label: 'Email, SMS, voicemail & direct mail', included: true },
      { label: 'CRM webhook sync (Zapier/Make/n8n)', included: true },
    ],
    cta: 'Get Started',
    href: '/signup?plan=pro',
    highlighted: true,
  },
  {
    name: 'Team',
    price: 249,
    description: 'For teams and power users',
    features: [
      { label: 'Unlimited counties & leads', included: true },
      { label: 'All 17 lead categories', included: true },
      { label: 'Motivation scoring & dashboard', included: true },
      { label: 'Unlimited skip traces', included: true },
      { label: 'Every outreach channel', included: true },
      { label: 'CRM webhook sync + priority support', included: true },
    ],
    cta: 'Get Started',
    href: '/signup?plan=team',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, you can cancel your subscription at any time. You will continue to have access until the end of your billing period.',
  },
  {
    question: 'What counts as a lead?',
    answer:
      'A lead is a unique property record that has passed through classification and deduplication and landed in your CRM — not a raw record pulled from a source.',
  },
  {
    question: 'How does skip tracing work?',
    answer:
      'When ownership or contact info is missing, Hydrascout runs it through a configurable enrichment provider, scores the confidence of each match, and rejects anything below the threshold — with a full audit trail.',
  },
  {
    question: 'Do I need my own Twilio/SendGrid/OpenAI accounts?',
    answer:
      'No. Without any provider keys, Hydrascout runs outreach in simulation mode so you can test the full workflow risk-free. Add your own SendGrid, Mailgun, Twilio, OpenAI or Anthropic keys any time to go live — see /integrations.',
  },
  {
    question: 'Is SMS and ringless voicemail compliant?',
    answer:
      'You are responsible for complying with TCPA and applicable state law, including consent requirements, Do-Not-Call lists, and opt-out handling. Built-in SMS templates include opt-out language by default.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the start of your next billing period.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer:
      'Our Free plan gives you the full pipeline on one county indefinitely. You can upgrade to a paid plan at any time when you are ready for more counties and live outreach.',
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="py-20">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Choose the plan that fits your investment strategy. Start free and scale
          as you grow.
        </p>

        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium ${
              !isAnnual ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isAnnual ? 'bg-[#1a56db]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                isAnnual ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              isAnnual ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            Annual
          </span>
          <span className="text-xs font-semibold text-[#f97316] bg-[#f97316]/10 px-2 py-1 rounded-full">
            Save 20%
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-6 ${
              plan.highlighted
                ? 'border-[#1a56db] shadow-lg ring-2 ring-[#1a56db]/20'
                : 'border-gray-200'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#1a56db] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Recommended
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${isAnnual ? Math.round(plan.price * 0.8) : plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-500">/month</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-[#1a56db] flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 flex-shrink-0 text-gray-300">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  <span
                    className={`text-sm ${
                      feature.included ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className={`w-full ${
                plan.highlighted
                  ? 'bg-[#1a56db] hover:bg-[#1e40af] text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <FAQAccordion items={faqs} />
      </div>
    </div>
  );
}
