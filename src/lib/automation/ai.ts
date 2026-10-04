/**
 * Step 12 — AI Features.
 *
 * Uses OpenAI (OPENAI_API_KEY) or Anthropic (ANTHROPIC_API_KEY) when
 * configured; otherwise falls back to deterministic heuristics/templates so
 * the pipeline never blocks on missing credentials.
 *
 * Capabilities: property summary, motivation estimate, channel
 * recommendation, personalized message drafting, follow-up timing,
 * investor detection.
 */

import { Lead, OutreachChannel, LEAD_CATEGORY_LABELS } from './types';
import { scoreLabel } from './score';

const money = (n: number | null) => (n === null ? 'unknown' : `$${Math.round(n).toLocaleString()}`);

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

async function callLLM(prompt: string): Promise<string | null> {
  try {
    if (process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() ?? null;
    }
    if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.content?.[0]?.text?.trim() ?? null;
    }
  } catch {
    // fall through to heuristic
  }
  return null;
}

/** Summarize a property + estimate seller motivation. */
export async function summarizeLead(lead: Lead, useLLM: boolean): Promise<string> {
  if (useLLM && aiConfigured()) {
    const llm = await callLLM(
      `Summarize this distressed-property lead for a real-estate investor in 2 sentences. ` +
        `Include why the seller may be motivated.\n${JSON.stringify({
          address: lead.propertyAddress,
          categories: lead.categories,
          equityPercent: lead.equityPercent,
          delinquentTaxes: lead.delinquentTaxes,
          auctionDate: lead.auctionDate,
          yearsOwned: lead.yearsOwned,
          ownerType: lead.ownerType,
          score: lead.motivationScore,
        })}`,
    );
    if (llm) return llm;
  }

  const cats = lead.categories.map((c) => LEAD_CATEGORY_LABELS[c]).join(', ');
  const bits: string[] = [
    `${lead.propertyType} in ${lead.city || lead.county}, ${lead.state} flagged for: ${cats}.`,
  ];
  if (lead.equityPercent !== null) bits.push(`Est. equity ${lead.equityPercent}% (${money(lead.equityEstimate)}).`);
  if (lead.delinquentTaxes) bits.push(`${money(lead.delinquentTaxes)} in delinquent taxes.`);
  if (lead.auctionDate) bits.push(`Auction scheduled ${lead.auctionDate} — time-sensitive.`);
  if (lead.ownerType === 'absentee') bits.push('Owner lives elsewhere (absentee).');
  if (lead.isInvestor) bits.push('Owner appears to be an entity/investor.');
  bits.push(`Motivation: ${lead.motivationScore}/100 (${scoreLabel(lead.motivationScore)}).`);
  return bits.join(' ');
}

/** Recommend the best outreach channel among the user-selected ones. */
export function recommendChannel(lead: Lead, allowed: OutreachChannel[]): OutreachChannel {
  const hasMobile = lead.phones.some((p) => p.type === 'mobile');
  const hasPhone = lead.phones.length > 0;
  const hasEmail = lead.emails.length > 0;
  const urgent = Boolean(lead.auctionDate) || lead.motivationScore >= 80;

  const preference: OutreachChannel[] = urgent
    ? ['call_task', 'sms', 'voicemail', 'email', 'direct_mail']
    : ['sms', 'email', 'voicemail', 'direct_mail', 'call_task'];

  for (const ch of preference) {
    if (!allowed.includes(ch)) continue;
    if (ch === 'sms' && !hasMobile) continue;
    if (ch === 'voicemail' && !hasPhone) continue;
    if (ch === 'call_task' && !hasPhone) continue;
    if (ch === 'email' && !hasEmail) continue;
    return ch;
  }
  // direct mail always works (mailing address is always present)
  return allowed.includes('direct_mail') ? 'direct_mail' : allowed[0];
}

/** Suggest a follow-up delay in days based on urgency (Step 12). */
export function suggestFollowUpDays(lead: Lead): number {
  if (lead.auctionDate) {
    const days = Math.floor((new Date(lead.auctionDate).getTime() - Date.now()) / 86400000);
    if (days <= 21) return 2;
  }
  if (lead.motivationScore >= 80) return 3;
  if (lead.motivationScore >= 60) return 5;
  return 10;
}

/** Draft a personalized message (LLM if available, template otherwise). */
export async function draftMessage(lead: Lead, channel: OutreachChannel, template: string, useLLM: boolean): Promise<string> {
  const rendered = renderTemplate(template, lead);
  if (useLLM && aiConfigured() && channel !== 'direct_mail') {
    const llm = await callLLM(
      `Rewrite this ${channel} outreach to a potentially motivated property seller so it sounds natural, warm and compliant. ` +
        `Keep it under ${channel === 'sms' ? '300' : '700'} characters, no false claims, include an easy opt-out for SMS.\n\n${rendered}`,
    );
    if (llm) return llm;
  }
  return rendered;
}

/** Step 7 — personalization variables */
export function renderTemplate(template: string, lead: Lead): string {
  const firstName = (lead.ownerName || 'Neighbor').split(' ')[0];
  const vars: Record<string, string> = {
    owner_name: lead.ownerName || 'Property Owner',
    owner_first_name: firstName,
    property_address: lead.propertyAddress,
    city: lead.city,
    county: lead.county,
    state: lead.state,
    zip: lead.zip,
    estimated_equity: lead.equityEstimate !== null ? `$${Math.round(lead.equityEstimate).toLocaleString()}` : 'a significant amount of equity',
    foreclosure_date: lead.auctionDate || 'the upcoming sale date',
    motivation_score: String(lead.motivationScore),
    company_name: process.env.COMPANY_NAME || process.env.NEXT_PUBLIC_COMPANY_NAME || 'Hydrascout Home Solutions',
    company_phone: process.env.COMPANY_PHONE || process.env.NEXT_PUBLIC_COMPANY_PHONE || '(800) 555-0100',
    company_website: process.env.COMPANY_WEBSITE || process.env.NEXT_PUBLIC_APP_URL || 'https://hydrascout.com',
  };
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key) => vars[key.toLowerCase()] ?? '');
}
