# Hydrascout — Original Base Platform Spec (historical)

> **Note:** This document describes the original general-purpose real-estate
> search/CRM template this project started from. The platform has since been
> built out into **Hydrascout**, an automated distressed-property lead
> generation & outreach system — see [`README.md`](README.md) for the current
> product and [`AUDIT.md`](AUDIT.md) for the build-prompt compliance matrix.
> Sections below are kept for historical reference to the original UI/data
> model this was layered on top of.

# PropStream Clone - Real Estate Investment Platform (original template spec)

## 1. Concept & Vision

A powerful real estate data and investment platform that enables users to search millions of properties, analyze deals, build targeted lead lists, and execute marketing campaigns. The platform combines professional-grade property data with intuitive map-based search and comprehensive analytics tools. Clean, data-dense interface designed for real estate investors and agents who need quick access to actionable insights.

## 2. Design Language

### Aesthetic Direction
Professional real estate SaaS with a dark navy foundation (#0f172a) for the application shell and map interface, paired with white/light panels for data-heavy views. Two-tone split layout: sidebar filters + full-screen interactive map.

### Color Palette
- **Primary:** #1a56db (Blue - actions, links, selected states)
- **Secondary/Accent:** #f97316 (Orange - highlights, CTAs, alerts)
- **Success/Equity:** #10b981 (Green - positive equity, free & clear)
- **Danger/Foreclosure:** #ef4444 (Red - distressed properties, alerts)
- **Vacant:** #f59e0b (Amber - vacant properties)
- **Background Dark:** #0f172a (Slate 900 - app shell)
- **Background Light:** #f8fafc (Slate 50 - panels)
- **Surface:** #ffffff / #1e293b (White/Dark slate)
- **Text Primary:** #0f172a / #f1f5f9 (Dark/Light mode)
- **Text Secondary:** #64748b (Slate 500)
- **Border:** #e2e8f0 / #334155 (Light/Dark mode)

### Typography
- **Font Family:** Inter (Google Fonts), fallback: system-ui, sans-serif
- **Headings:** Inter 600-700 weight
- **Body:** Inter 400 weight, 14px base for data-dense views
- **Data/Metrics:** Inter 700 bold for property values and key metrics
- **Tabular Numbers:** font-variant-numeric: tabular-nums for data tables

### Spatial System
- Base unit: 4px
- Sidebar width: 380px (collapsible to 64px)
- Card padding: 16px (4 units)
- Section gaps: 24px (6 units)
- Border radius: 8px for cards, 6px for inputs, 4px for small elements

### Motion Philosophy
- Page transitions: 200ms ease-out
- Panel slide-in: 300ms ease-out (right drawer for property details)
- Hover states: 150ms
- Map pin animations: subtle bounce on hover
- Skeleton loaders for data fetching

### Visual Assets
- **Icons:** Lucide React (consistent with existing stack)
- **Map:** Leaflet with React-Leaflet (free, no API key needed)
- **Charts:** Recharts (already in project)
- **Property images:** Placeholder with gradient backgrounds
- **Map markers:** Custom SVG pins with status colors

## 3. Layout & Structure

### App Shell (Authenticated)
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Search Bar | Alerts | Account                    │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│ SIDEBAR  │  MAIN CONTENT AREA                                    │
│ (Filters)│  - Map View (default)                                 │
│          │  - List View (toggle)                                │
│ 380px    │  - Property Detail (right drawer)                     │
│          │                                                       │
├──────────┴──────────────────────────────────────────────────────┤
│ FOOTER: Minimal - Terms | Privacy | Contact                     │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Breadcrumbs | User Menu                          │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│ SIDEBAR  │  DASHBOARD CONTENT                                   │
│ (Nav)    │  - Stats Cards Row                                   │
│          │  - Charts Section                                    │
│ 240px    │  - Recent Activity Table                             │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

### Public Pages
- Landing page with hero, features, pricing, testimonials
- Pricing page with plan comparison
- Features overview page
- Contact/About page
- Standard responsive layout with max-width 1280px

### Responsive Strategy
- Desktop (1280px+): Full split view with sidebar
- Tablet (768-1279px): Collapsible sidebar, full-width map
- Mobile (<768px): Bottom sheet for filters, swipe between list/map

## 4. Features & Interactions

### 4.1 Property Search & Map
**Core Behavior:**
- Full-screen interactive map centered on US
- Search bar accepts: address, city, state, zip, or county
- Map pins color-coded by property status
- Clicking pin opens property summary popup
- "View Details" opens full property page

**Drawing Tools:**
- Rectangle select (click and drag)
- Radius draw (click center, drag for radius)
- Freeform polygon draw

**Map Layers:**
- Street view (default)
- Satellite view toggle
- Property markers toggle
- School districts overlay
- Flood zones overlay

### 4.2 Advanced Filters
**Filter Categories:**
- Property Type: SFR, Multi-family, Condo, Townhouse, Commercial, Land
- Occupancy: Owner-occupied, Absentee owner, Tenant-occupied, Vacant
- Equity: Free & Clear, High equity (50%+), Any equity
- Status: Active, Off-market, Pre-foreclosure, Foreclosure, Auction, REO
- Financial: Estimated value range, Loan balance range, Equity percentage
- Physical: Beds, Baths, Sqft range, Lot size range, Year built range
- Market: Days on market, Last sale date range, Tax delinquency

**Interactions:**
- Filters collapse/expand by category
- Real-time result count updates
- "Apply Filters" button shows updated count
- "Clear All" resets to defaults
- Filter preset saves (future enhancement)

### 4.3 Property Detail Page
**Sections:**
1. **Header:** Address, property type badge, status indicator
2. **Gallery:** Photo carousel (placeholder images for demo)
3. **Key Metrics:** Value, equity, loan balance, beds/baths/sqft
4. **Owner Info:** Owner names, mailing address, phone (if available)
5. **Mortgage Info:** Lender, balance, type, origination date
6. **Tax Info:** Assessed value, annual taxes, delinquency
7. **Property Details:** Lot size, zoning, year built, garage, pool
8. **Location Data:** Flood zone, school district, neighborhood
9. **Comps Tab:** 10-20 comparable sales in sortable table
10. **History Tab:** Transaction timeline, listing history

**Actions:**
- "Add to List" dropdown (existing lists or create new)
- "Run Skip Trace" button
- "Get Comps" button
- "Save Property" heart icon
- "Share" button with copy link
- "Print" button

### 4.4 Lead List Builder
**List Management:**
- Create new list with name
- View all lists with record count, created date
- Edit list name, delete list
- List deduplication tool

**Within List View:**
- Table with sortable columns (address, value, equity, owner type)
- Select individual or bulk records (checkbox)
- Add tags/notes to properties
- Mark status: New, Contacted, Interested, Skip, Converted
- Pagination: 25/50/100 per page

**Export:**
- CSV download with all fields
- Excel download (xlsx format)
- Selected records only or full list

### 4.5 Comps & Deal Analyzer
**Comps Tool:**
- Select subject property
- Auto-pull 10-20 comparable sold properties
- Configurable radius: 0.5, 1, 2, 5 miles
- Configurable time window: 3, 6, 12 months
- Manual include/exclude comps
- View comps on mini-map
- Similarity score per comp

**Deal Analyzer (70% Rule):**
- Input: ARV (After Repair Value)
- Input: Estimated repairs
- Input: Desired profit margin
- Output: Maximum Allowable Offer (MAO)
- Output: Suggested offer with breakdown
- Save analysis to property record

### 4.6 Skip Tracing
**Single Property:**
- Click "Skip Trace" on property detail
- Results: phone numbers (mobile, landline), emails, addresses
- Confidence score and data source shown
- Append to property record

**Batch Skip Trace:**
- Select properties from list or search results
- Upload CSV with property addresses/APNs
- Show credit cost before running
- Queue and process in background
- Results table with export

### 4.7 Marketing Campaigns
**Campaign Types:**
- Direct mail: Postcard, Letter
- Email campaign

**Campaign Builder:**
1. Choose campaign type
2. Select audience (saved list)
3. Choose template or upload design
4. Configure merge fields (name, address, custom message)
5. Preview
6. Schedule or send now

**Campaign Dashboard:**
- List of all campaigns
- Status: Draft, Scheduled, Sending, Completed
- Stats: Sent, Delivered, Opens/Clicks (email), Cost
- Response rate tracking

### 4.8 Market Analytics
**Location Selection:**
- City, Zip, or County
- Dropdown or map click

**Metrics Dashboard:**
- Median price trend (12-month line chart)
- Average days on market
- List-to-sale price ratio
- Inventory levels
- Foreclosure rate
- Price appreciation by neighborhood

**Hot Markets Leaderboard:**
- Top 10 zip codes by price growth
- Top 10 by deal volume
- Top 10 by foreclosure activity

**Export:** PDF report generation

### 4.9 Saved Searches & Alerts
**Save Search:**
- Name the search
- Set alert frequency: Instant, Daily, Weekly
- Save button in search bar

**Manage Saved Searches:**
- List all saved searches
- Enable/disable toggle
- Edit search criteria
- Delete saved search

### 4.10 Subscription & Payments
**Pricing Plans:**
- Free: 50 property lookups, no skip trace, no marketing
- Basic ($49/mo): 500 lookups, 25 skip traces, 100 mail pieces
- Pro ($99/mo): 2000 lookups, 100 skip traces, 500 mail pieces
- Team ($249/mo): Unlimited lookups, 500 skip traces, 2000 mail pieces

**Billing:**
- Stripe Checkout integration
- Plan upgrade/downgrade
- Cancel subscription
- Credits top-up
- Billing history with invoices

**Usage Dashboard:**
- Current period usage vs. limits
- Visual progress bars
- Warning when approaching limits

### 4.11 Public Pages

**Landing Page:**
- Hero: Headline, subheadline, search bar, CTA buttons
- Features: 6 feature cards with icons and descriptions
- Stats: Platform numbers (properties, users, etc.)
- Pricing: Plan comparison table
- Testimonials: 3-4 user testimonials with photos
- CTA: Final call-to-action section
- Footer: Links, contact info, legal

**Pricing Page:**
- Plan cards with feature comparison
- FAQ accordion
- Contact sales button

**Features Page:**
- Detailed feature descriptions with screenshots
- Use case sections

**Contact Page:**
- Contact form (name, email, message)
- Office information

## 5. Component Inventory

### Core Components
| Component | States | Notes |
|-----------|--------|-------|
| PropertyCard | default, hover, selected, saved | Used in list view and map popups |
| PropertyMarker | default, hover, clustered | Map pins with status colors |
| FilterPanel | expanded, collapsed, loading | Sidebar filter controls |
| PropertyDrawer | open, closed, loading | Right-side detail panel |
| DataTable | loading, empty, populated, error | Sortable, paginated tables |
| StatCard | default, trend-up, trend-down | Metric cards with sparklines |
| Button | default, hover, active, disabled, loading | Primary, secondary, outline, ghost |
| Input | default, focus, error, disabled | With label and error message |
| Select | default, open, selected, disabled | Single and multi-select |
| Modal | open, closed | Confirmation and form modals |
| Toast | success, error, info, warning | Auto-dismiss notifications |
| Skeleton | animated | Loading placeholders |
| Badge | status variants | Property status indicators |
| Tooltip | hover-activated | Help text and explanations |
| Tabs | default | Property detail sections |
| Chart | loading, populated, empty | Recharts wrapper components |
| Map | loading, populated, error | React-Leaflet wrapper |

### shadcn/ui Components Used
- Button, Card, Input, Select, Dialog, Sheet, Tabs, Table
- Badge, Avatar, Separator, DropdownMenu, Popover
- Checkbox, RadioGroup, Slider, Switch, Accordion
- Toast (Sonner), Skeleton, Progress, Tooltip

## 6. Technical Approach

### Framework & Architecture
- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Server Components** by default, Client Components where needed
- **Server Actions** for mutations

### API Design
All data fetching via Server Components. API routes only for:
- `/api/webhooks/stripe` - Payment webhooks
- `/api/maps/geocode` - Address geocoding (Mapbox/Google)
- `/api/skip-trace` - Skip tracing service proxy
- `/api/export/[type]` - File export generation

### Data Model
**properties**
- id, address, city, state, zip, country
- parcel_id, apn
- property_type, property_use
- owner_name, owner_address, owner_type
- mailing_address
- estimated_value, equity, equity_percent
- loan_balance, loan_type, lender_name, origination_date
- assessed_value, annual_taxes, tax_delinquency
- bedrooms, bathrooms, sqft, lot_size
- year_built, garage, pool
- latitude, longitude
- flood_zone, school_district
- listing_status, listing_date, days_on_market
- photos (JSON array)
- created_at, updated_at

**lead_lists**
- id, user_id, name, description
- filters (JSON)
- record_count
- created_at, updated_at

**list_properties**
- id, list_id, property_id
- status (new, contacted, interested, skip, converted)
- tags, notes
- added_at

**skip_trace_results**
- id, property_id, user_id
- phones (JSON), emails (JSON)
- confidence_score, source
- credits_used
- created_at

**campaigns**
- id, user_id, name, type (mail, email)
- template_id, audience_list_id
- status (draft, scheduled, sending, completed)
- scheduled_at, sent_at
- stats (JSON): sent, delivered, opens, clicks, cost
- created_at, updated_at

**saved_searches**
- id, user_id, name
- filters (JSON), location
- alert_frequency (none, instant, daily, weekly)
- is_active
- created_at, updated_at

**subscriptions**
- id, user_id, plan (free, basic, pro, team)
- status (active, cancelled, past_due)
- current_period_start, current_period_end
- credits_remaining
- stripe_subscription_id
- created_at, updated_at

**transactions**
- id, user_id, type (lookup, skip_trace, mail, topup)
- amount, credits, description
- created_at

**market_stats**
- id, location_type, location_value
- metric_name, metric_value
- period_start, period_end
- created_at

### Authentication
- Supabase Auth with email/password
- Protected routes via middleware (but NOT src/middleware.ts - use server-side checks)
- Session management via cookies

### State Management
- URL search params for filter state
- React Context for UI state (sidebar open, selected property)
- Server state via Server Components and revalidation

### Map Integration
- React-Leaflet with OpenStreetMap tiles (free, no API key)
- Custom tile layer for dark mode
- MarkerCluster for performance with many pins
- GeoJSON for drawing tools

### File Structure
```
src/
├── app/
│   ├── (public)/              # Public pages
│   │   ├── page.tsx           # Landing
│   │   ├── pricing/page.tsx
│   │   ├── features/page.tsx
│   │   └── contact/page.tsx
│   ├── (app)/                 # Authenticated app
│   │   ├── layout.tsx        # App shell with sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── search/page.tsx   # Main map search
│   │   ├── property/[id]/page.tsx
│   │   ├── lists/page.tsx
│   │   ├── lists/[id]/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── alerts/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── webhooks/stripe/route.ts
│   │   └── export/[type]/route.ts
│   ├── layout.tsx
│   └── page.tsx              # Redirect to /search or /landing
├── components/
│   ├── app/                   # App shell components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AppShell.tsx
│   ├── map/                   # Map components
│   │   ├── PropertyMap.tsx
│   │   ├── PropertyMarker.tsx
│   │   ├── MapControls.tsx
│   │   └── DrawingTools.tsx
│   ├── property/             # Property components
│   │   ├── PropertyCard.tsx
│   │   ├── PropertyDrawer.tsx
│   │   ├── PropertyDetail.tsx
│   │   ├── PropertyFilters.tsx
│   │   └── PropertyTable.tsx
│   ├── lists/                 # Lead list components
│   │   ├── ListCard.tsx
│   │   ├── ListTable.tsx
│   │   └── ExportDialog.tsx
│   ├── analytics/             # Analytics components
│   │   ├── MarketChart.tsx
│   │   ├── StatCard.tsx
│   │   └── HotMarkets.tsx
│   ├── campaigns/             # Campaign components
│   │   ├── CampaignCard.tsx
│   │   └── CampaignBuilder.tsx
│   └── shared/                # Shared components
│       ├── DataTable.tsx
│       ├── StatCard.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── db.ts                  # Database utilities
│   ├── maps.ts                # Map utilities
│   └── format.ts              # Formatting utilities
├── hooks/
│   ├── usePropertySearch.ts
│   ├── useLeadLists.ts
│   └── useSubscription.ts
└── types/
    └── index.ts               # TypeScript types
```

## 7. Demo Data Strategy

Since this is a frontend clone without a real backend, all property data will be:
- Seeded demo data with 100+ realistic US properties
- Stored in local state or localStorage for persistence
- Simulated API responses with realistic delays

Properties will cover various:
- States and cities across the US
- Property types (SFR, multi-family, condo, commercial, land)
- Owner types (absentee, owner-occupied, corporate)
- Statuses (active, off-market, pre-foreclosure, REO)
- Equity levels (0%, 25%, 50%, 75%, free & clear)
- Price ranges ($50k - $2M+)
