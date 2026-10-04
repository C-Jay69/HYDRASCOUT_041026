# 🏠 HYDRASCOUT — Automated Distressed Property Lead Generation & Outreach System

HYDRASCOUT turns the entire distressed-property workflow into **one button**. Press **Launch** and the platform automatically:

1. **Collects** property records from 21 registered government/public data-source connectors (tax assessor, recorder, sheriff sales, probate, bankruptcy, code enforcement, NOD/NTS, lis pendens, HUD, and more)
2. **Classifies** every property across 17 distress categories (foreclosure, tax lien, probate, vacant, absentee, high equity, …)
3. **Cleans & de-duplicates** the data (normalized addresses/names/ZIPs, APN-based merging, cross-run duplicate-import prevention)
4. **Enriches** owner contact info via a pluggable skip-trace provider (confidence scoring, low-confidence rejection, full audit log)
5. **Scores** every lead 0–100 for seller motivation
6. **Builds campaign lists** filtered by minimum score
7. **Sends outreach** through your selected channels — Email (SendGrid), SMS (Twilio), ringless voicemail, direct mail, or manual call tasks — with AI-personalized messages
8. **Logs every action**, tracks delivery status, and **schedules follow-ups** timed to each lead's urgency

Works **out of the box with zero configuration** (demo mode: in-memory data + simulated outreach) and upgrades to persistent, live infrastructure as you add API keys.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Database | Supabase (PostgreSQL) — optional; in-memory demo store without it |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Outreach | SendGrid (email), Twilio (SMS), provider stubs for RVM/direct mail |
| AI | OpenAI or Anthropic (optional; heuristic fallbacks built in) |
| External workflows | n8n / Make.com webhook hook for real county scrapers |

---

## 🛠 Deployment Instructions

### Option A — Local / self-hosted (fastest)

```bash
# 1. Clone & install (Node.js 18+; use --legacy-peer-deps for npm)
git clone https://github.com/C-Jay69/HYDRASCOUT_041026.git
cd HYDRASCOUT_041026
npm install --legacy-peer-deps     # or: pnpm install / bun install

# 2. (Optional) configure environment
cp .env.example .env.local         # fill in whatever keys you have — all optional

# 3. Run
npm run dev                        # development → http://localhost:3050
# — or production —
npm run build
PORT=3050 npx next start -p 3050
```

> **No `.env.local` at all?** The app runs in full **demo mode**: an in-memory
> database, deterministic simulated county data, and simulated outreach.
> Perfect for evaluating the entire workflow safely. Demo data resets when
> the server restarts.

### Option B — Vercel + Supabase (production)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier works).
2. In the Supabase **SQL Editor**, paste and run the entire contents of [`database/schema.sql`](database/schema.sql). This creates all 15 tables (properties, leads, automation_runs, communications, follow_ups, enrichment_audits, outreach_campaigns, …).
3. **Import the repo into Vercel** (or any Node host) and set the environment variables below.
4. Deploy. The `Launch` pipeline runs inside the API route using Next.js `after()`, so it completes even after the HTTP response returns.

### Environment variables

All variables are **optional** — each unlocks a capability:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (persistent database) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side pipeline writes) |
| `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` | Real email sending (otherwise simulated) |
| `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` + `MAILGUN_FROM_EMAIL` | Automatic email fallback when SendGrid isn't configured |
| `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` | Real SMS sending (otherwise simulated) |
| `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) | LLM-written lead summaries & outreach copy (otherwise heuristic templates) |
| `N8N_WEBHOOK_URL` | Calls your n8n/Make.com workflow during the Collect stage and ingests any `{ records: [...] }` it returns — this is how you plug in **real county scrapers** |
| `ZAPIER_WEBHOOK_URL` / `MAKE_WEBHOOK_URL` / `N8N_CRM_WEBHOOK_URL` / `CRM_WEBHOOK_URL` | After every completed campaign, POSTs the lead list + stats to any of these — bridge to Airtable, Google Sheets, Notion, HubSpot, GoHighLevel or Salesforce from the receiving automation. See `/integrations` in the app. |
| `COMPANY_NAME` / `COMPANY_PHONE` / `COMPANY_WEBSITE` | Used inside outreach templates (`{{company_name}}`, `{{company_phone}}`, `{{company_website}}`) |
| `NEXT_PUBLIC_COMPANY_NAME` / `NEXT_PUBLIC_COMPANY_EMAIL` / `NEXT_PUBLIC_COMPANY_PHONE` | Shown on the public Contact page |
| `NEXT_PUBLIC_APP_URL` | Public URL of this deployment (Stripe redirect URLs, template links) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Real billing on `/billing` (otherwise demo mode — upgrades are simulated locally) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map view on the Search page |
| `HYDRASCOUT_FORCE_DEMO=true` | Force in-memory demo mode even with Supabase configured |

### Seed demo properties into Supabase (optional)

```bash
npx tsx scripts/seed.ts        # requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
```

---

## 📖 User Guide

### 1. The one-button workflow (start here)

Open **Launch Automation** in the sidebar (`/automation/launch`) and follow the wizard:

1. **Select Counties** — choose a state, then tick the counties to target.
2. **Select Lead Types** — pick the distress indicators you want (foreclosure, pre-foreclosure, tax lien, probate, vacant, absentee, high equity, …).
3. **Select Outreach Channels** — email, SMS, ringless voicemail, direct mail, and/or manual call tasks. You can paste a custom SMS template with variables like `{{owner_first_name}}`, `{{property_address}}`, `{{estimated_equity}}`.
4. **Review** — set an optional campaign name and the **minimum motivation score** for outreach (leads below it are still stored in the CRM, just not contacted), then press **START AUTOMATION**.

You're redirected to a **live run monitor** showing each pipeline stage, a streaming log console, and final stats (records collected, duplicates merged, owners enriched/rejected, messages sent, follow-ups scheduled, cost).

### 2. Working leads in the CRM (`/leads`)

- Leads arrive **sorted by motivation score** (highest priority first).
- **Filter** by search text, county, category, status, and minimum score; **export to CSV** anytime.
- Click any row to open the **lead drawer**: AI summary, equity, auction date, enriched phones/emails with per-item confidence, source list, full **communication history** (with delivery status and `simulated` flags), scheduled **follow-ups**, and editable **notes**.
- Update the **status** inline as you work leads: `new → contacted → replied → interested → appointment → converted` (or `dead`).

### 3. Dashboard (`/dashboard`)

Live funnel metrics: new leads today, total distressed properties, per-category counts (foreclosures, tax liens, probates, vacant), outreach sent, replies, interested sellers, appointments, conversion rate, cost per lead, and your recent automation runs.

### 4. Campaigns (`/campaigns`)

Every Launch creates an **automation campaign** with sent/replies/cost stats and a link back to its run. You can still build manual mail/email campaigns with the campaign builder.

### 5. Property search & lists (`/search`, `/lists`)

Browse the property database (Supabase data, or built-in demo data), open property detail pages, organize leads into lists, and export.

### 6. Plugging in real data sources

Demo connectors synthesize realistic county records so you can exercise the full pipeline. To go live:

- **Easiest:** point `N8N_WEBHOOK_URL` at an n8n/Make.com workflow that scrapes your counties (Playwright, HTTP, OCR, etc.) and responds with `{ "records": [ ... ] }` matching the `RawRecord` shape in [`src/lib/automation/types.ts`](src/lib/automation/types.ts).
- **Direct:** implement `collect()` on any connector in [`src/lib/automation/sources.ts`](src/lib/automation/sources.ts) — the registry pattern makes adding new counties/sources a one-file change.
- **Skip tracing:** implement `EnrichmentProvider` in [`src/lib/automation/enrich.ts`](src/lib/automation/enrich.ts) for your provider (BatchData, IDI, TLOxp, …). Confidence thresholds and audit logging are already handled.

### ⚖️ Compliance notes

- **SMS & ringless voicemail** require prior express consent or another lawful basis in most jurisdictions (TCPA in the US). Without Twilio credentials, HYDRASCOUT simulates SMS — nothing is delivered. Built-in templates include opt-out language; keep it.
- Respect **DNC lists**, provider terms of service, and state-specific rules for contacting distressed homeowners (some states restrict solicitation of owners in foreclosure).
- Enrichment must use **legally obtained data**. Every enrichment attempt is audit-logged (`enrichment_audits`) with provider, confidence, and rejection reasons.

---

## 🔌 API Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/automation/launch` | POST | Validate config & start a pipeline run (returns `runId`) |
| `/api/automation/runs` | GET | List runs |
| `/api/automation/runs/[id]` | GET | Run status, stage progress, logs, stats |
| `/api/automation/sources` | GET | Registered data-source connectors |
| `/api/leads` | GET | Searchable CRM with filters (`search`, `state`, `county`, `city`, `zip`, `category`, `status`, `ownerType`, `minScore`, `limit`) |
| `/api/leads/[id]` | GET / PATCH | Lead detail (+ communications & follow-ups) / update status, notes, tags, follow-up |
| `/api/campaigns` | GET | Automation campaigns with stats |
| `/api/dashboard/stats` | GET | Dashboard metrics |
| `/api/health` | GET | Health check |

Launch payload example:

```json
{
  "state": "Texas",
  "counties": ["Harris", "Dallas"],
  "leadTypes": ["foreclosure", "tax_lien", "probate", "vacant"],
  "channels": ["email", "sms", "direct_mail"],
  "minScore": 40,
  "campaignName": "TX Q3 Distressed Blast",
  "templates": { "sms": "Hi {{owner_first_name}} — quick question about {{property_address}}…" }
}
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── automation/launch/        # Launch wizard (Counties → Lead Types → Channels → Review)
│   │   ├── automation/runs/[id]/     # Live run monitor (stages, logs, stats)
│   │   ├── leads/                    # CRM (search, filters, statuses, notes, history, CSV export)
│   │   ├── dashboard/                # Live metrics dashboard
│   │   └── ...                       # search, lists, campaigns, analytics, billing
│   └── api/
│       ├── automation/               # launch, runs, sources
│       ├── leads/                    # CRM API
│       ├── campaigns/  dashboard/    # campaigns & stats APIs
├── lib/automation/                   # ← THE PIPELINE
│   ├── types.ts                      # Lead, run, campaign & category models
│   ├── sources.ts                    # 21 data-source connectors + n8n webhook ingestion
│   ├── clean.ts                      # Classification, normalization, de-duplication
│   ├── enrich.ts                     # Skip tracing (pluggable providers + audit log)
│   ├── score.ts                      # 0-100 motivation scoring
│   ├── ai.ts                         # Summaries, channel recommendation, message drafting (LLM or heuristic)
│   ├── templates.ts                  # Default outreach templates with variables
│   ├── outreach.ts                   # SendGrid / Twilio / simulated channel adapters
│   ├── store.ts                      # Supabase or in-memory persistence
│   └── pipeline.ts                   # Orchestrator (retries, logging, progress)
└── database/schema.sql               # Full PostgreSQL schema (15 tables)
```

See [`AUDIT.md`](AUDIT.md) for the repository audit that preceded this build and the requirement-by-requirement compliance matrix.
