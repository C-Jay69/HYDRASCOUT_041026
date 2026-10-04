-- HYDRASCOUT Database Schema
-- Target: Supabase (PostgreSQL)

-- Enable required extensions for geospatial queries
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- 1. PROPERTIES TABLE
-- Core property data
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    parcel_id TEXT,
    apn TEXT,
    property_type TEXT, -- SFR, Multi-family, Condo, Townhouse, Commercial, Land
    property_use TEXT,
    owner_name TEXT,
    owner_address TEXT,
    owner_type TEXT, -- Absentee, Owner-occupied, Corporate
    mailing_address TEXT,
    estimated_value DECIMAL(12, 2),
    equity DECIMAL(12, 2),
    equity_percent DECIMAL(5, 2),
    loan_balance DECIMAL(12, 2),
    loan_type TEXT,
    lender_name TEXT,
    origination_date DATE,
    assessed_value DECIMAL(12, 2),
    annual_taxes DECIMAL(12, 2),
    tax_delinquency BOOLEAN DEFAULT FALSE,
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    sqft INTEGER,
    lot_size DECIMAL(10, 2),
    year_built INTEGER,
    garage BOOLEAN,
    pool BOOLEAN,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    flood_zone TEXT,
    school_district TEXT,
    listing_status TEXT, -- Active, Off-market, Pre-foreclosure, Foreclosure, Auction, REO
    listing_date DATE,
    days_on_market INTEGER,
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for search performance
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_properties_coords ON properties USING gist (ll_to_earth(latitude, longitude));

-- 2. LEAD LISTS
CREATE TABLE IF NOT EXISTS lead_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filters JSONB DEFAULT '{}'::jsonb,
    record_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LIST PROPERTIES (Many-to-Many)
CREATE TABLE IF NOT EXISTS list_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES lead_lists(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'new', -- new, contacted, interested, skip, converted
    tags TEXT[],
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(list_id, property_id)
);

-- 4. SKIP TRACE RESULTS
CREATE TABLE IF NOT EXISTS skip_trace_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    phones JSONB DEFAULT '[]'::jsonb,
    emails JSONB DEFAULT '[]'::jsonb,
    confidence_score DECIMAL(3, 2),
    source TEXT,
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT, -- mail, email
    template_id TEXT,
    audience_list_id UUID REFERENCES lead_lists(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft', -- draft, scheduled, sending, completed
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "opens": 0, "clicks": 0, "cost": 0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SAVED SEARCHES
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL,
    location JSONB,
    alert_frequency TEXT DEFAULT 'none', -- none, instant, daily, weekly
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free', -- free, basic, pro, team
    status TEXT DEFAULT 'active', -- active, cancelled, past_due
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    credits_remaining INTEGER DEFAULT 0,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- lookup, skip_trace, mail, topup
    amount DECIMAL(10, 2),
    credits INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. MARKET STATS
CREATE TABLE IF NOT EXISTS market_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_type TEXT, -- city, zip, county
    location_value TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(12, 2),
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_modtime BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_lead_lists_modtime BEFORE UPDATE ON lead_lists FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_campaigns_modtime BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_saved_searches_modtime BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ============================================================
-- AUTOMATION PIPELINE TABLES (Automated Distressed Property
-- Lead Generation & Outreach System)
-- ============================================================

-- 10. LEADS (Step 6 CRM — populated by automation runs)
-- The full lead object lives in `data` (JSONB); key fields are
-- mirrored as columns for indexing/filtering.
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    dedupe_key TEXT UNIQUE NOT NULL,      -- APN or normalized address+ZIP (prevents duplicate imports)
    run_id TEXT,
    state TEXT,
    county TEXT,
    city TEXT,
    zip VARCHAR(10),
    status TEXT DEFAULT 'new',            -- new, contacted, replied, interested, appointment, converted, dead
    categories TEXT[] DEFAULT '{}',       -- Step 2 distress categories
    motivation_score INTEGER DEFAULT 0,   -- Step 5 (0-100)
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(motivation_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_state_county ON leads(state, county);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_categories ON leads USING gin (categories);

-- 11. AUTOMATION RUNS (Step 8 — one row per Launch)
CREATE TABLE IF NOT EXISTS automation_runs (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'queued',         -- queued, running, completed, failed
    data JSONB NOT NULL,                  -- config, stage progress, logs, stats
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ
);

-- 12. COMMUNICATIONS (Step 8.8/8.9 — every outreach action + delivery status)
CREATE TABLE IF NOT EXISTS communications (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    run_id TEXT,
    campaign_id TEXT,
    channel TEXT NOT NULL,                -- email, sms, voicemail, direct_mail, call_task
    provider TEXT,
    simulated BOOLEAN DEFAULT TRUE,
    status TEXT,                          -- queued, sent, delivered, failed, replied, task_created
    subject TEXT,
    message TEXT,
    cost DECIMAL(8, 4) DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comms_lead ON communications(lead_id);

-- 13. FOLLOW UPS (Step 8.10)
CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    run_id TEXT,
    due_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    channel TEXT DEFAULT 'call_task',
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(due_at) WHERE NOT done;

-- 14. ENRICHMENT AUDITS (Step 4 — audit log of every skip-trace attempt)
CREATE TABLE IF NOT EXISTS enrichment_audits (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    run_id TEXT,
    provider TEXT,
    matched BOOLEAN,
    confidence DECIMAL(5, 2),
    rejected_reason TEXT,
    fields_enriched TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audits_run ON enrichment_audits(run_id);

-- 15. OUTREACH CAMPAIGNS (Step 7 — campaign lists built by the pipeline)
CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
