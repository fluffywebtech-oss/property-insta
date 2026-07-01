import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import { setSeo, origin } from '../utils/seo';

// Locality keywords used to spot an area inside a free-text prompt. Kept broad
// (e.g. "Golf Course" matches both "…Road" and "…Extension" in listing data).
const LOCALITY_KEYWORDS = [
  'Golf Course', 'SPR', 'Sohna', 'New Gurgaon', 'Dwarka Expressway',
  'DLF Phase', 'MG Road', 'Sushant Lok', 'Cyber City',
  'Sector 49', 'Sector 65', 'Sector 71', 'Sector 76', 'Sector 77',
];
const AMENITY_MAP = [
  ['swimming', 'pool'], ['pool', 'pool'], ['gym', 'gym'], ['fitness', 'gym'], ['parking', 'parking'],
  ['security', 'security'], ['gated', 'security'], ['garden', 'garden'], ['green', 'garden'],
  ['club', 'clubhouse'], ['power backup', 'powerbackup'], ['smart', 'smarthome'],
];

// Properties come in two shapes: static seed (beds/baths/sqft, lowercase type/
// status/amenities) or Supabase-mapped (bedrooms/bathrooms/area, capitalized).
// Normalise to one canonical view so matching works either way.
function norm(p) {
  const st = String(p.status || '').toLowerCase();
  return {
    price: p.price,
    location: String(p.location || '').toLowerCase(),
    beds: p.beds ?? p.bedrooms,
    baths: p.baths ?? p.bathrooms,
    sqft: p.sqft ?? p.area,
    type: String(p.type || '').toLowerCase(),
    status: st.includes('rent') ? 'rent' : st.includes('sale') ? 'sale' : st,
    amenities: (p.amenities || []).map(a => String(a).toLowerCase().replace(/\s+/g, '')),
  };
}
const TYPE_MAP = [
  ['penthouse', 'penthouse'], ['villa', 'villa'], ['independent', 'villa'], ['plot', 'plot'], ['land', 'plot'],
  ['builder floor', 'builder'], ['apartment', 'apartment'], ['flat', 'apartment'], ['commercial', 'commercial'], ['office', 'commercial'],
];
const EXAMPLES = [
  '4 BHK in Golf Course with a pool',
  '3 BHK apartment in New Gurgaon under ₹2.5 Cr',
  'Villa in DLF Phase with gym & security',
  'Penthouse on SPR with clubhouse & smart home',
];

function parseQuery(q) {
  const t = ` ${q.toLowerCase()} `;
  const parsed = { amenities: [], localities: [] };
  const bud = t.match(/₹?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lac|lacs|l)\b/);
  if (bud) { const n = parseFloat(bud[1]); parsed.budgetMax = /cr/.test(bud[2]) ? n * 1e7 : n * 1e5; }
  const bhk = t.match(/(\d+)\s*(?:bhk|bed)/); if (bhk) parsed.bhk = +bhk[1];
  if (/\brent\b|rental|lease/.test(t)) parsed.status = 'rent';
  else if (/\bbuy\b|\bsale\b|purchase|ready.to.move/.test(t)) parsed.status = 'sale';
  for (const [k, v] of TYPE_MAP) { if (t.includes(k)) { parsed.type = v; break; } }
  parsed.localities = LOCALITY_KEYWORDS.filter(k => t.includes(k.toLowerCase()));
  for (const [k, v] of AMENITY_MAP) { if (t.includes(k) && !parsed.amenities.includes(v)) parsed.amenities.push(v); }
  parsed.any = parsed.budgetMax != null || parsed.bhk != null || parsed.status || parsed.type || parsed.localities.length || parsed.amenities.length;
  return parsed;
}

// Weighted so a location / BHK / type match counts for more than budget alone.
const W = { budget: 1, bhk: 1.5, type: 1, status: 0.5, locality: 1.6, amenity: 1 };
function scoreProperty(n, parsed) {
  let got = 0, total = 0; const reasons = [];
  if (parsed.budgetMax != null) { total += W.budget; if (n.price <= parsed.budgetMax) { got += W.budget; reasons.push('within budget'); } }
  if (parsed.bhk != null) { total += W.bhk; if (n.beds === parsed.bhk) { got += W.bhk; reasons.push(`${parsed.bhk} BHK`); } else if (Math.abs((n.beds || 0) - parsed.bhk) === 1) got += W.bhk * 0.4; }
  if (parsed.type) { total += W.type; if (n.type.includes(parsed.type)) { got += W.type; reasons.push(parsed.type); } }
  if (parsed.status) { total += W.status; if (n.status === parsed.status) { got += W.status; reasons.push(parsed.status === 'rent' ? 'for rent' : 'for sale'); } }
  if (parsed.localities.length) { total += W.locality; if (parsed.localities.some(k => n.location.includes(k.toLowerCase()))) { got += W.locality; reasons.push('location'); } }
  if (parsed.amenities.length) { total += W.amenity; const m = parsed.amenities.filter(a => n.amenities.includes(a)); if (m.length) { got += W.amenity * (m.length / parsed.amenities.length); reasons.push(...m); } }
  const pct = total ? Math.round((got / total) * 100) : 0;
  return { pct, reasons };
}

export default function AiFinder() {
  const { allProperties, openProperty } = useApp();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  useEffect(() => {
    setSeo({
      title: 'AI Home Finder — Describe your dream home | PropertyInsta',
      description: 'Tell PropertyInsta what you want in plain English and get matched listings ranked by fit — budget, BHK, locality & amenities.',
      canonical: origin() + '/ai-finder',
    });
  }, []);

  const results = useMemo(() => {
    if (!submitted.trim()) return null;
    const parsed = parseQuery(submitted);
    let scored = allProperties.map(p => { const n = norm(p); return { p, n, ...scoreProperty(n, parsed) }; });
    if (parsed.any) scored = scored.filter(s => s.pct > 0);
    else scored = scored.filter(s => s.p.featured).map(s => ({ ...s, pct: 0 }));
    scored.sort((a, b) => b.pct - a.pct || (a.p.price - b.p.price));
    return { parsed, list: scored.slice(0, 12) };
  }, [submitted, allProperties]);

  const run = (q) => { const val = q ?? query; setQuery(val); setSubmitted(val); };

  return (
    <div className="ig-bwu ig-ai">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">✨ AI Home Finder</span>
        <h1>Describe your dream home</h1>
        <p>Tell us what you want in plain English — we’ll match &amp; rank listings by fit.</p>
        <form className="ig-ai-search" onSubmit={e => { e.preventDefault(); run(); }}>
          <span className="ig-ai-spark">✨</span>
          <input
            type="text"
            placeholder="e.g. 3 BHK under ₹2.5 Cr in Golf Course Road with a pool"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="ig-ai-go">Find homes</button>
        </form>
        <div className="ig-ai-examples">
          {EXAMPLES.map(ex => (
            <button key={ex} className="ig-ai-example" onClick={() => run(ex)}>{ex}</button>
          ))}
        </div>
      </div>

      {results && (
        <section className="ig-bwu-section">
          <div className="ig-bwu-section-head">
            <h2>{results.list.length > 0 ? `${results.list.length} best match${results.list.length === 1 ? '' : 'es'}` : 'No exact matches'}</h2>
            {results.parsed.any && <span className="ig-bwu-section-count">ranked by fit</span>}
          </div>

          {/* Understood criteria */}
          {results.parsed.any && (
            <div className="ig-ai-understood">
              <span>Looking for:</span>
              {results.parsed.bhk != null && <em>{results.parsed.bhk} BHK</em>}
              {results.parsed.type && <em>{results.parsed.type}</em>}
              {results.parsed.budgetMax != null && <em>under {formatPriceIndian(results.parsed.budgetMax)}</em>}
              {results.parsed.status && <em>{results.parsed.status === 'rent' ? 'for rent' : 'for sale'}</em>}
              {results.parsed.localities.map(l => <em key={l}>{l}</em>)}
              {results.parsed.amenities.map(a => <em key={a}>{a}</em>)}
            </div>
          )}

          {results.list.length === 0 ? (
            <div className="ig-bwu-empty">No listings matched — try relaxing the budget or locality.</div>
          ) : (
            <div className="ig-ai-grid">
              {results.list.map(({ p, n, pct, reasons }) => (
                <button key={p.id} className="ig-ai-card" onClick={() => openProperty(p.id)}>
                  <div className="ig-ai-card-img">
                    <img src={(p.images && p.images[0]) || p.image} alt={p.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                    {results.parsed.any && <span className={`ig-ai-match ${pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low'}`}>{pct}% match</span>}
                  </div>
                  <div className="ig-ai-card-body">
                    <strong className="ig-ai-price">{formatPriceIndian(p.price)}</strong>
                    <span className="ig-ai-title">{p.title}</span>
                    <span className="ig-ai-loc">📍 {p.location}</span>
                    <span className="ig-ai-specs">{n.beds} BHK · {n.baths} bath · {Number(n.sqft || 0).toLocaleString('en-IN')} sq.ft</span>
                    {reasons.length > 0 && (
                      <div className="ig-ai-reasons">
                        {Array.from(new Set(reasons)).slice(0, 4).map(r => <span key={r} className="ig-ai-reason">✓ {r}</span>)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
