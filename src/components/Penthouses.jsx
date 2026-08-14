import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import { setSeo, setJsonLd, origin } from '../utils/seo';

// A penthouse is either explicitly typed, or a top-tier residence whose title
// / description calls it a penthouse or duplex sky home.
const isPenthouse = (p) => {
  const t = (p.type || '').toLowerCase();
  const hay = `${p.title || ''} ${p.description || ''}`.toLowerCase();
  return t === 'penthouse' || /penthouse|duplex|sky\s*villa|sky\s*home/.test(hay);
};

const crShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const imgOf = (p) => (p.media && p.media[0]) || (p.images && p.images[0]) || '';
const bedsOf = (p) => p.bedrooms || p.beds || null;
const areaOf = (p) => p.area || p.sqft || null;
const cleanTitle = (t = '') => t.replace(/\s*[–-]\s*\d.*$/, '').trim() || t;

export default function Penthouses() {
  const { allProperties, openProperty, setCurrentView } = useApp();
  const [sort, setSort] = useState('price_desc');

  const penthouses = useMemo(() => {
    const list = allProperties.filter(isPenthouse);
    const sorted = [...list];
    if (sort === 'price_desc') sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'price_asc') sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'area_desc') sorted.sort((a, b) => (areaOf(b) || 0) - (areaOf(a) || 0));
    sorted.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return sorted;
  }, [allProperties, sort]);

  const featured = penthouses[0] || null;
  const rest = featured ? penthouses.slice(1) : penthouses;

  const stats = useMemo(() => {
    if (!penthouses.length) return null;
    const prices = penthouses.map(p => p.price || 0).filter(Boolean);
    const areas = penthouses.map(areaOf).filter(Boolean);
    const ppsf = penthouses.map(p => p.pricePerSqft || (areaOf(p) ? Math.round(p.price / areaOf(p)) : 0)).filter(Boolean);
    return {
      count: penthouses.length,
      min: Math.min(...prices), max: Math.max(...prices),
      maxArea: areas.length ? Math.max(...areas) : 0,
      avgPpsf: ppsf.length ? Math.round(ppsf.reduce((a, b) => a + b, 0) / ppsf.length) : 0,
    };
  }, [penthouses]);

  useEffect(() => {
    setSeo({
      title: 'Luxury Penthouses in Gurgaon — Sky Homes & Duplex Residences',
      description: 'The Penthouse Collection — Gurgaon\'s most exclusive sky homes, duplex residences and branded penthouses with private terraces, plunge pools and panoramic views.',
      canonical: origin() + '/penthouses',
      keywords: 'penthouses Gurgaon, luxury penthouse, duplex penthouse, sky homes, branded residences',
    });
    setJsonLd('ld-penthouses', { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'PropertyInsta Penthouses', url: origin() + '/penthouses' });
  }, []);

  return (
    <div className="ph-lux" data-theme="dark">
      {/* ───────── Cinematic hero ───────── */}
      <header className="ph-hero">
        {featured && <div className="ph-hero-bg" style={{ backgroundImage: `url(${imgOf(featured)})` }} aria-hidden="true" />}
        <div className="ph-hero-veil" aria-hidden="true" />
        <div className="ph-hero-content">
          <span className="ph-kicker"><i /> The Penthouse Collection <i /></span>
          <h1 className="ph-title">Life, at the&nbsp;<span>summit</span>.</h1>
          <p className="ph-lede">
            A private register of Gurgaon&rsquo;s highest homes — duplex sky residences, branded penthouses,
            plunge-pool terraces and skylines that belong to a chosen few.
          </p>
          {stats && (
            <div className="ph-metrics">
              <div><b>{String(stats.count).padStart(2, '0')}</b><span>Residences</span></div>
              <em />
              <div><b>{crShort(stats.min)} – {crShort(stats.max)}</b><span>Ticket size</span></div>
              <em />
              <div><b>{stats.maxArea.toLocaleString('en-IN')}</b><span>Largest sq.ft</span></div>
              <em />
              <div><b>₹{stats.avgPpsf.toLocaleString('en-IN')}</b><span>Avg / sq.ft</span></div>
            </div>
          )}
        </div>
        <div className="ph-scroll-hint" aria-hidden="true"><span /></div>
      </header>

      {/* ───────── Featured residence ───────── */}
      {featured && (
        <section className="ph-feature" onClick={() => openProperty(featured.id)}>
          <div className="ph-feature-media">
            <img src={imgOf(featured)} alt={featured.title} loading="lazy" />
            <span className="ph-feature-flag">★ Flagship Residence</span>
          </div>
          <div className="ph-feature-body">
            <span className="ph-eyebrow">{featured.location}</span>
            <h2>{cleanTitle(featured.title)}</h2>
            <p className="ph-feature-desc">{(featured.description || '').slice(0, 240)}…</p>
            <div className="ph-feature-specs">
              {bedsOf(featured) && <span>{bedsOf(featured)} BHK</span>}
              {areaOf(featured) && <span>{areaOf(featured).toLocaleString('en-IN')} sq.ft</span>}
              {featured.builder && <span>{featured.builder}</span>}
            </div>
            <div className="ph-feature-foot">
              <div className="ph-price"><small>from</small> {formatPriceIndian(featured.price)}</div>
              <button className="ph-cta-line" onClick={(e) => { e.stopPropagation(); openProperty(featured.id); }}>
                View the residence <i>→</i>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ───────── Collection toolbar ───────── */}
      <div className="ph-bar">
        <div className="ph-bar-head">
          <span className="ph-bar-line" />
          <h3>The Collection</h3>
          <span className="ph-bar-count">{penthouses.length} residences</span>
        </div>
        <label className="ph-sort">
          <span>Order by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="price_desc">Price · high to low</option>
            <option value="price_asc">Price · low to high</option>
            <option value="area_desc">Grandest first</option>
          </select>
        </label>
      </div>

      {/* ───────── Editorial numbered grid ───────── */}
      {penthouses.length ? (
        <div className="ph-grid">
          {rest.map((p, i) => (
            <article
              key={p.id}
              className={`ph-card${p.pinned ? ' is-pinned' : ''}`}
              style={{ '--d': `${i * 60}ms` }}
              onClick={() => openProperty(p.id)}
            >
              <div className="ph-card-media">
                <img src={imgOf(p)} alt={p.title} loading="lazy" />
                <span className="ph-card-index">{String(i + 2).padStart(2, '0')}</span>
                {p.pinned && <span className="ph-card-tag">★ Featured</span>}
                <div className="ph-card-price">{formatPriceIndian(p.price)}</div>
              </div>
              <div className="ph-card-body">
                <span className="ph-card-loc">{p.location}</span>
                <h4>{cleanTitle(p.title)}</h4>
                <div className="ph-card-specs">
                  {bedsOf(p) && <span>{bedsOf(p)} BHK</span>}
                  {areaOf(p) && <span>{areaOf(p).toLocaleString('en-IN')} sq.ft</span>}
                  {p.pricePerSqft && <span>₹{Number(p.pricePerSqft).toLocaleString('en-IN')}/sq.ft</span>}
                </div>
                <span className="ph-card-view">View residence <i>→</i></span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ph-empty">
          <p>The collection is being curated. Explore our full inventory in the meantime.</p>
          <button onClick={() => setCurrentView('feed')}>Browse all properties →</button>
        </div>
      )}

      {/* ───────── Concierge CTA ───────── */}
      <section className="ph-concierge">
        <span className="ph-kicker"><i /> Private Concierge <i /></span>
        <h3>Some homes are never listed.</h3>
        <p>Share your floor, your view and your budget. We&rsquo;ll open doors to off-market penthouses and duplex sky homes reserved for serious buyers.</p>
        <button onClick={() => setCurrentView('ai-finder')}>Request private access <i>→</i></button>
      </section>
    </div>
  );
}
