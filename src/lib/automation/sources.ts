/**
 * Step 1 — Data Collection.
 *
 * Every source in the build prompt is registered as a pluggable connector.
 * In production you attach a real implementation per county (Playwright /
 * Puppeteer scraper, county API, n8n workflow webhook, CSV drop, etc.).
 *
 * Out of the box each connector runs in DEMO mode: it deterministically
 * synthesizes realistic public-record data for the selected counties so the
 * whole pipeline is testable end-to-end without any credentials.
 *
 * To plug in a real source either:
 *   1. Set N8N_WEBHOOK_URL — the pipeline POSTs the run config to your n8n
 *      workflow and ingests any records the workflow returns, or
 *   2. Implement `collect()` on a connector below (fetch/Playwright/etc.).
 */

import { LeadCategory, RawRecord, AutomationConfig } from './types';
import { createRng, pick, randInt, chance, Rng } from './rng';

export interface SourceConnector {
  id: string;
  name: string;
  description: string;
  /** categories this source can produce */
  categories: LeadCategory[];
  collect(county: string, state: string, config: AutomationConfig): Promise<RawRecord[]>;
}

/* ------------------------------------------------------------------ */
/* Demo data pools                                                     */
/* ------------------------------------------------------------------ */

const FIRST = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Carlos', 'Maria', 'Luis', 'Rosa', 'Andre', 'Denise', 'Walter', 'Gloria'];
const LAST = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Nguyen', 'Robinson', 'Clark', 'Lewis', 'Walker', 'Young'];
const STREETS = ['Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lake', 'Hill', 'Sunset', 'Ridge', 'Park', 'Main', 'Church', 'Highland', 'Meadow', 'River', 'Spring', 'Willow', 'Magnolia', 'Dogwood', 'Juniper', 'Bluebonnet', 'Peachtree', 'Cypress'];
const SUFFIX = ['St', 'Ave', 'Dr', 'Ln', 'Rd', 'Ct', 'Blvd', 'Way', 'Pl', 'Ter'];
const PROP_TYPES = ['Single Family', 'Single Family', 'Single Family', 'Townhouse', 'Condo', 'Duplex', 'Multi-Family', 'Mobile Home'];
const LLC_SUFFIX = ['Holdings LLC', 'Properties LLC', 'Investments LLC', 'Family Trust', 'Living Trust', 'Estates Inc', 'Capital Group LLC'];

const COUNTY_CITIES: Record<string, string[]> = {
  Harris: ['Houston', 'Pasadena', 'Baytown', 'Spring'],
  Dallas: ['Dallas', 'Garland', 'Irving', 'Mesquite'],
  Tarrant: ['Fort Worth', 'Arlington', 'Euless'],
  Bexar: ['San Antonio', 'Converse', 'Universal City'],
  Travis: ['Austin', 'Pflugerville', 'Manor'],
  Collin: ['Plano', 'McKinney', 'Frisco'],
  Denton: ['Denton', 'Lewisville', 'Flower Mound'],
  Hidalgo: ['McAllen', 'Edinburg', 'Mission'],
  'El Paso': ['El Paso', 'Socorro', 'Horizon City'],
  Montgomery: ['Conroe', 'The Woodlands', 'Willis'],
  'Miami-Dade': ['Miami', 'Hialeah', 'Homestead', 'Miami Gardens'],
  Broward: ['Fort Lauderdale', 'Hollywood', 'Pompano Beach'],
  'Palm Beach': ['West Palm Beach', 'Boca Raton', 'Lake Worth'],
  Hillsborough: ['Tampa', 'Brandon', 'Plant City'],
  Orange: ['Orlando', 'Winter Garden', 'Apopka'],
  Duval: ['Jacksonville', 'Atlantic Beach'],
  Pinellas: ['St. Petersburg', 'Clearwater', 'Largo'],
  Lee: ['Fort Myers', 'Cape Coral', 'Lehigh Acres'],
  Fulton: ['Atlanta', 'Roswell', 'Alpharetta', 'East Point'],
  Gwinnett: ['Lawrenceville', 'Duluth', 'Snellville'],
  Cobb: ['Marietta', 'Smyrna', 'Kennesaw'],
  DeKalb: ['Decatur', 'Stone Mountain', 'Lithonia'],
  Chatham: ['Savannah', 'Pooler'],
  Clayton: ['Jonesboro', 'Riverdale', 'Forest Park'],
  Maricopa: ['Phoenix', 'Mesa', 'Glendale', 'Chandler'],
  Pima: ['Tucson', 'Marana', 'Oro Valley'],
  Pinal: ['Casa Grande', 'Apache Junction', 'Maricopa'],
  Yuma: ['Yuma', 'San Luis', 'Somerton'],
  'Los Angeles': ['Los Angeles', 'Long Beach', 'Lancaster', 'Palmdale'],
  'San Diego': ['San Diego', 'Chula Vista', 'Oceanside', 'El Cajon'],
  Riverside: ['Riverside', 'Moreno Valley', 'Hemet'],
  'San Bernardino': ['San Bernardino', 'Fontana', 'Victorville'],
  'Santa Clara': ['San Jose', 'Gilroy', 'Morgan Hill'],
};

const STATE_ZIP_PREFIX: Record<string, string> = {
  Texas: '7', Florida: '3', Georgia: '3', Arizona: '8', California: '9',
};

function fakeOwner(rng: Rng): { name: string; corporate: boolean } {
  if (chance(rng, 0.14)) {
    return { name: `${pick(rng, LAST)} ${pick(rng, LLC_SUFFIX)}`, corporate: true };
  }
  return { name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`, corporate: false };
}

function fakeAddress(rng: Rng): string {
  return `${randInt(rng, 100, 19999)} ${pick(rng, STREETS)} ${pick(rng, SUFFIX)}`;
}

function futureDate(rng: Rng, minDays: number, maxDays: number): string {
  const d = new Date(Date.now() + randInt(rng, minDays, maxDays) * 86400000);
  return d.toISOString().slice(0, 10);
}

function pastDate(rng: Rng, minDays: number, maxDays: number): string {
  const d = new Date(Date.now() - randInt(rng, minDays, maxDays) * 86400000);
  return d.toISOString().slice(0, 10);
}

/**
 * Generic demo generator shared by all connectors. Deterministic per
 * (source, county, day) so repeated runs produce overlapping records —
 * which exercises the de-duplication stage exactly like real life.
 */
function demoRecords(
  source: { id: string; name: string; categories: LeadCategory[] },
  county: string,
  state: string,
  config: AutomationConfig,
  count: [number, number],
): RawRecord[] {
  const day = new Date().toISOString().slice(0, 10);
  const rng = createRng(`${source.id}:${county}:${state}:${day}`);
  const cities = COUNTY_CITIES[county] || [county];
  const zipPrefix = STATE_ZIP_PREFIX[state] || '5';
  const n = randInt(rng, count[0], count[1]);
  const records: RawRecord[] = [];

  for (let i = 0; i < n; i++) {
    const owner = fakeOwner(rng);
    const address = fakeAddress(rng);
    const city = pick(rng, cities);
    const zip = `${zipPrefix}${randInt(rng, 1000, 9999)}${randInt(rng, 0, 9)}`.slice(0, 5);
    const marketValue = randInt(rng, 120, 850) * 1000;
    const loanBalance = chance(rng, 0.25) ? 0 : Math.round(marketValue * rng() * 0.85);
    const absentee = chance(rng, 0.35);
    const yearsOwned = randInt(rng, 1, 32);

    const flags: Partial<Record<LeadCategory, boolean>> = {};
    // primary flags from this source
    for (const cat of source.categories) {
      if (chance(rng, 0.8)) flags[cat] = true;
    }
    // secondary correlated signals
    if (absentee) flags.absentee_owner = true;
    if (chance(rng, 0.12)) flags.vacant = true;
    if (flags.probate && chance(rng, 0.5)) flags.inherited = true;
    if (flags.probate && chance(rng, 0.3)) flags.estate_sale = true;
    if (chance(rng, 0.06)) flags.hoa_lien = true;
    if (chance(rng, 0.05)) flags.utility_delinquent = true;

    const lienCount = (flags.tax_lien ? 1 : 0) + (flags.hoa_lien ? 1 : 0) + (chance(rng, 0.15) ? 1 : 0);

    records.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: `https://records.${county.toLowerCase().replace(/[^a-z]/g, '')}county.gov/${source.id}/${randInt(rng, 100000, 999999)}`,
      county,
      state,
      ownerName: chance(rng, 0.92) ? owner.name : undefined, // some records miss owner → enrichment fills it
      propertyAddress: `${address}, ${city}, ${state} ${zip}`,
      city,
      zip,
      mailingAddress: absentee ? `${fakeAddress(rng)}, ${pick(rng, cities)}, ${state} ${zip}` : undefined,
      apn: `${randInt(rng, 10, 99)}-${randInt(rng, 100, 999)}-${randInt(rng, 100, 999)}`,
      propertyType: pick(rng, PROP_TYPES),
      assessedValue: Math.round(marketValue * (0.7 + rng() * 0.2)),
      marketValue,
      loanBalance,
      lienAmount: flags.tax_lien || flags.hoa_lien ? randInt(rng, 2, 60) * 500 : undefined,
      delinquentTaxes: flags.tax_delinquent || flags.tax_lien ? randInt(rng, 1, 40) * 250 : undefined,
      auctionDate: flags.sheriff_sale || flags.foreclosure || flags.tax_deed ? futureDate(rng, 10, 90) : undefined,
      filingDate: pastDate(rng, 5, 240),
      lastSaleDate: pastDate(rng, yearsOwned * 365, yearsOwned * 365 + 200),
      yearsOwned,
      lienCount,
      flags,
    });
  }
  return records;
}

function demoConnector(
  id: string,
  name: string,
  description: string,
  categories: LeadCategory[],
  count: [number, number] = [4, 10],
): SourceConnector {
  return {
    id,
    name,
    description,
    categories,
    async collect(county, state, config) {
      return demoRecords({ id, name, categories }, county, state, config, count);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Registry — every source class from Step 1 of the build prompt.      */
/* Add new counties / sources by appending to this list.               */
/* ------------------------------------------------------------------ */

export const SOURCE_REGISTRY: SourceConnector[] = [
  demoConnector('county_tax_assessor', 'County Tax Assessor', 'Assessed values, ownership, tax status', ['tax_delinquent', 'absentee_owner'], [6, 14]),
  demoConnector('county_recorder', 'County Recorder', 'Deeds, liens, lis pendens recordings', ['tax_lien', 'pre_foreclosure']),
  demoConnector('tax_collector', 'Tax Collector', 'Delinquent tax rolls', ['tax_delinquent', 'tax_lien'], [5, 12]),
  demoConnector('sheriff_sale', 'Sheriff Sale Listings', 'Upcoming sheriff auctions', ['sheriff_sale', 'foreclosure']),
  demoConnector('foreclosure_auction', 'Foreclosure Auction Sites', 'Trustee & judicial auction calendars', ['foreclosure']),
  demoConnector('probate_court', 'Probate Court Records', 'Estate & inheritance case filings', ['probate', 'inherited', 'estate_sale']),
  demoConnector('bankruptcy_filings', 'Bankruptcy Filings (PACER)', 'Ch. 7 / Ch. 13 filings with real property', ['bankruptcy'], [2, 6]),
  demoConnector('code_enforcement', 'Code Enforcement Database', 'Open violations & condemned structures', ['code_violation', 'vacant']),
  demoConnector('vacant_property_list', 'Vacant Property Registry', 'Municipal vacancy registrations', ['vacant', 'absentee_owner']),
  demoConnector('tax_lien_db', 'Tax Lien Database', 'Sold & outstanding tax lien certificates', ['tax_lien']),
  demoConnector('tax_deed_listings', 'Tax Deed Listings', 'Tax deed sale schedules', ['tax_deed'], [2, 6]),
  demoConnector('open_data_portal', 'Gov Open-Data Portal', 'Municipal open datasets', ['code_violation', 'utility_delinquent'], [3, 8]),
  demoConnector('hud_listings', 'HUD Listings', 'HUD homes inventory', ['foreclosure'], [1, 4]),
  demoConnector('fha_distressed', 'FHA Distressed Properties', 'FHA defaulted-loan inventory', ['pre_foreclosure'], [1, 4]),
  demoConnector('public_notices', 'Public Notice Websites', 'Legal notices & announcements', ['pre_foreclosure', 'sheriff_sale'], [3, 8]),
  demoConnector('municipal_foreclosures', 'Municipal Foreclosure Notices', 'City-initiated foreclosure actions', ['foreclosure'], [1, 5]),
  demoConnector('court_foreclosures', 'Court Foreclosure Filings', 'Judicial foreclosure dockets', ['foreclosure', 'pre_foreclosure']),
  demoConnector('nod_filings', 'Notice of Default (NOD)', 'Recorded NODs', ['pre_foreclosure'], [4, 10]),
  demoConnector('nts_filings', 'Notice of Trustee Sale (NTS)', 'Recorded NTS', ['foreclosure'], [3, 8]),
  demoConnector('lis_pendens', 'Lis Pendens Filings', 'Pending litigation notices', ['pre_foreclosure'], [3, 8]),
  demoConnector('eviction_filings', 'Eviction Filings', 'Landlord/tenant filings (where legal)', ['absentee_owner', 'other_motivated'], [2, 6]),
];

/** Returns connectors relevant to the lead types the user selected. */
export function relevantSources(leadTypes: LeadCategory[]): SourceConnector[] {
  return SOURCE_REGISTRY.filter((s) => s.categories.some((c) => leadTypes.includes(c)));
}

/**
 * Optional real-source ingestion via an n8n / Make.com workflow webhook.
 * The workflow receives the run config and may return
 * `{ records: RawRecord[] }` to be merged into the pipeline.
 */
export async function collectFromWebhook(config: AutomationConfig): Promise<RawRecord[]> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return [];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'hydrascout.collect', config }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`n8n webhook responded ${res.status}`);
  const data = await res.json().catch(() => null);
  return Array.isArray(data?.records) ? (data.records as RawRecord[]) : [];
}
