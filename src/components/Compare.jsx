import { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { setSeo, origin } from '../utils/seo';

const inrShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '—');
const statusLabel = (s) => (/rent/i.test(s || '') ? 'For Rent' : /sale/i.test(s || '') ? 'For Sale' : (s || '—'));
const AMEN_LABELS = { pool: 'Swimming Pool', gym: 'Gym', parking: 'Parking', security: 'Security', garden: 'Garden', smartHome: 'Smart Home', powerBackup: 'Power Backup', lift: 'Lift', clubhouse: 'Clubhouse' };
const amenLabel = (a) => AMEN_LABELS[a] || (typeof a === 'string' ? a.charAt(0).toUpperCase() + a.slice(1) : a);

// Normalise a property across the static seed & Supabase-mapped shapes
const norm = (p) => {
  const sqft = p.sqft ?? p.area;
  return {
    id: p.id, title: p.title, location: p.location || '',
    image: (p.images && p.images[0]) || (p.media && p.media[0]) || p.image,
    price: p.price, beds: p.beds ?? p.bedrooms, baths: p.baths ?? p.bathrooms, sqft,
    type: p.type, status: p.status, furnishing: p.furnishing, builder: p.builder,
    possession: p.possessionDate || p.possession || p.possessionStatus,
    emi: p.emiEstimate,
    ppsf: p.pricePerSqft || (p.price && sqft ? Math.round(p.price / sqft) : null),
    amenities: (p.amenities || []).map(amenLabel),
  };
};

export default function Compare() {
  const { compareIds, toggleCompare, setCompareIds, allProperties, openProperty, setCurrentView, setActiveModal } = useApp();

  useEffect(() => {
    setSeo({ title: 'Compare Properties | PropertyInsta', description: 'Compare shortlisted properties side by side — price, area, configuration, EMI, locality & amenities.', canonical: origin() + '/compare' });
  }, []);

  const items = useMemo(() => compareIds.map(id => allProperties.find(p => p.id === id)).filter(Boolean).map(norm), [compareIds, allProperties]);

  const SPECS = [
    { label: 'Price', get: p => inrShort(p.price), best: 'min', val: p => p.price },
    { label: 'Price / sq.ft', get: p => (p.ppsf ? `₹${p.ppsf.toLocaleString('en-IN')}` : '—'), best: 'min', val: p => p.ppsf },
    { label: 'Configuration', get: p => `${p.beds || '—'} BHK` },
    { label: 'Built-up Area', get: p => (p.sqft ? `${Number(p.sqft).toLocaleString('en-IN')} sq.ft` : '—'), best: 'max', val: p => p.sqft },
    { label: 'Bathrooms', get: p => p.baths || '—' },
    { label: 'Type', get: p => cap(p.type) },
    { label: 'Status', get: p => statusLabel(p.status) },
    { label: 'Furnishing', get: p => p.furnishing || '—' },
    { label: 'Locality', get: p => p.location || '—' },
    { label: 'Builder', get: p => p.builder || '—' },
    { label: 'Possession', get: p => p.possession || '—' },
    { label: 'Est. EMI', get: p => (p.emi ? `${inrShort(p.emi)}/mo` : '—'), best: 'min', val: p => p.emi },
  ];

  // Winner id per "best" row
  const winners = useMemo(() => {
    const w = {};
    SPECS.forEach((s, i) => {
      if (!s.best) return;
      const vals = items.map(p => ({ id: p.id, v: s.val(p) })).filter(x => x.v != null);
      if (vals.length < 2) return;
      const win = vals.reduce((a, b) => (s.best === 'min' ? (b.v < a.v ? b : a) : (b.v > a.v ? b : a)));
      w[i] = win.id;
    });
    return w;
  }, [items]);

  const allAmenities = useMemo(() => Array.from(new Set(items.flatMap(p => p.amenities))).sort(), [items]);
  const canAdd = items.length < 3;

  if (items.length === 0) {
    return (
      <div className="ig-bwu ig-cmp">
        <div className="ig-bwu-hero"><span className="ig-bwu-eyebrow">⚖️ Compare</span><h1>Compare properties side by side</h1><p>Add up to 3 homes to your shortlist, then compare price, area, EMI, locality &amp; amenities at a glance.</p></div>
        <div className="ig-cmp-empty">
          <div className="ig-cmp-empty-ico">⚖️</div>
          <h3>Nothing to compare yet</h3>
          <p>Tap the ⚖️ button on any property to add it to your comparison (up to 3).</p>
          <button className="ig-bwu-quote" onClick={() => setCurrentView('feed')}>Browse listings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ig-bwu ig-cmp">
      <div className="ig-cmp-head">
        <div><span className="ig-bwu-eyebrow">⚖️ Compare</span><h1>Comparing {items.length} {items.length === 1 ? 'property' : 'properties'}</h1></div>
        <button className="ig-cmp-clear" onClick={() => setCompareIds([])}>Clear all</button>
      </div>

      <div className="ig-cmp-scroll">
        <table className="ig-cmp-table" style={{ '--cols': items.length + (canAdd ? 1 : 0) }}>
          <thead>
            <tr>
              <th className="ig-cmp-corner"></th>
              {items.map(p => (
                <th key={p.id} className="ig-cmp-prop">
                  <button className="ig-cmp-remove" onClick={() => toggleCompare(p.id)} title="Remove">✕</button>
                  <button className="ig-cmp-propcard" onClick={() => openProperty(p.id)}>
                    <img src={p.image} alt={p.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                    <span className="ig-cmp-price">{inrShort(p.price)}</span>
                    <span className="ig-cmp-title">{p.title}</span>
                    <span className="ig-cmp-loc">📍 {p.location}</span>
                  </button>
                  <div className="ig-cmp-cta">
                    <button className="ig-cmp-btn primary" onClick={() => openProperty(p.id)}>View</button>
                    <button className="ig-cmp-btn" onClick={() => setActiveModal({ type: 'lead', data: { propertyId: p.id, intent: 'contact' } })}>Enquire</button>
                  </div>
                </th>
              ))}
              {canAdd && (
                <th className="ig-cmp-prop ig-cmp-add">
                  <button className="ig-cmp-addbtn" onClick={() => setCurrentView('feed')}><span>＋</span>Add property</button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {SPECS.map((s, i) => (
              <tr key={s.label}>
                <td className="ig-cmp-label">{s.label}</td>
                {items.map(p => (
                  <td key={p.id} className={winners[i] === p.id ? 'ig-cmp-win' : ''}>
                    {s.get(p)}
                    {winners[i] === p.id && <span className="ig-cmp-badge">Best</span>}
                  </td>
                ))}
                {canAdd && <td className="ig-cmp-muted">—</td>}
              </tr>
            ))}

            {allAmenities.length > 0 && (
              <>
                <tr className="ig-cmp-section-row"><td colSpan={items.length + (canAdd ? 2 : 1)}>Amenities</td></tr>
                {allAmenities.map(a => (
                  <tr key={a}>
                    <td className="ig-cmp-label">{a}</td>
                    {items.map(p => (
                      <td key={p.id} className={p.amenities.includes(a) ? 'ig-cmp-yes' : 'ig-cmp-no'}>
                        {p.amenities.includes(a) ? '✓' : '—'}
                      </td>
                    ))}
                    {canAdd && <td className="ig-cmp-muted">—</td>}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
