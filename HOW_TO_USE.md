# HYDRASCOUT — How To Use

A step-by-step operating guide for the app itself (not a developer setup doc —
see [`README.md`](README.md) for installation/deployment, and
[`.env.example`](.env.example) for every integration key).

HYDRASCOUT works immediately with **zero configuration** in demo mode
(simulated data, simulated sends, nothing real leaves the app). Everything
below works the same way whether you're in demo mode or fully connected to
real providers — connected providers just mean the actions are real instead
of simulated.

---

## 1. Getting started

1. Open the app (locally at `http://localhost:3050`, or your deployed URL).
2. If authentication is enabled, log in at `/login` or create an account at
   `/signup`. In demo mode you can also just click through — a demo session
   is used automatically.
3. You'll land on the **Dashboard** (`/dashboard`) — your home base. The left
   sidebar is how you get everywhere else:

   | Sidebar item | What it's for |
   |---|---|
   | Dashboard | Live metrics overview |
   | **Launch Automation** | The one-button pipeline — start here |
   | Lead CRM | Browse, filter, and work every lead |
   | Property Search | Map + list search across all properties |
   | Skip Trace | One-off or bulk owner contact lookups |
   | Lead Lists | Organize leads into named lists for campaigns/export |
   | Campaigns | Outreach campaigns and their performance |
   | Analytics | Deeper funnel/ROI charts |
   | Saved Searches | Save a filter set and get alerted on new matches |
   | Billing | Plan, usage, and payment history |

4. Check `/integrations` any time to see exactly which providers are live
   ("Connected") vs. running in simulation ("Not configured") for *this*
   deployment.

---

## 2. Run the one-button automation (core workflow)

This is the main event: go to **Launch Automation** in the sidebar
(`/automation/launch`). It's a 4-step wizard.

### Step 1 — Select Counties
- Pick a **State** from the dropdown.
- Tick the **counties** you want to pull leads from (or click the toggle to
  select/deselect all counties in that state at once).
- You must select at least one county to continue.

### Step 2 — Select Lead Types
- Tick every distress category you want to target — e.g. **Foreclosure**,
  **Pre-Foreclosure**, **Tax Lien**, **Probate**, **Vacant**, **Absentee
  Owner**, **High Equity**, and more. A property can match more than one
  category.
- Pick at least one to continue.

### Step 3 — Select Outreach Channels
- Tick the channels you want HYDRASCOUT to use automatically: **Email**,
  **SMS**, **Ringless Voicemail**, **Direct Mail**, and/or **Manual Call
  Task** (creates a task for you to call personally instead of sending
  anything automatically).
- Optionally paste a custom message template using variables like
  `{{owner_first_name}}`, `{{property_address}}`, `{{estimated_equity}}`,
  `{{foreclosure_date}}`, `{{company_name}}`, `{{company_phone}}` — leave
  blank to use the built-in default templates.
- Pick at least one channel to continue.

### Step 4 — Review
- Optionally name the campaign (e.g. "TX Q4 Distressed Blast").
- Set the **minimum motivation score** (0–100) a lead needs before HYDRASCOUT
  will actually contact them. Leads scoring below this are still collected
  and saved into the CRM — they're just skipped for outreach.
- Double-check the summary (counties, lead types, channels), then click
  **START AUTOMATION**.

### What happens after you click Start
You're taken to a **live run monitor** (`/automation/runs/[id]`) that streams
progress through all 10 pipeline stages in real time:

1. **Collect** — pulls records from the configured data sources (or
   simulated demo records if no real source is wired up).
2. **Categorize** — classifies each property into one or more of the 17
   distress categories.
3. **Clean & normalize** — standardizes addresses, names, phone/ZIP formats.
4. **Deduplicate** — merges repeat records so the same property/owner isn't
   imported twice, even across separate runs.
5. **Enrich** — looks up owner contact info (phone/email) via the configured
   skip-trace provider, with a confidence score per match.
6. **Score** — assigns each lead a 0–100 motivation score.
7. **Build lists** — groups leads that pass your minimum-score threshold into
   the campaign.
8. **Send outreach** — dispatches the message on every selected channel.
9. **Log & track delivery** — every send is recorded with provider, status
   (sent/delivered/failed), and whether it was simulated.
10. **Schedule follow-ups** — queues a follow-up touch a few days out, timed
    to each lead's urgency (sooner for auction dates / high scores).

You'll see a scrolling log console, a stage-by-stage progress bar, and final
stats: records collected, duplicates merged, owners enriched vs. rejected,
messages sent per channel, and total cost. If a stage fails, it's retried
automatically; persistent failures are shown clearly in the log instead of
silently stalling.

---

## 3. Work your leads — Lead CRM (`/leads`)

- Leads load **sorted by motivation score**, highest first, so you always
  work your hottest leads first.
- Use the **search bar and filters** across county, city, ZIP, category,
  status, owner type (absentee/owner-occupant/investor), and minimum score.
- Click **Export CSV** to download the currently filtered list.
- Click any row to open the **lead detail drawer**:
  - AI-written summary of why this lead is likely motivated
  - Equity %, estimated equity, delinquent taxes, auction date
  - Enriched phone numbers/emails, each with its own confidence score
  - Full **communication history** — every message sent, which channel,
    delivery status, and whether it was simulated
  - Scheduled **follow-ups** and an editable **notes** field
  - A **status** dropdown you update as you work the lead: `new → contacted
    → replied → interested → appointment → converted` (or `dead` if it's a
    bust).
- New automation runs **never re-import** a lead you already have — the
  pipeline's dedupe step checks against your existing CRM.

## 4. Property Search (`/search`)

- A combined **map + list view** of every property in the database (your
  real Supabase data if connected, otherwise built-in demo data).
- Filter and click into any property for its full detail page.
- Use **Add to List** to save interesting properties into a Lead List for
  later campaign targeting.

## 5. Skip Trace (`/skip-trace`)

Use this for **one-off lookups** outside of a full automation run:
- **Search by Address** — enter a single address to pull owner name/contact
  info on demand.
- **Upload Properties** — bulk upload a list (CSV) to skip-trace many
  addresses at once.
- **Recent Skip Traces** — a log of your past lookups with results and
  confidence scores.

## 6. Lead Lists (`/lists`)

- Group leads/properties into named lists (e.g. "Hot — Harris County Q4").
- Add/remove items, tag and annotate them, and export a list to CSV.
- Lists are the targeting unit for manually built campaigns (see below).

## 7. Campaigns (`/campaigns`)

- Every automation **Launch** automatically creates a campaign here, with
  sent/reply/cost stats and a link back to its run log.
- Click **Create Campaign** (`/campaigns/new`) to manually build one instead:
  pick a Lead List, choose a channel, pick or edit a message template, review
  the estimated cost, and send.

## 8. Analytics (`/analytics`)

Deeper charts beyond the dashboard: conversion funnel over time, cost per
lead, performance by channel, performance by county/category, and reply/
appointment rates — useful for deciding which counties or lead types are
actually worth your spend.

## 9. Saved Searches (`/alerts`)

- Save any filter combination (county, category, score threshold, etc.) as a
  named saved search.
- Active saved searches surface new matching leads automatically as future
  automation runs bring them in — check here instead of re-building the same
  filter every time.

## 10. Billing (`/billing`)

- **Usage & Plan** tab — your current plan and usage against its limits
  (lookups, skip traces, mail pieces).
- **Available Plans** tab — compare Free/Basic/Pro/Team and click **Upgrade**
  or **Downgrade**. If the plan has a real Stripe Price configured, you're
  taken to a real Stripe Checkout page; otherwise the upgrade is simulated
  locally so you can still try every feature.
- **Billing History** tab — past invoices/transactions.
- The **Change Plan** button on the summary banner jumps straight to the
  Available Plans tab.

## 11. Integrations status (`/integrations`)

A live read-out of every provider this deployment recognizes — database,
email, SMS/voice, data enrichment, AI, CRM/automation webhooks, and
payments — each marked **Connected** or **Not configured** based on whether
its environment variable(s) are set. Use this page as your first stop when
something feels "simulated" and you expected it to be real.

---

## Tips & troubleshooting

- **Everything is simulated and I expected it to be live** → check
  `/integrations`. A provider shows "Not configured" until its env var(s)
  are set in `.env.local` and the app has been restarted.
- **A lead didn't get contacted during a run** → its motivation score was
  likely below the minimum threshold you set in Step 4 of the wizard. It's
  still saved in the CRM — raise the threshold next run, or contact it
  manually.
- **SMS/voicemail compliance** — only enable these channels once you have a
  lawful basis (consent, existing relationship, etc.) for the jurisdictions
  you're targeting. Without Twilio configured, these channels simulate
  sends only.
- **A run seems stuck** → open its run page for the live log; transient
  failures auto-retry. Persistent failures are reported in the log with the
  stage and reason.
- **Re-running the same counties** → safe to do any time; the dedupe stage
  prevents duplicate leads from piling up in your CRM.
