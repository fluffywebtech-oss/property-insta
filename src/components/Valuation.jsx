import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { localities } from '../data';
import { whatsappLink } from '../utils/leads';
import { setSeo, origin } from '../utils/seo';

const DESK_PHONE = '+91-98100 00000';
const TYPES = [
  { key: 'Apartment', m: 1.0 }, { key: 'Builder Floor', m: 0.96 },
  { key: 'Villa / House', m: 1.14 }, { key: 'Penthouse', m: 1.22 }, { key: 'Plot / Land', m: 0.72 },
];
const CONDITIONS = [
  { key: 'Newly built', m: 1.06 }, { key: 'Well maintained', m: 1.0 }, { key: 'Needs renovation', m: 0.9 },
];
const FURNISH = [
  { key: 'Fully Furnished', m: 1.05 }, { key: 'Semi-Furnished', m: 1.0 }, { key: 'Unfurnished', m: 0.97 },
];

const inrShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const perSqftLabel = (n) => `₹${Number(Math.round(n || 0)).toLocaleString('en-IN')}/sq.ft`;
const median = (arr) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const normP = (p) => ({ id: p.id, title: p.title, location: p.location || '', price: p.price, beds: p.beds ?? p.bedrooms, sqft: p.sqft ?? p.area, image: (p.images && p.images[0]) || p.image });

export default function Valuation() {
  const { allProperties, openProperty, setCurrentView } = useApp();
  const [locId, setLocId] = useState(localities[0].id);
  const [ptype, setPtype] = useState('Apartment');
  const [bhk, setBhk] = useState('3');
  const [area, setArea] = useState(1800);
  const [condition, setCondition] = useState('Well maintained');
  const [furnish, setFurnish] = useState('Semi-Furnished');

  useEffect(() => {
    setSeo({
      title: 'Home Valuation — What’s your property worth? | PropertyInsta',
      description: 'Get an instant estimate of your property’s value from locality price trends and comparable listings across Gurgaon NCR.',
      canonical: origin() + '/valuation',
    });
  }, []);

  const loc = localities.find(l => l.id === locId) || localities[0];

  const comps = useMemo(() => {
    const kws = loc.match || [];
    return allProperties.map(normP)
      .filter(p => p.sqft > 0 && p.price > 0 && kws.some(k => p.location.toLowerCase().includes(k.toLowerCase())))
      .map(p => ({ ...p, ppsf: p.price / p.sqft }))
      .sort((a, b) => Math.abs(a.sqft - area) - Math.abs(b.sqft - area));
  }, [allProperties, loc, area]);

  const est = useMemo(() => {
    const compRate = median(comps.slice(0, 8).map(c => c.ppsf));
    const baseRate = comps.length >= 2 ? Math.round(compRate * 0.5 + loc.avgPrice * 0.5) : loc.avgPrice;
    const tM = TYPES.find(t => t.key === ptype)?.m ?? 1;
    const cM = CONDITIONS.find(c => c.key === condition)?.m ?? 1;
    const fM = FURNISH.find(f => f.key === furnish)?.m ?? 1;
    const rate = Math.round(baseRate * tM * cM * fM);
    const value = rate * Number(area || 0);
    const confidence = comps.length >= 3 ? 'High' : comps.length >= 1 ? 'Medium' : 'Indicative';
    return { value, rate, low: value * 0.92, high: value * 1.08, marketRate: loc.avgPrice, confidence };
  }, [comps, loc, ptype, condition, furnish, area]);

  const waMsg = whatsappLink(DESK_PHONE, `Hi, I'd like an expert valuation for my ${bhk} BHK ${ptype} (~${area} sq.ft) in ${loc.name}. PropertyInsta estimate: ${inrShort(est.value)}.`);

  return (
    <div className="ig-bwu ig-val">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🏷️ Home Valuation</span>
        <h1>What’s your property worth?</h1>
        <p>Get an instant estimate from locality price trends &amp; comparable listings — free, no sign-up.</p>
      </div>

      <div className="ig-loan-calc">
        {/* Inputs */}
        <div className="ig-loan-inputs ig-val-inputs">
          <div className="ig-loan-input"><label>Locality</label>
            <select value={locId} onChange={e => setLocId(e.target.value)}>{localities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          </div>
          <div className="ig-loan-input"><label>Property type</label>
            <select value={ptype} onChange={e => setPtype(e.target.value)}>{TYPES.map(t => <option key={t.key}>{t.key}</option>)}</select>
          </div>
          <div className="ig-val-row">
            <div className="ig-loan-input"><label>Bedrooms</label>
              <select value={bhk} onChange={e => setBhk(e.target.value)}>{['1', '2', '3', '4', '5', '5+'].map(o => <option key={o}>{o}</option>)}</select>
            </div>
            <div className="ig-loan-input"><label>Built-up area (sq.ft)</label>
              <input type="number" inputMode="numeric" value={area} onChange={e => setArea(e.target.value)} />
            </div>
          </div>
          <div className="ig-loan-input"><label>Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}>{CONDITIONS.map(c => <option key={c.key}>{c.key}</option>)}</select>
          </div>
          <div className="ig-loan-input"><label>Furnishing</label>
            <select value={furnish} onChange={e => setFurnish(e.target.value)}>{FURNISH.map(f => <option key={f.key}>{f.key}</option>)}</select>
          </div>
          <p className="ig-loan-note">{loc.name}: market rate ~{perSqftLabel(loc.avgPrice)} · <span className="up">▲ {loc.priceTrend}%</span> 1-yr</p>
        </div>

        {/* Result */}
        <div className="ig-loan-results">
          <div className="ig-loan-emi green">
            <span>Estimated value</span>
            <h2>{inrShort(est.value)}</h2>
          </div>
          <div className="ig-val-range">
            <span>{inrShort(est.low)}</span>
            <div className="ig-val-range-bar"><span /></div>
            <span>{inrShort(est.high)}</span>
          </div>
          <div className="ig-loan-stats">
            <div><span>Rate used</span><strong>{perSqftLabel(est.rate)}</strong></div>
            <div><span>Confidence</span><strong className={`ig-val-conf ${est.confidence.toLowerCase()}`}>{est.confidence}</strong></div>
          </div>
          <div className="ig-val-ctas">
            <button className="ig-bwu-quote book" onClick={() => setCurrentView('post-property')}>List this property</button>
            <a className="ig-bwu-quote" href={waMsg} target="_blank" rel="noopener noreferrer">Get an expert valuation</a>
          </div>
          <p className="ig-loan-disclaimer">Indicative estimate from locality trends &amp; comparable listings — not a formal valuation.</p>
        </div>
      </div>

      {/* Comparable listings */}
      <section className="ig-bwu-section">
        <div className="ig-bwu-section-head"><h2>Comparable listings in {loc.name}</h2>{comps.length > 0 && <span className="ig-bwu-section-count">{comps.length} found</span>}</div>
        {comps.length === 0 ? (
          <div className="ig-bwu-empty">No comparable listings here yet — the estimate uses locality trends.</div>
        ) : (
          <div className="ig-loc-projects-grid">
            {comps.slice(0, 6).map(c => (
              <button key={c.id} className="ig-loc-proj" onClick={() => openProperty(c.id)}>
                <img src={c.image} alt={c.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                <div className="ig-loc-proj-body">
                  <strong>{inrShort(c.price)}</strong>
                  <span className="ig-loc-proj-title">{c.title}</span>
                  <span className="ig-loc-proj-loc">{c.beds} BHK · {Number(c.sqft).toLocaleString('en-IN')} sq.ft · {perSqftLabel(c.ppsf)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
