import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { demoProperties } from '@/lib/demo-data';

/**
 * Supabase-backed data helpers with a zero-config demo fallback.
 * When Supabase env vars are missing, all functions operate on in-memory
 * demo data so every page still works out of the box.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Temporary Admin User ID for single-user mode
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000';

/* ------------------------- demo fallback stores ------------------------- */

interface DemoDB {
  savedSearches: Record<string, unknown>[];
  leadLists: Record<string, unknown>[];
  listProperties: { list_id: string; property_id: string; status: string; tags: string[]; notes: string }[];
}

function demoDB(): DemoDB {
  const g = globalThis as unknown as { __hydrawireDemoDB?: DemoDB };
  if (!g.__hydrawireDemoDB) {
    g.__hydrawireDemoDB = { savedSearches: [], leadLists: [], listProperties: [] };
  }
  return g.__hydrawireDemoDB;
}

const newId = () => `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ------------------------------ properties ------------------------------ */

export async function getLiveLeads(filters: { minScore?: number; market?: string } = {}) {
  if (!supabase) {
    return filters.market
      ? demoProperties.filter((p) => p.city === filters.market)
      : demoProperties;
  }
  let query = supabase.from('properties').select('*').order('created_at', { ascending: false });
  if (filters.market) query = query.eq('city', filters.market);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPropertyById(id: string) {
  if (!supabase) {
    return demoProperties.find((p) => p.id === id) ?? null;
  }
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

/* ---------------------------- saved searches ---------------------------- */

export async function getSavedSearches() {
  if (!supabase) return demoDB().savedSearches;
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', ADMIN_USER_ID)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveSearch(search: { name: string; filters: unknown; location: unknown; alert_frequency: string }) {
  if (!supabase) {
    const record = { id: newId(), ...search, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    demoDB().savedSearches.unshift(record);
    return record;
  }
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({ ...search, user_id: ADMIN_USER_ID })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavedSearch(id: string) {
  if (!supabase) {
    const db = demoDB();
    db.savedSearches = db.savedSearches.filter((s) => (s as { id: string }).id !== id);
    return;
  }
  const { error } = await supabase.from('saved_searches').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSavedSearch(id: string, updates: Record<string, unknown>) {
  if (!supabase) {
    const db = demoDB();
    const i = db.savedSearches.findIndex((s) => (s as { id: string }).id === id);
    if (i >= 0) db.savedSearches[i] = { ...db.savedSearches[i], ...updates };
    return db.savedSearches[i];
  }
  const { data, error } = await supabase
    .from('saved_searches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ------------------------------ lead lists ------------------------------ */

export async function getLeadLists() {
  if (!supabase) return demoDB().leadLists;
  const { data, error } = await supabase
    .from('lead_lists')
    .select('*')
    .eq('user_id', ADMIN_USER_ID)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLeadList(name: string, description: string) {
  if (!supabase) {
    const record = { id: newId(), name, description, record_count: 0, created_at: new Date().toISOString() };
    demoDB().leadLists.unshift(record);
    return record;
  }
  const { data, error } = await supabase
    .from('lead_lists')
    .insert({ name, description, user_id: ADMIN_USER_ID })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLeadList(id: string) {
  if (!supabase) {
    const db = demoDB();
    db.leadLists = db.leadLists.filter((l) => (l as { id: string }).id !== id);
    return;
  }
  const { error } = await supabase.from('lead_lists').delete().eq('id', id);
  if (error) throw error;
}

export async function getPropertiesForList(listId: string) {
  if (!supabase) {
    const db = demoDB();
    return db.listProperties
      .filter((lp) => lp.list_id === listId)
      .map((lp) => {
        const prop = demoProperties.find((p) => p.id === lp.property_id);
        return prop ? { ...prop, status: lp.status, tags: lp.tags, notes: lp.notes } : null;
      })
      .filter(Boolean);
  }
  const { data, error } = await supabase
    .from('list_properties')
    .select(`
      list_properties(status, tags, notes, added_at),
      properties(*)
    `)
    .eq('list_id', listId);
  if (error) throw error;
  return (data as unknown as { properties: Record<string, unknown>; list_properties: { status: string; tags: string[]; notes: string } }[]).map((item) => ({
    ...item.properties,
    status: item.list_properties.status,
    tags: item.list_properties.tags,
    notes: item.list_properties.notes,
  }));
}

export async function addPropertiesToList(listId: string, propertyIds: string[]) {
  if (!supabase) {
    const db = demoDB();
    for (const propertyId of propertyIds) {
      if (!db.listProperties.some((lp) => lp.list_id === listId && lp.property_id === propertyId)) {
        db.listProperties.push({ list_id: listId, property_id: propertyId, status: 'new', tags: [], notes: '' });
      }
    }
    return;
  }
  const inserts = propertyIds.map((propertyId) => ({ list_id: listId, property_id: propertyId }));
  const { error } = await supabase.from('list_properties').insert(inserts);
  if (error) throw error;
}

export async function removePropertyFromList(listId: string, propertyId: string) {
  if (!supabase) {
    const db = demoDB();
    db.listProperties = db.listProperties.filter((lp) => !(lp.list_id === listId && lp.property_id === propertyId));
    return;
  }
  const { error } = await supabase
    .from('list_properties')
    .delete()
    .eq('list_id', listId)
    .eq('property_id', propertyId);
  if (error) throw error;
}

export async function updatePropertyStatusInList(listId: string, propertyId: string, status: string) {
  if (!supabase) {
    const lp = demoDB().listProperties.find((x) => x.list_id === listId && x.property_id === propertyId);
    if (lp) lp.status = status;
    return;
  }
  const { error } = await supabase
    .from('list_properties')
    .update({ status })
    .eq('list_id', listId)
    .eq('property_id', propertyId);
  if (error) throw error;
}

export async function bulkUpdatePropertyStatus(listId: string, propertyIds: string[], status: string) {
  for (const id of propertyIds) {
    await updatePropertyStatusInList(listId, id, status);
  }
}

export async function launchOutreach(leadIds: string[]) {
  if (!supabase) {
    for (const lp of demoDB().listProperties) {
      if (leadIds.includes(lp.property_id)) lp.status = 'contacted';
    }
    return null;
  }
  const { data, error } = await supabase
    .from('list_properties')
    .update({ status: 'contacted' })
    .in('property_id', leadIds);
  if (error) throw error;
  return data;
}
