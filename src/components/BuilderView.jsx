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
  const { allProperties, selectedBuilder, setCurrentView, setActiveModal } = useApp();
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

  // Stats
  const stats = useMemo(() => {
    if (!listings.length) return null;
    const prices = listings.map(p => p.price).filter(Boolean);
    const cities = [...new Set(listings.map(p => p.city || deriveCity(p.location || '')).filter(c => c && c !== 'Other'))];
    const ready = listings.filter(p => /ready/i.test(p.listingStatus || '')).length;
    const launching = listings.filter(p => /new\s*launch|launching|under\s*construction/i.test(p.listingStatus || '')).length;
    return {
      total: listings.length,
      cities,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      ready,
      launching,
    };
  }, [listings]);

  if (!selectedBuilder) {
    return (
      <div className="pi-builder-empty">
        <span>🏗️</span>
        <h3>No builder selected</h3>
        <button className="pi-builder-back" onClick={() => setCurrentView('feed')}>← Back to home</button>
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="pi-builder-empty">
        <span>🏗️</span>
        <h3>{selectedBuilder}</h3>
        <p>We don&apos;t have any active projects from this builder in our inventory yet.</p>
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
            <span className="pi-builder-stat-num">{formatPriceIndian(stats.minPrice)}</span>
            <span className="pi-builder-stat-lbl">Starting Price</span>
          </div>
          <div className="pi-builder-stat">
            <span className="pi-builder-stat-num">{formatPriceIndian(stats.maxPrice)}</span>
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

      {/* ───── Market presence (cities) ───── */}
      <section className="pi-builder-section">
        <h2>📍 Market Presence</h2>
        <p className="pi-builder-section-sub">{selectedBuilder} has projects in {stats.cities.length} {stats.cities.length === 1 ? 'city' : 'cities'} across India.</p>
        <div className="pi-builder-cities">
          {stats.cities.map(c => {
            const cityCount = listings.filter(p => (p.city || deriveCity(p.location || '')) === c).length;
            return (
              <div key={c} className="pi-builder-city-chip">
                <strong>{c}</strong>
                <span>{cityCount} {cityCount === 1 ? 'project' : 'projects'}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───── Projects grid ───── */}
      <section className="pi-builder-section">
        <div className="pi-builder-section-head">
          <div>
            <h2>🏗️ Projects by {selectedBuilder}</h2>
            <p className="pi-builder-section-sub">{filteredAndSorted.length} of {listings.length} projects</p>
          </div>
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
        </div>

        {filteredAndSorted.length === 0 ? (
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

