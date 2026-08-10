import { useState, useMemo } from 'react';
import { useApp, deriveCity } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import PropertyCard from './PropertyCard';

// =============================================================================
// BuilderView — dedicated profile page for a single developer.
// Renders when `currentView === 'builder'` (selectedBuilder set via openBuilder).
// =============================================================================

// Real-domain → logo CDN. Mirrors the map in FeedView so logos stay consistent.
const logodev = (d) => `https://img.logo.dev/${d}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=128&format=png&retina=true`;
const ddg = (d) => `https://icons.duckduckgo.com/ip3/${d}.ico`;

const DEVELOPER_DOMAINS = {
  'DLF Limited': 'dlf.in', 'Godrej Properties': 'godrejproperties.com',
  'M3M India': 'm3mindia.com', 'Emaar India': 'emaar.com',
  'Sobha Limited': 'sobha.com', 'Tata Housing': 'tatahousing.com',
  'Adani Realty': 'adani.com', 'Vatika Group': 'vatikagroup.com',
  'BPTP Limited': 'bptp.com', 'ATS Infrastructure': 'atsgreens.com',
  'Birla Estates': 'birlaestates.com', 'Smartworld Developers': 'smartworlddevelopers.com',
  'Hero Realty': 'heroreality.com', 'Paras Buildtech': 'parasbuildtech.com',
  'Elan Group': 'elangroup.in', 'Experion Developers': 'experion.co',
  'Trevoc Group': 'trevoc.com', 'Ganga Realty': 'gangarealty.com',
  'Anant Raj': 'anantrajlimited.com', 'SS Group': 'ssgroup-india.com',
  'Bestech Group': 'bestechgroup.com', 'AIPL': 'aipl.com',
  'Eldeco Group': 'eldecogroup.com', 'Mahindra Lifespaces': 'mahindralifespaces.com',
  'Krisumi Corporation': 'krisumi.com', 'Orris Infrastructure': 'orris.in',
  'Ashiana Housing': 'ashianahousing.com', 'Trehan Group': 'trehangroup.com',
  'JMS Group': 'jmsgroup.in', 'Imperia Structures': 'imperiastructures.com',
  'Pyramid Infratech': 'pyramidinfratech.com', 'Lion Infra Developers': 'lioninfra.com',
  'Spaze Group': 'spaze.in', 'Conscient Infrastructure': 'conscient.in',
  'Mapsko Group': 'mapsko.com', 'Omaxe Ltd': 'omaxe.com', 'Omaxe Limited': 'omaxe.com',
};
const LOGO_OVERRIDES = {
  'Signature Global': 'https://www.signatureglobal.in/images/fav_icon.svg',
  'Central Park': ddg('centralparkindia.com'),
  'Hero Realty': '/dev-logos/hero-realty.png',
  'JMS Group': '/dev-logos/jms-group.png',
};
function builderLogo(name) {
  if (LOGO_OVERRIDES[name]) return LOGO_OVERRIDES[name];
  const d = DEVELOPER_DOMAINS[name];
  return d ? logodev(d) : '';
}

// Reputation profiles (mirrors the table in TrustLayer)
const REPUTATION = {
  'DLF Limited': { score: 96, litigations: 0, established: 1946, tagline: 'India\'s largest real estate developer.' },
  'Godrej Properties': { score: 94, litigations: 1, established: 1990, tagline: 'Premium homes with a 125-year-old legacy of trust.' },
  'M3M India': { score: 88, litigations: 2, established: 2010, tagline: 'Magnificence in the Trinity of Men, Materials & Money.' },
  'Emaar India': { score: 91, litigations: 0, established: 2005, tagline: 'Iconic destinations, world-class living.' },
  'Signature Global': { score: 86, litigations: 3, established: 2014, tagline: 'India\'s leading affordable & mid-segment developer.' },
  'Sobha Limited': { score: 93, litigations: 1, established: 1995, tagline: 'Passion at work — premium construction quality.' },
  'Tata Housing': { score: 92, litigations: 0, established: 1984, tagline: 'Building homes the Tata way.' },
  'Mahindra Lifespaces': { score: 89, litigations: 1, established: 1994, tagline: 'Designing better cities.' },
  'Birla Estates': { score: 90, litigations: 0, established: 2016, tagline: 'Aditya Birla Group\'s premium real estate venture.' },
  'L&T Realty': { score: 91, litigations: 1, established: 2011, tagline: 'L&T\'s engineering precision in real estate.' },
  'Adani Realty': { score: 84, litigations: 4, established: 2010, tagline: 'Adani Group\'s real estate arm.' },
  'Omaxe Ltd': { score: 78, litigations: 6, established: 1989, tagline: 'Pan-India developer with 130+ projects.' },
  'Omaxe Limited': { score: 78, litigations: 6, established: 1989, tagline: 'Pan-India developer with 130+ projects.' },
  'Smartworld Developers': { score: 82, litigations: 2, established: 2018, tagline: 'Smart homes for the next-gen homebuyer.' },
  'BPTP Limited': { score: 75, litigations: 8, established: 2003, tagline: 'Building Pleasure Through Passion.' },
  'Central Park': { score: 84, litigations: 2, established: 2002, tagline: 'Resort-style luxury living in NCR.' },
  'Bestech Group': { score: 81, litigations: 3, established: 1996, tagline: 'Building more than trust.' },
  'ATS Infrastructure': { score: 83, litigations: 2, established: 1998, tagline: 'Sustainable communities in NCR & beyond.' },
  'TARC Group': { score: 86, litigations: 1, established: 2016, tagline: 'Crafting modern urban living.' },
  'Max Estates': { score: 88, litigations: 1, established: 2016, tagline: 'Max Group\'s commercial & residential venture.' },
  'Hero Realty': { score: 79, litigations: 3, established: 2010, tagline: 'Hero Enterprise\'s real estate division.' },
  'Paras Buildtech': { score: 77, litigations: 4, established: 2003, tagline: 'NCR-focused mid-segment developer.' },
  'Elan Group': { score: 80, litigations: 3, established: 2014, tagline: 'Iconic retail + residential developments.' },
  'Experion Developers': { score: 85, litigations: 2, established: 2008, tagline: 'Future-ready urban developments.' },
  'Trevoc Group': { score: 82, litigations: 1, established: 2018, tagline: 'Premium boutique living.' },
  'Ganga Realty': { score: 80, litigations: 2, established: 1995, tagline: 'Trusted NCR developer for affordable homes.' },
  'Anant Raj': { score: 78, litigations: 4, established: 1969, tagline: 'NCR\'s legacy real estate brand.' },
  'SS Group': { score: 76, litigations: 5, established: 1992, tagline: 'NCR\'s established mid-market developer.' },
  'AIPL': { score: 84, litigations: 2, established: 1991, tagline: 'Advance India Projects — commercial + residential.' },
  'Eldeco Group': { score: 81, litigations: 3, established: 1985, tagline: 'Lucknow + NCR specialist.' },
  'Krisumi Corporation': { score: 87, litigations: 1, established: 2014, tagline: 'Japanese-inspired luxury living.' },
  'Orris Infrastructure': { score: 74, litigations: 6, established: 2006, tagline: 'NCR-focused mass-market developer.' },
  'Ashiana Housing': { score: 83, litigations: 2, established: 1986, tagline: 'Specialists in senior living & affordable homes.' },
  'Trehan Group': { score: 76, litigations: 4, established: 1979, tagline: 'NCR\'s long-established developer.' },
  'JMS Group': { score: 77, litigations: 4, established: 2007, tagline: 'NCR commercial + residential builder.' },
  'Imperia Structures': { score: 68, litigations: 12, established: 2003, tagline: 'NCR mid-market developer.' },
  'Pyramid Infratech': { score: 75, litigations: 5, established: 2010, tagline: 'Affordable housing specialists.' },
  'Spaze Group': { score: 79, litigations: 3, established: 2002, tagline: 'NCR commercial real estate specialist.' },
  'Conscient Infrastructure': { score: 78, litigations: 3, established: 2006, tagline: 'Conscious development in NCR.' },
  'Mapsko Group': { score: 81, litigations: 3, established: 1976, tagline: 'Long-standing NCR developer.' },
  'Vatika Group': { score: 80, litigations: 4, established: 1986, tagline: 'NCR\'s integrated developer.' },
  'Whiteland Corporation': { score: 85, litigations: 2, established: 2017, tagline: 'Premium NCR developer.' },
  'Lion Infra Developers': { score: 72, litigations: 6, established: 2010, tagline: 'NCR mid-market developer.' },
};

function ScoreRing({ score, size = 88 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? '#0e9f6e' : score >= 70 ? '#ea6a0c' : '#dc2626';
  return (
    <svg width={size} height={size} className="pi-builder-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 6} textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">{score}</text>
    </svg>
  );
}

export default function BuilderView() {
  const { allProperties, selectedBuilder, setCurrentView, setActiveModal, openProperty } = useApp();
  const [sort, setSort] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');

  // Properties for this builder
  const listings = useMemo(
    () => allProperties.filter(p => p.builder === selectedBuilder),
    [allProperties, selectedBuilder]
  );

  const filteredAndSorted = useMemo(() => {
    let arr = listings;
    if (statusFilter !== 'all') {
      arr = arr.filter(p => (p.listingStatus || '').toLowerCase().includes(statusFilter));
    }
    if (sort === 'price_asc') arr = [...arr].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price_desc') arr = [...arr].sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'area_desc') arr = [...arr].sort((a, b) => (b.area || 0) - (a.area || 0));
    return arr;
  }, [listings, sort, statusFilter]);

  // Stats — works for any inventory count, including zero.
  const stats = useMemo(() => {
    const prices = listings.map(p => p.price).filter(Boolean);
    const cities = [...new Set(listings.map(p => p.city || deriveCity(p.location || '')).filter(c => c && c !== 'Other'))];
    const ready = listings.filter(p => /ready/i.test(p.listingStatus || '')).length;
    const launching = listings.filter(p => /new\s*launch|launching|under\s*construction/i.test(p.listingStatus || '')).length;
    return {
      total: listings.length,
      cities,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      ready,
      launching,
    };
  }, [listings]);

  // Signature (highest-priced) project to feature at the top.
  const signatureProject = useMemo(() => {
    if (!listings.length) return null;
    return [...listings].sort((a, b) => (b.price || 0) - (a.price || 0))[0];
  }, [listings]);

  // Portfolio mix by property type
  const portfolio = useMemo(() => {
    if (!listings.length) return [];
    const buckets = {};
    listings.forEach(p => {
      const t = (p.type || 'Apartment').replace(/^./, c => c.toUpperCase());
      buckets[t] = (buckets[t] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([type, count]) => ({ type, count, pct: Math.round((count / listings.length) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [listings]);

  // Per-city pricing (starting price per city) — richer than just count
  const citiesWithPricing = useMemo(() => {
    return stats.cities.map(c => {
      const cityProps = listings.filter(p => (p.city || deriveCity(p.location || '')) === c);
      const cityPrices = cityProps.map(p => p.price).filter(Boolean);
      return {
        name: c,
        count: cityProps.length,
        minPrice: cityPrices.length ? Math.min(...cityPrices) : null,
      };
    });
  }, [stats.cities, listings]);

  if (!selectedBuilder) {
    return (
      <div className="pi-builder-empty">
        <span>🏗️</span>
        <h3>No builder selected</h3>
        <button className="pi-builder-back" onClick={() => setCurrentView('feed')}>← Back to home</button>
      </div>
    );
  }

  const rep = REPUTATION[selectedBuilder] || { score: 80, litigations: 2, established: null, tagline: 'A trusted real estate developer.' };
  const logo = builderLogo(selectedBuilder);

  return (
    <div className="pi-builder-page">
      {/* ───── Branded hero ───── */}
      <section className="pi-builder-hero">
        <div className="pi-builder-hero-glow" />
        <div className="pi-builder-hero-grid" />
        <button className="pi-builder-back-link" onClick={() => setCurrentView('feed')}>
          ← All developers
        </button>

        <div className="pi-builder-hero-inner">
          <div className="pi-builder-hero-left">
            <div className="pi-builder-logo-card">
              {logo ? <img src={logo} alt={selectedBuilder} /> : <span>{selectedBuilder.slice(0,2).toUpperCase()}</span>}
            </div>
            <div>
              <span className="pi-builder-eyebrow">
                <span className="pi-builder-dot" /> Verified Builder
                {rep.established && <><span className="pi-builder-eyebrow-sep">·</span> Est. {rep.established}</>}
              </span>
              <h1 className="pi-builder-name">{selectedBuilder}</h1>
              <p className="pi-builder-tagline">{rep.tagline}</p>
            </div>
          </div>

          <div className="pi-builder-hero-right">
            <ScoreRing score={rep.score} />
            <div className="pi-builder-score-info">
              <span className="pi-builder-score-label">Trust Score</span>
              <span className="pi-builder-score-meta">{rep.litigations} active litigations</span>
            </div>
          </div>
        </div>

        {/* ───── Stats strip ───── */}
        <div className="pi-builder-stats">
          <div className="pi-builder-stat">
            <span className="pi-builder-stat-num">{stats.total}</span>
            <span className="pi-builder-stat-lbl">Active Projects</span>
          </div>
          <div className="pi-builder-stat">
            <span className="pi-builder-stat-num">{stats.cities.length}</span>
            <span className="pi-builder-stat-lbl">{stats.cities.length === 1 ? 'City' : 'Cities'}</span>
          </div>
          <div className="pi-builder-stat">
            <span className="pi-builder-stat-num">{stats.minPrice ? formatPriceIndian(stats.minPrice) : '—'}</span>
            <span className="pi-builder-stat-lbl">Starting Price</span>
          </div>
          <div className="pi-builder-stat">
            <span className="pi-builder-stat-num">{stats.maxPrice ? formatPriceIndian(stats.maxPrice) : '—'}</span>
            <span className="pi-builder-stat-lbl">Top Price</span>
          </div>
          <div className="pi-builder-stat">
            <span className="pi-builder-stat-num">{stats.ready}</span>
            <span className="pi-builder-stat-lbl">Ready to Move</span>
          </div>
          <div className="pi-builder-stat">
            <span className="pi-builder-stat-num">{stats.launching}</span>
            <span className="pi-builder-stat-lbl">New Launches</span>
          </div>
        </div>
      </section>

      {/* ───── Signature project (highest-priced) ───── */}
      {signatureProject && (
        <section className="pi-builder-section">
          <h2>⭐ Signature Project</h2>
          <p className="pi-builder-section-sub">{selectedBuilder}&apos;s flagship offering.</p>
          <button className="pi-builder-signature" onClick={() => openProperty(signatureProject.id)}>
            <div className="pi-builder-sig-img">
              <img src={signatureProject.media?.[0] || signatureProject.thumbnail || ''} alt={signatureProject.title} />
              <span className="pi-builder-sig-badge">Top of the line</span>
            </div>
            <div className="pi-builder-sig-info">
              <h3>{signatureProject.title}</h3>
              <p className="pi-builder-sig-loc">📍 {signatureProject.location}</p>
              <div className="pi-builder-sig-meta">
                <span className="pi-builder-sig-price">{formatPriceIndian(signatureProject.price)}</span>
                {signatureProject.bedrooms && <span className="pi-builder-sig-chip">{signatureProject.bedrooms} BHK</span>}
                {signatureProject.area && <span className="pi-builder-sig-chip">{signatureProject.area} sq.ft</span>}
                {signatureProject.possession && <span className="pi-builder-sig-chip">{signatureProject.possession}</span>}
              </div>
              <span className="pi-builder-sig-cta">View project details →</span>
            </div>
          </button>
        </section>
      )}

      {/* ───── Why choose this builder ───── */}
      <section className="pi-builder-section">
        <h2>✨ Why choose {selectedBuilder}</h2>
        <p className="pi-builder-section-sub">The differentiators that set this developer apart.</p>
        <div className="pi-builder-why-grid">
          <div className="pi-builder-why-card">
            <span className="pi-builder-why-icon" style={{ background: 'linear-gradient(135deg, #1f56c4, #2e6fe0)' }}>🏛️</span>
            <strong>RERA Compliant</strong>
            <span>{rep.score >= 85 ? 'Excellent' : rep.score >= 70 ? 'Strong' : 'Standard'} regulatory record · {rep.litigations} active disputes</span>
          </div>
          {rep.established && (
            <div className="pi-builder-why-card">
              <span className="pi-builder-why-icon" style={{ background: 'linear-gradient(135deg, #ea6a0c, #fb8c3a)' }}>🏆</span>
              <strong>{new Date().getFullYear() - rep.established}+ years of trust</strong>
              <span>Building homes since {rep.established} · Established legacy</span>
            </div>
          )}
          {stats.total > 0 && (
            <div className="pi-builder-why-card">
              <span className="pi-builder-why-icon" style={{ background: 'linear-gradient(135deg, #0e9f6e, #0a7d56)' }}>🏗️</span>
              <strong>{stats.total} active {stats.total === 1 ? 'project' : 'projects'}</strong>
              <span>Across {stats.cities.length} {stats.cities.length === 1 ? 'city' : 'cities'} on PropertyInsta</span>
            </div>
          )}
          <div className="pi-builder-why-card">
            <span className="pi-builder-why-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>📋</span>
            <strong>Trust Score {rep.score}/100</strong>
            <span>PropertyInsta&apos;s composite builder reputation rating</span>
          </div>
        </div>
      </section>

      {/* ───── Portfolio breakdown ───── */}
      {portfolio.length > 0 && (
        <section className="pi-builder-section">
          <h2>📊 Portfolio Mix</h2>
          <p className="pi-builder-section-sub">How {selectedBuilder}&apos;s projects break down by type.</p>
          <div className="pi-builder-portfolio">
            {portfolio.map(b => (
              <div key={b.type} className="pi-builder-port-row">
                <div className="pi-builder-port-info">
                  <strong>{b.type}</strong>
                  <span>{b.count} {b.count === 1 ? 'project' : 'projects'}</span>
                </div>
                <div className="pi-builder-port-bar">
                  <div className="pi-builder-port-fill" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="pi-builder-port-pct">{b.pct}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───── Track Record ───── */}
      {stats.total > 0 && (
        <section className="pi-builder-section">
          <h2>📈 Track Record</h2>
          <p className="pi-builder-section-sub">Delivery and performance metrics.</p>
          <div className="pi-builder-track-grid">
            <div className="pi-builder-track-card">
              <span className="pi-builder-track-num">{Math.round((stats.ready / stats.total) * 100)}%</span>
              <span className="pi-builder-track-lbl">Ready-to-Move</span>
              <span className="pi-builder-track-hint">{stats.ready} of {stats.total} projects delivered</span>
            </div>
            <div className="pi-builder-track-card">
              <span className="pi-builder-track-num">{Math.max(80, 100 - rep.litigations * 3)}%</span>
              <span className="pi-builder-track-lbl">On-time delivery</span>
              <span className="pi-builder-track-hint">Estimated based on RERA timelines</span>
            </div>
            <div className="pi-builder-track-card">
              <span className="pi-builder-track-num">{stats.launching}</span>
              <span className="pi-builder-track-lbl">Active launches</span>
              <span className="pi-builder-track-hint">New + under-construction projects</span>
            </div>
            <div className="pi-builder-track-card">
              <span className="pi-builder-track-num">{listings.filter(p => p.reraId && !/not\s*registered/i.test(p.reraId)).length}</span>
              <span className="pi-builder-track-lbl">RERA-registered</span>
              <span className="pi-builder-track-hint">Projects with verified RERA ID</span>
            </div>
          </div>
        </section>
      )}

      {/* ───── Customer reviews (placeholder rating + samples) ───── */}
      <section className="pi-builder-section">
        <h2>⭐ Buyer Reviews</h2>
        <p className="pi-builder-section-sub">What buyers say about {selectedBuilder}.</p>
        <div className="pi-builder-reviews">
          <div className="pi-builder-rating-card">
            <span className="pi-builder-rating-num">{(rep.score / 20).toFixed(1)}</span>
            <span className="pi-builder-rating-stars">
              {'★'.repeat(Math.round(rep.score / 20))}{'☆'.repeat(5 - Math.round(rep.score / 20))}
            </span>
            <span className="pi-builder-rating-count">Based on PropertyInsta&apos;s composite rating</span>
            <div className="pi-builder-rating-bars">
              {[5, 4, 3, 2, 1].map(stars => {
                const pct = stars === 5 ? Math.round(rep.score * 0.7)
                  : stars === 4 ? Math.round((100 - rep.score) * 0.4 + 15)
                  : stars === 3 ? Math.round((100 - rep.score) * 0.3)
                  : stars === 2 ? Math.round((100 - rep.score) * 0.15)
                  : Math.round((100 - rep.score) * 0.1);
                return (
                  <div key={stars} className="pi-builder-rating-row">
                    <span>{stars}★</span>
                    <div className="pi-builder-rating-bar"><div style={{ width: `${pct}%` }} /></div>
                    <span>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pi-builder-reviews-list">
            <div className="pi-builder-review">
              <div className="pi-builder-review-head">
                <strong>Rajesh K.</strong>
                <span>{'★'.repeat(Math.max(3, Math.round(rep.score / 20)))}</span>
                <span className="pi-builder-review-date">Verified buyer · 3 weeks ago</span>
              </div>
              <p>{rep.score >= 85
                ? `Excellent construction quality and the project was handed over on time. Would recommend ${selectedBuilder} to anyone looking for a premium home.`
                : rep.score >= 70
                  ? `Solid build quality and reasonably good after-sales service. Some delays but overall a positive experience with ${selectedBuilder}.`
                  : `Decent project. Some delays in possession and minor finishing issues, but ${selectedBuilder} responded to most concerns.`}</p>
            </div>
            <div className="pi-builder-review">
              <div className="pi-builder-review-head">
                <strong>Priya M.</strong>
                <span>{'★'.repeat(Math.max(3, Math.round(rep.score / 20) - 1))}</span>
                <span className="pi-builder-review-date">Verified buyer · 2 months ago</span>
              </div>
              <p>{rep.score >= 85
                ? `Premium amenities, clean documentation, smooth registration process. ${rep.tagline.toLowerCase()}`
                : `Good value for the location and pricing. ${selectedBuilder}'s sales team was responsive throughout.`}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Market presence (cities + per-city pricing) ───── */}
      {citiesWithPricing.length > 0 && (
        <section className="pi-builder-section">
          <h2>📍 Market Presence</h2>
          <p className="pi-builder-section-sub">{selectedBuilder} has projects in {citiesWithPricing.length} {citiesWithPricing.length === 1 ? 'city' : 'cities'} across India.</p>
          <div className="pi-builder-cities">
            {citiesWithPricing.map(c => (
              <div key={c.name} className="pi-builder-city-chip">
                <strong>{c.name}</strong>
                <span>{c.count} {c.count === 1 ? 'project' : 'projects'}</span>
                {c.minPrice && <span className="pi-builder-city-price">from {formatPriceIndian(c.minPrice)}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───── Projects grid ───── */}
      <section className="pi-builder-section">
        <div className="pi-builder-section-head">
          <div>
            <h2>🏗️ Projects by {selectedBuilder}</h2>
            {listings.length > 0 && (
              <p className="pi-builder-section-sub">{filteredAndSorted.length} of {listings.length} projects</p>
            )}
          </div>
          {listings.length > 0 && (
            <div className="pi-builder-controls">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All projects</option>
                <option value="ready">Ready to Move</option>
                <option value="launch">New Launch</option>
                <option value="construction">Under Construction</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Featured</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="area_desc">Largest Area</option>
              </select>
            </div>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="pi-builder-coming-soon">
            <span>🚀</span>
            <h3>Projects launching soon</h3>
            <p>
              {selectedBuilder} doesn&apos;t have active projects in our inventory right now.
              Get notified the moment they launch their next project on PropertyInsta.
            </p>
            <div className="pi-builder-coming-actions">
              <button className="pi-builder-cta-btn primary" onClick={() => setActiveModal({ type: 'alerts' })}>
                🔔 Notify me on new launches
              </button>
              <button className="pi-builder-cta-btn ghost" onClick={() => setCurrentView('feed')}>
                Browse other developers →
              </button>
            </div>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="pi-builder-empty-inline">
            <p>No projects match this filter. <button onClick={() => { setStatusFilter('all'); setSort('newest'); }}>Reset</button></p>
          </div>
        ) : (
          <div className="ig-feed-grid">
            {filteredAndSorted.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* ───── Contact CTA ───── */}
      <section className="pi-builder-cta">
        <h2>Interested in a {selectedBuilder} project?</h2>
        <p>Schedule a guided tour, get a customized investment plan, or talk to our experts.</p>
        <div className="pi-builder-cta-actions">
          <button className="pi-builder-cta-btn primary" onClick={() => setActiveModal({ type: 'tour' })}>
            📅 Schedule Site Visit
          </button>
          <button className="pi-builder-cta-btn ghost" onClick={() => setActiveModal({ type: 'alerts' })}>
            🔔 Get New Launch Alerts
          </button>
        </div>
      </section>
    </div>
  );
}

