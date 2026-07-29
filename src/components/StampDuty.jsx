import { useState, useMemo, useEffect } from 'react';
import { setSeo, origin } from '../utils/seo';

// Indicative state-wise stamp duty & registration (%). Rates vary by city,
// urban/rural and value slab and change often — hence the "verify" disclaimer.
// male/female capture the common women's-concession where applicable.
const STATES = [
  { id: 'dl', name: 'Delhi', male: 6, female: 4, reg: 1 },
  { id: 'hr', name: 'Haryana', male: 7, female: 5, reg: 1 },
  { id: 'up', name: 'Uttar Pradesh', male: 7, female: 6, reg: 1 },
  { id: 'mh', name: 'Maharashtra', male: 6, female: 5, reg: 1 },
  { id: 'ka', name: 'Karnataka', male: 5, female: 5, reg: 1 },
  { id: 'ts', name: 'Telangana', male: 5, female: 5, reg: 0.5 },
  { id: 'tn', name: 'Tamil Nadu', male: 7, female: 7, reg: 4 },
  { id: 'gj', name: 'Gujarat', male: 4.9, female: 4.9, reg: 1 },
  { id: 'rj', name: 'Rajasthan', male: 6, female: 5, reg: 1 },
  { id: 'wb', name: 'West Bengal', male: 6, female: 6, reg: 1 },
  { id: 'pb', name: 'Punjab', male: 7, female: 5, reg: 1 },
  { id: 'mp', name: 'Madhya Pradesh', male: 7.5, female: 7.5, reg: 3 },
];

const OWNERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'joint', label: 'Joint' },
];

const inr = (n) => {
  n = Math.round(Math.abs(n || 0));
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const inrFull = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

function Field({ label, value, min, max, step, onChange, lo, hi }) {
  return (
    <div className="ig-loan-field">
      <div className="ig-loan-field-top"><label>{label}</label><strong>{inr(value)}</strong></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
      <div className="ig-loan-scale"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

export default function StampDuty() {
  const [price, setPrice] = useState(8000000);
  const [stateId, setStateId] = useState('hr');
  const [owner, setOwner] = useState('male');
  const [status, setStatus] = useState('ready');   // 'ready' | 'uc'
  const [affordable, setAffordable] = useState(false);

  useEffect(() => {
    setSeo({
      title: 'Stamp Duty, GST & Registration Cost Calculator | PropertyInsta',
      description: 'Work out the true all-in cost of buying a home in India — state-wise stamp duty (with women’s concession), registration charges and GST on under-construction homes.',
      canonical: origin() + '/stamp-duty',
    });
  }, []);

  const st = STATES.find(s => s.id === stateId) || STATES[0];

  const calc = useMemo(() => {
    // Women's concession where a state offers it; Joint ≈ midpoint of the two.
    const stampRate =
      owner === 'female' ? st.female :
      owner === 'joint' ? (st.male + st.female) / 2 :
      st.male;
    const regRate = st.reg;
    const gstRate = status === 'uc' ? (affordable ? 1 : 5) : 0;

    const stamp = price * stampRate / 100;
    const registration = price * regRate / 100;
    const gst = price * gstRate / 100;
    const extra = stamp + registration + gst;
    const total = price + extra;
    return { stampRate, regRate, gstRate, stamp, registration, gst, extra, total, effPct: price ? extra / price * 100 : 0 };
  }, [price, st, owner, status, affordable]);

  // Stacked-bar segments (share of the all-in total).
  const seg = (v) => `${(v / calc.total * 100).toFixed(1)}%`;
  const womensSaving = owner !== 'female' && st.female < st.male
    ? price * (st.male - st.female) / 100 : 0;

  return (
    <div className="ig-bwu ig-stamp">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🧾 Buying Cost</span>
        <h1>The real cost of buying — beyond the sticker price.</h1>
        <p>Stamp duty, registration and GST add lakhs on top of a home’s price. Get your true all-in number, state-wise, in seconds.</p>
      </div>

      <div className="ig-loan-calc">
        <div className="ig-loan-inputs">
          <Field label="Property price" value={price} min={1000000} max={100000000} step={100000} onChange={setPrice} lo="₹10 L" hi="₹10 Cr" />

          <div className="ig-loan-input"><label>State</label>
            <select value={stateId} onChange={e => setStateId(e.target.value)}>{STATES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </div>

          <div className="ig-stamp-seg-wrap">
            <label>Buyer / ownership</label>
            <div className="ig-stamp-seg">
              {OWNERS.map(o => (
                <button key={o.id} className={owner === o.id ? 'active' : ''} onClick={() => setOwner(o.id)}>{o.label}</button>
              ))}
            </div>
          </div>

          <div className="ig-stamp-seg-wrap">
            <label>Property status</label>
            <div className="ig-stamp-seg">
              <button className={status === 'ready' ? 'active' : ''} onClick={() => setStatus('ready')}>Ready / Resale</button>
              <button className={status === 'uc' ? 'active' : ''} onClick={() => setStatus('uc')}>Under-Construction</button>
            </div>
          </div>

          {status === 'uc' && (
            <label className="ig-stamp-check">
              <input type="checkbox" checked={affordable} onChange={e => setAffordable(e.target.checked)} />
              <span>Affordable housing <em>(≤ ₹45 L &amp; ≤ 60/90 sq.m carpet) — GST 1% instead of 5%</em></span>
            </label>
          )}

          <p className="ig-loan-note">
            {st.name}: stamp duty {calc.stampRate}% + registration {calc.regRate}%
            {status === 'uc' ? ` + GST ${calc.gstRate}% (under-construction)` : ' · no GST on ready/resale homes'}.
          </p>
        </div>

        <div className="ig-loan-results">
          <div className="ig-stamp-total">
            <span>All-in cost of buying</span>
            <h2>{inr(calc.total)}</h2>
            <p>That’s <strong>{inr(calc.extra)}</strong> ({calc.effPct.toFixed(1)}%) on top of the {inr(price)} price.</p>
          </div>

          <div className="ig-stamp-bar">
            <span className="base" style={{ width: seg(price) }} title="Property price" />
            <span className="stamp" style={{ width: seg(calc.stamp) }} title="Stamp duty" />
            <span className="reg" style={{ width: seg(calc.registration) }} title="Registration" />
            {calc.gst > 0 && <span className="gst" style={{ width: seg(calc.gst) }} title="GST" />}
          </div>

          <div className="ig-stamp-rows">
            <div><span><i className="dot base" />Property price</span><strong>{inrFull(price)}</strong></div>
            <div><span><i className="dot stamp" />Stamp duty <em>({calc.stampRate}%)</em></span><strong>{inrFull(calc.stamp)}</strong></div>
            <div><span><i className="dot reg" />Registration <em>({calc.regRate}%)</em></span><strong>{inrFull(calc.registration)}</strong></div>
            {calc.gst > 0 && <div><span><i className="dot gst" />GST <em>({calc.gstRate}%)</em></span><strong>{inrFull(calc.gst)}</strong></div>}
            <div className="tot"><span>Total payable</span><strong>{inrFull(calc.total)}</strong></div>
          </div>

          {womensSaving > 0 && (
            <div className="ig-stamp-tip">💡 Registering in a woman’s name in {st.name} could save about <strong>{inr(womensSaving)}</strong> in stamp duty.</div>
          )}
          <p className="ig-loan-disclaimer">Indicative only — stamp duty & registration vary by city, urban/rural area and value slab, and rates change. Verify with your state’s registration department (IGR) before budgeting. Not legal or tax advice.</p>
        </div>
      </div>

      <div className="ig-bwu-benefits ig-stamp-benefits">
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🏛️</span><div><strong>State-wise rates</strong><span>12 states + concessions.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">👩</span><div><strong>Women’s concession</strong><span>Lower duty in many states.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🧾</span><div><strong>GST built in</strong><span>1% / 5% on under-construction.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🎯</span><div><strong>True budget</strong><span>No registration-day surprises.</span></div></div>
      </div>
    </div>
  );
}
