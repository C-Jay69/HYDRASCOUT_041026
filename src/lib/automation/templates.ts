/**
 * Step 7 — default outreach templates with personalization variables.
 * Users can edit these in the Launch wizard before starting the automation.
 */

import { OutreachChannel } from './types';

export const DEFAULT_TEMPLATES: Record<OutreachChannel, string> = {
  email: `Subject: Question about {{property_address}}

Hi {{owner_first_name}},

My name is Alex with Hydrascout Home Solutions. I work with homeowners in {{county}} County and noticed public records connected to your property at {{property_address}}.

If you've ever considered selling — even as-is, with no repairs, agents, or fees — I'd love to make you a fair, no-obligation cash offer. Based on our research, you may have {{estimated_equity}} in equity that you could unlock quickly.

Would a quick 10-minute call this week work for you?

Best regards,
Alex
Hydrascout Home Solutions
Reply STOP to be removed from our list.`,

  sms: `Hi {{owner_first_name}}, this is Alex w/ Hydrascout Home Solutions. Quick question about your property at {{property_address}} — would you consider a fair cash offer, as-is, no fees? Reply YES for details or STOP to opt out.`,

  voicemail: `Hi {{owner_first_name}}, this is Alex with Hydrascout Home Solutions. I'm reaching out about your property at {{property_address}} in {{city}}. We buy homes in {{county}} County in any condition, and I'd love to make you a no-obligation cash offer. Give me a call back when convenient. Thanks!`,

  direct_mail: `Dear {{owner_name}},

We are local home buyers interested in purchasing your property at {{property_address}}, {{city}}, {{state}} {{zip}}.

We buy houses in ANY condition — no repairs, no cleaning, no agent commissions, and we can close on your timeline. Public records suggest you may have {{estimated_equity}} in equity available.

If you would like a free, no-obligation cash offer, call us at {{company_phone}} or visit {{company_website}}.

Sincerely,
The Hydrascout Buying Team`,

  call_task: `Call {{owner_name}} about {{property_address}} ({{county}} County). Motivation score: {{motivation_score}}/100. Goal: introduce cash offer, gauge timeline, book appointment.`,
};
