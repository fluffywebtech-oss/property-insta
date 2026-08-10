import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp, deriveCity } from '../context/AppContext';
import { setSeo, origin } from '../utils/seo';

// Single shared access code. Overridable at build time via VITE_BUILDER_DESK_KEY.
// NOTE: a client-side code is obfuscation, not real security — it ships in the
// bundle. It keeps the console out of casual reach; it does not protect data
// that Supabase already serves to anonymous readers.
const DESK_KEY = (import.meta.env.VITE_BUILDER_DESK_KEY || 'INSTA-BUILDER-2026').trim();
const UNLOCK_STORE = 'pi_builderdesk_unlock';
const MAX_COMPARE = 4;

const L = 100000, CR = 10000000;
// Preset price brackets (min inclusive, max inclusive; max '' = open-ended).
const PRICE_BRACKETS = [
  { label: '₹75 L – 4 Cr', min: 75 * L, max: 4 * CR },
  { label: '₹5 Cr – 7 Cr', min: 5 * CR, max: 7 * CR },
  { label: '₹7 Cr – 10 Cr', min: 7 * CR, max: 10 * CR },
  { label: '₹10 Cr – 15 Cr', min: 10 * CR, max: 15 * CR },
  { label: '₹15 Cr – 25 Cr', min: 15 * CR, max: 25 * CR },
  { label: '₹25 Cr – 45 Cr', min: 25 * CR, max: 45 * CR },
  { label: '₹45 Cr – 50 Cr', min: 45 * CR, max: 50 * CR },
  { label: '₹50 Cr – 100 Cr', min: 50 * CR, max: 100 * CR },
  { label: '₹100 Cr+', min: 100 * CR, max: '' },
];

const inrShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '—');
const statusLabel = (s) => (/rent/i.test(s || '') ? 'For Rent' : /sale/i.test(s || '') ? 'For Sale' : (s || '—'));

// Normalise across static-seed & Supabase-mapped shapes
const norm = (p) => {
  const sqft = p.sqft ?? p.area;
  return {
    id: p.id, title: p.title, location: p.location || '',
    city: p.city || deriveCity(p.location), builder: p.builder || '—',
    image: (p.images && p.images[0]) || (p.media && p.media[0]) || p.image,
    price: p.price, beds: p.beds ?? p.bedrooms, baths: p.baths ?? p.bathrooms, sqft,
    type: p.type, status: p.status, furnishing: p.furnishing,
    possession: p.possessionDate || p.possession || p.possessionStatus,
    emi: p.emiEstimate,
    ppsf: p.pricePerSqft || (p.price && sqft ? Math.round(p.price / sqft) : null),
  };
};

// ── Single-code access gate ──────────────────────────────────────────────────
function Gate({ onUnlock, onExit }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (val.trim() === DESK_KEY) { sessionStorage.setItem(UNLOCK_STORE, '1'); onUnlock(); }
    else { setErr(true); setVal(''); }
  };

  return (
    <div className="bd-gate">
      <form className="bd-gate-card" onSubmit={submit}>
        <div className="bd-gate-ico">🔐</div>
        <h1>Builder Desk</h1>
        <p>Internal inventory console. Enter the access code to continue.</p>
        <input
          type="password" autoFocus autoComplete="off" value={val}
          className={err ? 'err' : ''}
          placeholder="Access code"
          onChange={e => { setVal(e.target.value); setErr(false); }}
        />
        {err && <span className="bd-gate-err">Incorrect code — try again.</span>}
        <button type="submit">Unlock console</button>
        <button type="button" className="bd-gate-exit" onClick={onExit}>← Back to site</button>
      </form>
    </div>
  );
}

export default function BuilderDesk() {
  const { allProperties, openProperty, setCurrentView } = useApp();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_STORE) === '1');

  // Filters
  const [search, setSearch] = useState('');
  const [fBuilder, setFBuilder] = useState('');
  const [fCity, setFCity] = useState('');
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('price_desc');

  const [view, setView] = useState('grid'); // 'grid' | 'list'

  // Compare selection
  const [picks, setPicks] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    setSeo({ title: 'Builder Desk | PropertyInsta', description: 'Internal inventory console.', canonical: origin() + '/builder-desk', noindex: true });
  }, []);

  const rows = useMemo(() => allProperties.map(norm), [allProperties]);
  const builders = useMemo(() => Array.from(new Set(rows.map(r => r.builder).filter(b => b && b !== '—'))).sort(), [rows]);
  const cities = useMemo(() => Array.from(new Set(rows.map(r => r.city).filter(Boolean))).sort(), [rows]);
  const types = useMemo(() => Array.from(new Set(rows.map(r => r.type).filter(Boolean))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = priceMin ? Number(priceMin) : 0;
    const max = priceMax ? Number(priceMax) : Infinity;
    let out = rows.filter(r =>
      (!q || (r.title || '').toLowerCase().includes(q) || (r.location || '').toLowerCase().includes(q) || (r.builder || '').toLowerCase().includes(q)) &&
      (!fBuilder || r.builder === fBuilder) &&
      (!fCity || r.city === fCity) &&
      (!fType || r.type === fType) &&
      (!fStatus || statusLabel(r.status) === fStatus) &&
      (r.price >= min && r.price <= max)
    );
    const s = { price_desc: (a, b) => b.price - a.price, price_asc: (a, b) => a.price - b.price,
      ppsf_asc: (a, b) => (a.ppsf || Infinity) - (b.ppsf || Infinity), ppsf_desc: (a, b) => (b.ppsf || 0) - (a.ppsf || 0),
      area_desc: (a, b) => (b.sqft || 0) - (a.sqft || 0) }[sortBy];
    return s ? [...out].sort(s) : out;
  }, [rows, search, fBuilder, fCity, fType, fStatus, priceMin, priceMax, sortBy]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const prices = filtered.map(r => r.price).filter(Boolean);
    const ppsfs = filtered.map(r => r.ppsf).filter(Boolean);
    const sum = prices.reduce((a, b) => a + b, 0);
    return {
      count: filtered.length,
      total: sum,
      avg: sum / (prices.length || 1),
      avgPpsf: ppsfs.length ? ppsfs.reduce((a, b) => a + b, 0) / ppsfs.length : null,
      min: Math.min(...prices), max: Math.max(...prices),
    };
  }, [filtered]);

  // Cheapest ₹/sq.ft in the current result set — flagged as "Best value".
  const bestValueId = useMemo(() => {
    let best = null;
    filtered.forEach(r => { if (r.ppsf && (!best || r.ppsf < best.ppsf)) best = r; });
    return best?.id ?? null;
  }, [filtered]);

  const resetFilters = useCallback(() => {
    setSearch(''); setFBuilder(''); setFCity(''); setFType(''); setFStatus(''); setPriceMin(''); setPriceMax('');
  }, []);

  const activeFilters = [
    search && `“${search}”`, fBuilder, fCity, fType, fStatus,
    (priceMin || priceMax) && `${priceMin ? inrShort(Number(priceMin)) : '₹0'}–${priceMax ? inrShort(Number(priceMax)) : 'max'}`,
  ].filter(Boolean);

  const exportCSV = useCallback(() => {
    const cols = ['Title', 'Builder', 'Location', 'City', 'Type', 'Status', 'Beds', 'Area (sq.ft)', '₹/sq.ft', 'Price (₹)'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(',')].concat(
      filtered.map(r => [r.title, r.builder, r.location, r.city, cap(r.type), statusLabel(r.status), r.beds, r.sqft, r.ppsf, r.price].map(esc).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `builder-desk-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const togglePick = useCallback((id) => {
    setPicks(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= MAX_COMPARE ? prev : [...prev, id]));
  }, []);

  const lock = useCallback(() => { sessionStorage.removeItem(UNLOCK_STORE); setUnlocked(false); }, []);

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} onExit={() => setCurrentView('feed')} />;

  const pickedRows = picks.map(id => rows.find(r => r.id === id)).filter(Boolean);

  return (
    <div className="bd">
      <header className="bd-top">
        <div className="bd-brand">
          <span className="bd-badge">🔐 Internal</span>
          <h1>Builder Desk</h1>
          <span className="bd-sub">Inventory console</span>
        </div>
        <div className="bd-top-actions">
          <button className="bd-ghost" onClick={() => setCurrentView('feed')}>← Exit to site</button>
          <button className="bd-ghost" onClick={lock}>Lock</button>
        </div>
      </header>

      {stats && (
        <div className="bd-stats">
          <div><i>🏙️</i><div><span>Matching</span><strong>{stats.count}</strong></div></div>
          <div><i>💰</i><div><span>Portfolio value</span><strong>{inrShort(stats.total)}</strong></div></div>
          <div><i>📊</i><div><span>Avg price</span><strong>{inrShort(stats.avg)}</strong></div></div>
          <div><i>📐</i><div><span>Avg ₹/sq.ft</span><strong>{stats.avgPpsf ? `₹${Math.round(stats.avgPpsf).toLocaleString('en-IN')}` : '—'}</strong></div></div>
          <div><i>📈</i><div><span>Range</span><strong>{inrShort(stats.min)} – {inrShort(stats.max)}</strong></div></div>
        </div>
      )}

      <div className="bd-filters">
        <input className="bd-search" placeholder="🔍 Search title, locality or builder…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={fBuilder} onChange={e => setFBuilder(e.target.value)}>
          <option value="">All builders</option>
          {builders.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={fCity} onChange={e => setFCity(e.target.value)}>
          <option value="">All locations</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fType} onChange={e => setFType(e.target.value)}>
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{cap(t)}</option>)}
        </select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="For Sale">For Sale</option>
          <option value="For Rent">For Rent</option>
        </select>
        <input className="bd-price" type="number" placeholder="Min ₹" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
        <input className="bd-price" type="number" placeholder="Max ₹" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="price_desc">Price high→low</option>
          <option value="price_asc">Price low→high</option>
          <option value="ppsf_asc">₹/sq.ft low→high</option>
          <option value="ppsf_desc">₹/sq.ft high→low</option>
          <option value="area_desc">Largest area</option>
        </select>
        <button className="bd-reset" onClick={resetFilters}>Reset</button>
      </div>

      <div className="bd-brackets">
        {PRICE_BRACKETS.map(b => {
          const active = String(b.min) === String(priceMin) && String(b.max) === String(priceMax);
          return (
            <button
              key={b.label}
              className={`bd-bracket ${active ? 'active' : ''}`}
              onClick={() => {
                if (active) { setPriceMin(''); setPriceMax(''); }
                else { setPriceMin(String(b.min)); setPriceMax(b.max === '' ? '' : String(b.max)); }
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      <div className="bd-resultsbar">
        <div className="bd-results-left">
          <strong>{filtered.length}</strong> of {rows.length} properties
          {activeFilters.length > 0 && (
            <span className="bd-active-filters">
              {activeFilters.map((f, i) => <span key={i} className="bd-fchip">{f}</span>)}
              <button className="bd-clear-link" onClick={resetFilters}>Clear all</button>
            </span>
          )}
        </div>
        <div className="bd-results-right">
          <div className="bd-viewtoggle" role="group" aria-label="View mode">
            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="Grid view">▦ Grid</button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} title="List view">☰ List</button>
          </div>
          <button className="bd-export" onClick={exportCSV} disabled={!filtered.length}>⭳ Export CSV</button>
        </div>
      </div>

      {filtered.length === 0 && <div className="bd-empty">No properties match these filters.</div>}

      {view === 'grid' ? (
        <div className="bd-grid">
          {filtered.map(r => {
            const checked = picks.includes(r.id);
            const disabled = !checked && picks.length >= MAX_COMPARE;
            return (
              <div key={r.id} className={`bd-card ${checked ? 'sel' : ''}`}>
                <div className="bd-card-media">
                  <img src={r.image} alt="" loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                  <span className={`bd-pill ${/rent/i.test(r.status || '') ? 'rent' : 'sale'}`}>{statusLabel(r.status)}</span>
                  {r.id === bestValueId && <span className="bd-bestval">★ Best value</span>}
                  <label className={`bd-card-check ${disabled ? 'disabled' : ''}`} title={disabled ? `Max ${MAX_COMPARE} to compare` : 'Add to compare'}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => togglePick(r.id)} />
                    <span>Compare</span>
                  </label>
                </div>
                <div className="bd-card-body">
                  <div className="bd-card-price">{inrShort(r.price)}</div>
                  <h3 className="bd-card-title">{r.title}</h3>
                  <div className="bd-card-loc">📍 {r.location}</div>
                  <div className="bd-card-tags">
                    <span>{r.builder}</span>
                    <span>{cap(r.type)}</span>
                    {r.possession && <span>{r.possession}</span>}
                  </div>
                  <div className="bd-card-specs">
                    <div><span>Config</span><strong>{r.beds ? `${r.beds} BHK` : '—'}</strong></div>
                    <div><span>Area</span><strong>{r.sqft ? Number(r.sqft).toLocaleString('en-IN') : '—'}</strong></div>
                    <div><span>₹/sq.ft</span><strong>{r.ppsf ? `₹${r.ppsf.toLocaleString('en-IN')}` : '—'}</strong></div>
                  </div>
                  <button className="bd-view bd-card-view" onClick={() => openProperty(r.id)}>View details</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bd-list">
          {filtered.map(r => {
            const checked = picks.includes(r.id);
            const disabled = !checked && picks.length >= MAX_COMPARE;
            return (
              <div key={r.id} className={`bd-row ${checked ? 'sel' : ''}`}>
                <input type="checkbox" className="bd-row-chk" checked={checked} disabled={disabled} onChange={() => togglePick(r.id)} title={disabled ? `Max ${MAX_COMPARE} to compare` : 'Add to compare'} />
                <img src={r.image} alt="" loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                <div className="bd-row-main">
                  <span className="bd-row-title">{r.title}{r.id === bestValueId && <span className="bd-bestval inline">★ Best value</span>}</span>
                  <span className="bd-row-loc">📍 {r.location}</span>
                </div>
                <span className="bd-row-col">{r.builder}</span>
                <span className="bd-row-col">{r.beds ? `${r.beds} BHK` : '—'}</span>
                <span className="bd-row-col">{r.sqft ? `${Number(r.sqft).toLocaleString('en-IN')} sq.ft` : '—'}</span>
                <span className="bd-row-col">{r.ppsf ? `₹${r.ppsf.toLocaleString('en-IN')}/ft` : '—'}</span>
                <span className="bd-row-price">{inrShort(r.price)}</span>
                <button className="bd-view" onClick={() => openProperty(r.id)}>View</button>
              </div>
            );
          })}
        </div>
      )}

      {picks.length > 0 && (
        <div className="bd-comparebar">
          <span>{picks.length} selected {picks.length === 1 ? '' : `(max ${MAX_COMPARE})`}</span>
          <div>
            <button className="bd-ghost" onClick={() => { setPicks([]); setShowCompare(false); }}>Clear</button>
            <button className="bd-primary" disabled={picks.length < 2} onClick={() => setShowCompare(s => !s)}>
              {showCompare ? 'Hide comparison' : `Compare ${picks.length}`}
            </button>
          </div>
        </div>
      )}

      {showCompare && pickedRows.length >= 2 && (
        <CompareTable rows={pickedRows} onRemove={togglePick} onView={openProperty} />
      )}
    </div>
  );
}

// ── Inline side-by-side comparison ───────────────────────────────────────────
function CompareTable({ rows, onRemove, onView }) {
  const SPECS = [
    { label: 'Price', get: r => inrShort(r.price), best: 'min', val: r => r.price },
    { label: '₹/sq.ft', get: r => (r.ppsf ? `₹${r.ppsf.toLocaleString('en-IN')}` : '—'), best: 'min', val: r => r.ppsf },
    { label: 'Configuration', get: r => (r.beds ? `${r.beds} BHK` : '—') },
    { label: 'Built-up area', get: r => (r.sqft ? `${Number(r.sqft).toLocaleString('en-IN')} sq.ft` : '—'), best: 'max', val: r => r.sqft },
    { label: 'Bathrooms', get: r => r.baths || '—' },
    { label: 'Type', get: r => cap(r.type) },
    { label: 'Status', get: r => statusLabel(r.status) },
    { label: 'Furnishing', get: r => r.furnishing || '—' },
    { label: 'Builder', get: r => r.builder || '—' },
    { label: 'Location', get: r => r.location || '—' },
    { label: 'Possession', get: r => r.possession || '—' },
    { label: 'Est. EMI', get: r => (r.emi ? `${inrShort(r.emi)}/mo` : '—'), best: 'min', val: r => r.emi },
  ];
  const winners = {};
  SPECS.forEach((s, i) => {
    if (!s.best) return;
    const vals = rows.map(r => ({ id: r.id, v: s.val(r) })).filter(x => x.v != null);
    if (vals.length < 2) return;
    winners[i] = vals.reduce((a, b) => (s.best === 'min' ? (b.v < a.v ? b : a) : (b.v > a.v ? b : a))).id;
  });

  return (
    <div className="bd-cmp">
      <h2>Side-by-side comparison</h2>
      <div className="bd-cmp-scroll">
        <table className="bd-cmp-table" style={{ '--cols': rows.length }}>
          <thead>
            <tr>
              <th className="corner"></th>
              {rows.map(r => (
                <th key={r.id}>
                  <button className="bd-cmp-x" onClick={() => onRemove(r.id)} title="Remove">✕</button>
                  <img src={r.image} alt="" loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                  <span className="bd-cmp-price">{inrShort(r.price)}</span>
                  <span className="bd-cmp-title">{r.title}</span>
                  <button className="bd-view" onClick={() => onView(r.id)}>View</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPECS.map((s, i) => (
              <tr key={s.label}>
                <td className="bd-cmp-label">{s.label}</td>
                {rows.map(r => (
                  <td key={r.id} className={winners[i] === r.id ? 'win' : ''}>
                    {s.get(r)}{winners[i] === r.id && <span className="bd-cmp-best">Best</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
