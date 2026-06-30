import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { localities } from '../data';
import { setSeo, setJsonLd, origin } from '../utils/seo';

const inrSqft = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const inrShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const scoreColor = (s) => (s >= 8.5 ? '#059669' : s >= 7 ? '#2563eb' : s >= 5 ? '#d97706' : '#dc2626');

export default function Localities() {
  const { allProperties, openProperty } = useApp();
  const [selectedId, setSelectedId] = useState(null);

  const selected = localities.find(l => l.id === selectedId) || null;

  useEffect(() => {
    setSeo({
      title: selected ? `${selected.name} — Locality Insights` : 'Locality Insights — Gurgaon Neighbourhood Guides',
      description: selected ? `${selected.name}: avg ₹${selected.avgPrice}/sq.ft, ${selected.priceTrend}% YoY, livability ${selected.livability}/10. Connectivity, schools, hospitals & projects.` : 'Compare Gurgaon localities — price trends, connectivity, schools, hospitals, livability scores and the projects available in each area.',
      canonical: origin() + '/localities',
      keywords: 'Gurgaon localities, price trends, neighbourhood guide, Golf Course Road, Sohna Road, livability',
    });
    setJsonLd('ld-localities', { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'PropertyInsta Locality Insights', url: origin() + '/localities' });
  }, [selected]);

  const projectsFor = (loc) => allProperties.filter(p =>
    (loc.match || []).some(k => (p.location || '').toLowerCase().includes(k.toLowerCase())));

  // ── List view ──
  if (!selected) {
    return (
      <div className="ig-bwu ig-loc">
        <div className="ig-bwu-hero">
          <span className="ig-bwu-eyebrow">📍 Locality Insights</span>
          <h1>Know the neighbourhood before you buy</h1>
          <p>Compare Gurgaon micro-markets on price trends, connectivity, social infrastructure & livability — then see the projects available in each.</p>
        </div>
        <div className="ig-loc-grid">
          {localities.map(loc => {
            const count = projectsFor(loc).length;
            return (
              <button key={loc.id} className="ig-loc-card" onClick={() => { setSelectedId(loc.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}>
                <div className="ig-loc-card-img">
                  <img src={loc.image} alt={loc.name} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                  <span className="ig-loc-score" style={{ background: scoreColor(loc.livability) }}>{loc.livability.toFixed(1)}</span>
                </div>
                <div className="ig-loc-card-body">
                  <h3>{loc.name}</h3>
                  <p className="ig-loc-tagline">{loc.tagline}</p>
                  <div className="ig-loc-card-stats">
                    <div><span>Avg price</span><strong>{inrSqft(loc.avgPrice)}<small>/sq.ft</small></strong></div>
                    <div><span>1-yr trend</span><strong className="up">▲ {loc.priceTrend}%</strong></div>
                  </div>
                  <div className="ig-loc-card-foot">
                    <span className="ig-loc-projects">{count} project{count === 1 ? '' : 's'}</span>
                    <span className="ig-loc-explore">Explore →</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Detail view ──
  const loc = selected;
  const projects = projectsFor(loc).slice(0, 6);
  const histPrices = loc.priceHistory.map(h => h.price);
  const maxHist = Math.max(...histPrices);
  const minHist = Math.min(...histPrices);
  // Amplify the trend: smallest bar ~38%, largest 100% (keeps growth visually obvious)
  const barHeight = (p) => (maxHist === minHist ? 100 : Math.round(38 + 62 * ((p - minHist) / (maxHist - minHist))));

  return (
    <div className="ig-bwu ig-loc ig-loc-detail">
      <button className="ig-loc-back" onClick={() => { setSelectedId(null); window.scrollTo({ top: 0, behavior: 'instant' }); }}>← All localities</button>

      <div className="ig-loc-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.72)), url(${loc.image})` }}>
        <div className="ig-loc-hero-body">
          <span className="ig-loc-hero-city">📍 {loc.city}</span>
          <h1>{loc.name}</h1>
          <p>{loc.tagline}</p>
        </div>
        <div className="ig-loc-hero-score" style={{ borderColor: scoreColor(loc.livability) }}>
          <strong style={{ color: scoreColor(loc.livability) }}>{loc.livability.toFixed(1)}</strong>
          <span>Livability</span>
        </div>
      </div>

      <div className="ig-loc-keystats">
        <div><span>Avg Price</span><strong>{inrSqft(loc.avgPrice)}<small>/sq.ft</small></strong></div>
        <div><span>1-yr Price Trend</span><strong className="up">▲ {loc.priceTrend}%</strong></div>
        <div><span>Rental Yield</span><strong>{loc.rentalYield}%</strong></div>
        <div><span>Projects Listed</span><strong>{projectsFor(loc).length}</strong></div>
      </div>

      <div className="ig-loc-cols">
        {/* Price trend chart */}
        <section className="ig-loc-panel">
          <h2>Price trend (₹/sq.ft)</h2>
          <div className="ig-loc-chart">
            {loc.priceHistory.map(h => (
              <div key={h.year} className="ig-loc-bar-wrap">
                <span className="ig-loc-bar-val">{(h.price / 1000).toFixed(1)}k</span>
                <div className="ig-loc-bar" style={{ height: `${barHeight(h.price)}%` }} />
                <span className="ig-loc-bar-year">{h.year}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Livability breakdown */}
        <section className="ig-loc-panel">
          <h2>Livability breakdown</h2>
          <div className="ig-loc-scores">
            {Object.entries(loc.scores).map(([k, v]) => (
              <div key={k} className="ig-loc-score-row">
                <span className="ig-loc-score-label">{k}</span>
                <div className="ig-loc-score-bar"><span style={{ width: `${v * 10}%`, background: scoreColor(v) }} /></div>
                <span className="ig-loc-score-num">{v}/10</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Connectivity */}
      <section className="ig-loc-panel">
        <h2>Connectivity</h2>
        <div className="ig-loc-connect">
          <div><span className="ig-loc-connect-ico">🚇</span><div><strong>Metro</strong><span>{loc.connectivity.metro}</span></div></div>
          <div><span className="ig-loc-connect-ico">🛣️</span><div><strong>Road / Highway</strong><span>{loc.connectivity.highway}</span></div></div>
          <div><span className="ig-loc-connect-ico">✈️</span><div><strong>Airport</strong><span>{loc.connectivity.airport}</span></div></div>
        </div>
      </section>

      {/* Social infrastructure */}
      <div className="ig-loc-cols">
        <InfraList title="🎓 Schools" items={loc.schools} />
        <InfraList title="🏥 Hospitals" items={loc.hospitals} />
        <InfraList title="🛍️ Malls & Retail" items={loc.malls} />
      </div>

      {/* Pros / cons */}
      <div className="ig-loc-cols">
        <section className="ig-loc-panel">
          <h2 className="good">Why buy here</h2>
          <ul className="ig-loc-points">{loc.highlights.map((h, i) => <li key={i}><span className="tick">✓</span>{h}</li>)}</ul>
        </section>
        <section className="ig-loc-panel">
          <h2 className="warn">Watch-outs</h2>
          <ul className="ig-loc-points">{loc.watchouts.map((w, i) => <li key={i}><span className="cross">!</span>{w}</li>)}</ul>
        </section>
      </div>

      {/* Projects available */}
      <section className="ig-loc-panel">
        <h2>Projects in {loc.name} {projectsFor(loc).length > 0 && <span className="ig-loc-count">{projectsFor(loc).length}</span>}</h2>
        {projects.length === 0 ? (
          <p className="ig-loc-empty">No listed projects matched here yet — check back soon.</p>
        ) : (
          <div className="ig-loc-projects-grid">
            {projects.map(p => (
              <button key={p.id} className="ig-loc-proj" onClick={() => openProperty(p.id)}>
                <img src={(p.images && p.images[0]) || p.image} alt={p.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                <div className="ig-loc-proj-body">
                  <strong>{inrShort(p.price)}</strong>
                  <span className="ig-loc-proj-title">{p.title}</span>
                  <span className="ig-loc-proj-loc">📍 {p.location}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfraList({ title, items }) {
  return (
    <section className="ig-loc-panel">
      <h2>{title}</h2>
      <ul className="ig-loc-infra">{(items || []).map((it, i) => <li key={i}>{it}</li>)}</ul>
    </section>
  );
}
