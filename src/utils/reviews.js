// ════════════════════════════════════════════════════════════════════
//  Property reviews — merge static seed + user-submitted (localStorage),
//  and persist new ones best-effort to the shared Supabase `reviews` table
//  (so they surface in the admin Reviews inbox). Never throws to the UI.
// ════════════════════════════════════════════════════════════════════
import { supabase } from '../lib/supabase';
import { propertyReviews } from '../data';

const LS_KEY = 'pi_reviews';

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

// Newest-first list of reviews for a property (user-submitted, then seed).
export function getReviews(propertyId) {
  const seed = (propertyReviews[propertyId] || []).map(r => ({
    user: r.user, rating: r.rating, text: r.text || r.comment || '', date: r.date || '',
  }));
  const local = readLocal()
    .filter(r => r.propertyId === propertyId)
    .map(r => ({ user: r.user, rating: r.rating, text: r.text, date: r.date }));
  return [...local, ...seed];
}

export function ratingSummary(propertyId) {
  const rs = getReviews(propertyId);
  if (!rs.length) return { avg: 0, count: 0 };
  const avg = rs.reduce((a, r) => a + (r.rating || 0), 0) / rs.length;
  return { avg: Math.round(avg * 10) / 10, count: rs.length };
}

export function saveReview({ propertyId, user, rating, text }) {
  const record = {
    propertyId, user: (user || '').trim() || 'Anonymous',
    rating: Number(rating) || 0, text: (text || '').trim(),
    date: 'Just now', created_at: new Date().toISOString(),
  };
  // 1) Always keep a local copy
  try {
    const all = readLocal();
    all.unshift(record);
    localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 500)));
  } catch { /* ignore quota / private mode */ }
  // 2) Best-effort remote write to the shared table (missing table → swallow)
  try {
    supabase.from('reviews')
      .insert({ user: record.user, rating: record.rating, propertyId: record.propertyId, date: record.date, text: record.text })
      .then(() => {}, () => {});
  } catch { /* supabase not ready */ }
  return record;
}
