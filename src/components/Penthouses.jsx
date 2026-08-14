import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import PropertyCard from './PropertyCard';
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

export default function Penthouses() {
  const { allProperties, setCurrentView } = useApp();
  const [sort, setSort] = useState('price_desc');

  const penthouses = useMemo(() => {
    const list = allProperties.filter(isPenthouse);
    const sorted = [...list];
    if (sort === 'price_desc') sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'price_asc') sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'area_desc') sorted.sort((a, b) => (b.area || b.sqft || 0) - (a.area || a.sqft || 0));
    // Curated (pinned) real-photo homes always lead within the chosen sort.
    sorted.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return sorted;
  }, [allProperties, sort]);

  const stats = useMemo(() => {
    if (!penthouses.length) return null;
    const prices = penthouses.map(p => p.price || 0).filter(Boolean);
    const areas = penthouses.map(p => p.area || p.sqft || 0).filter(Boolean);
    const ppsf = penthouses.map(p => p.pricePerSqft || (p.area ? Math.round(p.price / p.area) : 0)).filter(Boolean);
    return {
      count: penthouses.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      maxArea: areas.length ? Math.max(...areas) : 0,
      avgPpsf: ppsf.length ? Math.round(ppsf.reduce((a, b) => a + b, 0) / ppsf.length) : 0,
    };
  }, [penthouses]);

  useEffect(() => {
    setSeo({
      title: 'Luxury Penthouses in Gurgaon — Sky Homes & Duplex Residences',
      description: 'Explore Gurgaon\'s most exclusive penthouses and duplex sky homes — private terraces, plunge pools, panoramic views and branded residences from the city\'s top developers.',
      canonical: origin() + '/penthouses',
      keywords: 'penthouses Gurgaon, luxury penthouse, duplex penthouse, sky homes, Golf Course Road penthouse, branded residences',
    });
    setJsonLd('ld-penthouses', { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'PropertyInsta Penthouses', url: origin() + '/penthouses' });
  }, []);

  return (
    <div className="ig-penthouse">
      {/* Hero */}
      <header className="ig-ph-hero">
        <div className="ig-ph-hero-inner">
          <span className="ig-ph-eyebrow">★ The Penthouse Collection</span>
          <h1>Life, at the top.</h1>
          <p>Gurgaon&rsquo;s most exclusive sky homes — private terraces, plunge pools, panoramic skylines and branded residences, curated from the city&rsquo;s finest developers.</p>
          {stats && (
            <div className="ig-ph-stats">
              <div className="ig-ph-stat">
                <strong>{stats.count}</strong>
                <span>Penthouses</span>
              </div>
              <div className="ig-ph-stat">
                <strong>{crShort(stats.min)}<em> – </em>{crShort(stats.max)}</strong>
                <span>Price range</span>
              </div>
              <div className="ig-ph-stat">
                <strong>{stats.maxArea.toLocaleString('en-IN')}</strong>
                <span>Largest (sq.ft)</span>
              </div>
              <div className="ig-ph-stat">
                <strong>₹{stats.avgPpsf.toLocaleString('en-IN')}</strong>
                <span>Avg / sq.ft</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <div className="ig-ph-toolbar">
        <h2>{penthouses.length} Penthouse{penthouses.length === 1 ? '' : 's'} available</h2>
        <label className="ig-ph-sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="price_desc">Price high → low</option>
            <option value="price_asc">Price low → high</option>
            <option value="area_desc">Largest first</option>
          </select>
        </label>
      </div>

      {/* Grid */}
      {penthouses.length ? (
        <div className="ig-feed-grid ig-ph-grid">
          {penthouses.map(p => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="ig-ph-empty">
          <p>No penthouses are listed right now. Explore our full inventory instead.</p>
          <button onClick={() => setCurrentView('feed')}>Browse all properties →</button>
        </div>
      )}

      {/* Footer CTA */}
      <section className="ig-ph-cta">
        <h3>Looking for something even more private?</h3>
        <p>Tell us your floor, view and budget — we&rsquo;ll match you to off-market penthouses and duplex sky homes.</p>
        <button onClick={() => setCurrentView('ai-finder')}>Find my penthouse with AI →</button>
      </section>
    </div>
  );
}
