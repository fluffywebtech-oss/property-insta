// ════════════════════════════════════════════════════════════════════
//  Lead capture — persistence + helpers
//  Saves an enquiry to localStorage (always) and Supabase (best-effort,
//  if a `leads` table exists). Never throws to the UI.
// ════════════════════════════════════════════════════════════════════
import { supabase } from '../lib/supabase';

const LS_KEY = 'pi_leads';

// Human-friendly reference, e.g. "PI-LXY7K2"
function makeRef() {
  return 'PI-' + Date.now().toString(36).toUpperCase().slice(-6);
}

// Strip a phone string down to digits for tel:/wa.me links
export function digitsOnly(phone = '') {
  const d = String(phone).replace(/\D/g, '');
  // assume India if a bare 10-digit number
  return d.length === 10 ? '91' + d : d;
}

export function whatsappLink(phone, message) {
  const num = digitsOnly(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function telLink(phone) {
  return `tel:+${digitsOnly(phone)}`;
}

const INTENT_VERB = {
  visit: 'book a site visit for',
  contact: 'know more about',
  callback: 'get a callback regarding',
};

// Prefilled WhatsApp/enquiry message
export function leadMessage({ intent = 'contact', name, property }) {
  const verb = INTENT_VERB[intent] || INTENT_VERB.contact;
  const who = name ? `Hi, I'm ${name}. ` : 'Hi, ';
  const title = property?.title || 'this property';
  const priceLine = property?.price ? ` (listed at ₹${(property.price / 10000000).toFixed(2)} Cr)` : '';
  return `${who}I'd like to ${verb} "${title}"${priceLine} on PropertyInsta.`;
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

/**
 * Persist a lead. Returns { ref } synchronously-ish; the Supabase write is
 * fire-and-forget so the UI never waits on the network.
 */
export function saveLead(lead) {
  const ref = makeRef();
  const record = {
    ref,
    intent: lead.intent || 'contact',
    status: 'New',
    property_id: lead.propertyId ?? null,
    property_title: lead.propertyTitle || '',
    name: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    message: lead.message || '',
    visit_date: lead.date || '',
    visit_time: lead.time || '',
    agent_name: lead.agentName || '',
    created_at: new Date().toISOString(),
  };

  // 1) Always keep a local copy (survives offline / no table)
  try {
    const all = readLocal();
    all.unshift(record);
    localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 200)));
  } catch { /* ignore quota / private-mode errors */ }

  // 2) Best-effort remote write — swallow any error (missing table, RLS, offline)
  try {
    supabase.from('leads').insert(record).then(
      () => {},
      () => {},
    );
  } catch { /* supabase not ready — local copy already saved */ }

  return { ref };
}

export function getLeads() {
  // Normalise older records that predate the `status` field
  return readLocal().map(l => ({ status: 'New', ...l }));
}

// Patch a stored lead by reference (e.g. status changes). Best-effort remote sync.
export function updateLead(ref, patch) {
  try {
    const all = readLocal().map(l => (l.ref === ref ? { ...l, ...patch } : l));
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
  try {
    supabase.from('leads').update(patch).eq('ref', ref).then(() => {}, () => {});
  } catch { /* offline / no table */ }
}
