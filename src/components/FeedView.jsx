import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp, deriveCity } from '../context/AppContext';
import Stories from './Stories';
import PropertyCard from './PropertyCard';
import { formatPriceIndian } from '../data';

const TRENDING_COUNT = 6;

// Quick-explore pickers (wired to the existing filter system)
const QUICK_BUDGETS = ['Under ₹30L', '₹30L-60L', '₹60L-1Cr', '₹1Cr-2Cr', '₹2Cr-5Cr', '₹5Cr+'];
const QUICK_BHK = [1, 2, 3, 4, 5];
const QUICK_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Studio', 'Commercial'];

// City tile imagery (free-to-use Unsplash) — landmarks where iconic, clean
// skylines otherwise. Falls back to the tile gradient if an image fails.
const UNS = (id) => `https://images.unsplash.com/photo-${id}?w=500&h=360&fit=crop&q=70`;
const CITY_IMAGES = {
  'Delhi': UNS('1587474260584-136574528ed5'),        // India Gate
  'Mumbai': UNS('1529253355930-ddbe423a2ac7'),       // Mumbai
  'Navi Mumbai': UNS('1486325212027-8081e485255e'),
  'Bangalore': UNS('1596176530529-78163a4f7af2'),
  'Hyderabad': UNS('1551161242-b5af797b7233'),        // Charminar
  'Kolkata': UNS('1558431382-27e303142255'),          // Victoria Memorial
  'Vrindavan': UNS('1564507592333-c60657eea523'),     // North-India heritage
  'Gurgaon': UNS('1480714378408-67cf0d13bc1b'),
  'Greater Noida': UNS('1477959858617-67f85cf4f1df'),
  'Noida': UNS('1449824913935-59a10b8d2000'),
  'Faridabad': UNS('1514924013411-cbf25faa35bb'),
  'Chandigarh': UNS('1449824913935-59a10b8d2000'),
  'Ludhiana': UNS('1486325212027-8081e485255e'),
  'Lucknow': UNS('1477959858617-67f85cf4f1df'),
  'Pune': UNS('1480714378408-67cf0d13bc1b'),
  'Ahmedabad': UNS('1514924013411-cbf25faa35bb'),
};
const FALLBACK_CITY_IMAGES = [
  UNS('1477959858617-67f85cf4f1df'),
  UNS('1480714378408-67cf0d13bc1b'),
  UNS('1514924013411-cbf25faa35bb'),
  UNS('1449824913935-59a10b8d2000'),
  UNS('1486325212027-8081e485255e'),
];
const cityImage = (name, i) => CITY_IMAGES[name] || FALLBACK_CITY_IMAGES[i % FALLBACK_CITY_IMAGES.length];

// Trust / social-proof features
const TRUST_FEATURES = [
  { icon: '🛡️', title: 'RERA Verified', desc: 'Every project checked against the official RERA registry.' },
  { icon: '🎥', title: 'HD Virtual Tours', desc: 'Walk through homes in 3D before you ever visit.' },
  { icon: '🤝', title: 'Zero Brokerage', desc: 'Connect with builders directly — no hidden commissions.' },
  { icon: '⚡', title: 'Instant Site Visits', desc: 'Book a guided visit in seconds, on your schedule.' },
];

// Brand gradient palette cycled across developer tiles
const DEV_GRADIENTS = [
  'linear-gradient(135deg, #1b4db1, #2e6fe0)',
  'linear-gradient(135deg, #ea6a0c, #fb8c3a)',
  'linear-gradient(135deg, #0e9f6e, #0a7d56)',
  'linear-gradient(135deg, #6d28d9, #8b5cf6)',
  'linear-gradient(135deg, #be123c, #f43f5e)',
  'linear-gradient(135deg, #0e7490, #06b6d4)',
];

function devInitials(name = '') {
  const words = name.replace(/\b(Limited|Ltd|Properties|Group|India|Developers|Lifespaces|Housing|Realty|Infra|Pvt|Projects)\b/gi, '').trim().split(/\s+/).filter(Boolean);
  const letters = (words.length ? words : name.split(/\s+/)).slice(0, 2).map(w => w[0]).join('');
  return (letters || name.slice(0, 2)).toUpperCase();
}

// Real developer logos via public favicon services, each verified to return
// the brand's actual logo. Any failure gracefully falls back to a branded
// initials badge, and a DB `developer_logo` URL always takes priority.
const ddg = (d) => `https://icons.duckduckgo.com/ip3/${d}.ico`;
const logodev = (d) => `https://img.logo.dev/${d}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=128&format=png&retina=true`;

// Official brand domains → real logos (served via logo.dev, which proxies each
// company's logo). A few use a better-framed override below.
const DEVELOPER_DOMAINS = {
  'DLF Limited': 'dlf.in',
  'Godrej Properties': 'godrejproperties.com',
  'M3M India': 'm3mindia.com',
  'Emaar India': 'emaar.com',
  'Sobha Limited': 'sobha.com',
  'Tata Housing': 'tatahousing.com',
  'Adani Realty': 'adani.com',
  'Vatika Group': 'vatikagroup.com',
  'BPTP Limited': 'bptp.com',
  'ATS Infrastructure': 'atsgreens.com',
  'Birla Estates': 'birlaestates.com',
  'Smartworld Developers': 'smartworlddevelopers.com',
  'Hero Realty': 'heroreality.com',
  'Paras Buildtech': 'parasbuildtech.com',
  'Elan Group': 'elangroup.in',
  'Experion Developers': 'experion.co',
  'Trevoc Group': 'trevoc.com',
  'Ganga Realty': 'gangarealty.com',
  'Anant Raj': 'anantrajlimited.com',
  'SS Group': 'ssgroup-india.com',
  'Bestech Group': 'bestechgroup.com',
  'AIPL': 'aipl.com',
  'Eldeco Group': 'eldecogroup.com',
  'Mahindra Lifespaces': 'mahindralifespaces.com',
  'Krisumi Corporation': 'krisumi.com',
  'Orris Infrastructure': 'orris.in',
  'Ashiana Housing': 'ashianahousing.com',
  'Trehan Group': 'trehangroup.com',
  'JMS Group': 'jmsgroup.in',
  'Imperia Structures': 'imperiastructures.com',
  'Pyramid Infratech': 'pyramidinfratech.com',
  'Lion Infra Developers': 'lioninfra.com',
  'Spaze Group': 'spaze.in',
  'Conscient Infrastructure': 'conscient.in',
  'Mapsko Group': 'mapsko.com',
  // others that may appear from data
  'Omaxe Ltd': 'omaxe.com',
  'Omaxe Limited': 'omaxe.com',
  'TARC Group': 'tarc.in',
  'Max Estates': 'maxestates.in',
  'L&T Realty': 'lntrealty.com',
};

// Better-framed / more reliable overrides (square emblems beat wide lockups).
const DEVELOPER_LOGO_OVERRIDES = {
  'Signature Global': 'https://www.signatureglobal.in/images/fav_icon.svg',
  'Central Park': ddg('centralparkindia.com'),
  'Hero Realty': '/dev-logos/hero-realty.png',
  'JMS Group': '/dev-logos/jms-group.png',
};

function devLogoUrl(dev) {
  if (dev.logo) return dev.logo;
  if (DEVELOPER_LOGO_OVERRIDES[dev.name]) return DEVELOPER_LOGO_OVERRIDES[dev.name];
  const d = DEVELOPER_DOMAINS[dev.name];
  return d ? logodev(d) : '';
}

// Curated developer directory — shown in this order regardless of live
// inventory (counts are pulled from listings when available).
const FEATURED_DEVELOPERS = [
  'DLF Limited', 'Godrej Properties', 'M3M India', 'Signature Global', 'Emaar India',
  'Sobha Limited', 'Tata Housing', 'Adani Realty', 'Vatika Group', 'BPTP Limited',
  'ATS Infrastructure', 'Birla Estates', 'Smartworld Developers', 'Hero Realty', 'Paras Buildtech',
  'Elan Group', 'Experion Developers', 'Trevoc Group', 'Ganga Realty', 'Anant Raj',
  'SS Group', 'Bestech Group', 'Central Park', 'AIPL', 'Eldeco Group',
  'Mahindra Lifespaces', 'Krisumi Corporation', 'Orris Infrastructure', 'Ashiana Housing', 'Trehan Group',
  'JMS Group', 'Imperia Structures', 'Pyramid Infratech', 'Lion Infra Developers', 'Spaze Group',
  'Conscient Infrastructure', 'Mapsko Group',
];

function DeveloperCard({ dev, gradient, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logo = imgFailed ? '' : devLogoUrl(dev);
  return (
    <button className="ig-dev-card" onClick={onClick} title={`View ${dev.count} listings by ${dev.name}`}>
      <span className={`ig-dev-logo ${logo ? 'has-img' : ''}`} style={logo ? undefined : { background: gradient }}>
        {logo
          ? <img src={logo} alt={dev.name} loading="lazy" onError={() => setImgFailed(true)} />
          : <span className="ig-dev-initials">{devInitials(dev.name)}</span>}
      </span>
      <span className="ig-dev-name">{dev.name}</span>
      <span className="ig-dev-meta">
        {dev.count > 0
          ? <>{dev.count} {dev.count === 1 ? 'project' : 'projects'}{dev.minPrice < Infinity && <> · from {formatPriceIndian(dev.minPrice)}</>}</>
          : 'Explore →'}
      </span>
    </button>
  );
}

const SHOWCASE_LIMIT = 10;

// Horizontal "collection" carousel — the competitive showcase unit.
// Full-width landscape spotlight — shows one listing at a time, auto-slides.
function FeaturedSpotlight({ items, onOpen }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % n), 5500);
    return () => clearInterval(t);
  }, [paused, n]);

  useEffect(() => { if (idx >= n) setIdx(0); }, [n, idx]);

  if (!n) return null;
  const go = (d) => setIdx(i => (i + d + n) % n);

  return (
    <section
      className="ig-spotlight"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ig-spotlight-stage">
        {items.map((p, i) => (
          <button
            key={p.id}
            className={`ig-spot-slide ${i === idx ? 'active' : ''}`}
            style={{ backgroundImage: `url("${p.media?.[0] || p.thumbnail || ''}")` }}
            onClick={() => onOpen(p.id)}
            aria-hidden={i !== idx}
            tabIndex={i === idx ? 0 : -1}
          >
            <span className="ig-spot-scrim" />
            <span className="ig-spot-body">
              <span className="ig-spot-badges">
                <span className="ig-spot-badge hot">🔥 Featured</span>
                {p.rera && <span className="ig-spot-badge rera">RERA</span>}
                {p.listingStatus && <span className="ig-spot-badge">{p.listingStatus}</span>}
              </span>
              <span className="ig-spot-title">{p.title}</span>
              <span className="ig-spot-loc">📍 {p.location}</span>
              <span className="ig-spot-specs">
                {p.bedrooms ? <em>{p.bedrooms} BHK</em> : null}
                {p.area ? <em>{p.area} sq.ft</em> : null}
                {p.type ? <em>{p.type}</em> : null}
              </span>
              <span className="ig-spot-foot">
                <span className="ig-spot-price">{formatPriceIndian(p.price)}</span>
                <span className="ig-spot-cta">View details →</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {n > 1 && (
        <>
          <button className="ig-spot-arrow left" onClick={() => go(-1)} aria-label="Previous listing">‹</button>
          <button className="ig-spot-arrow right" onClick={() => go(1)} aria-label="Next listing">›</button>
          <div className="ig-spot-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`ig-spot-dot ${i === idx ? 'active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`Go to listing ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ShowcaseRow({ icon, title, subtitle, items, onViewAll }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="ig-section ig-showcase-section">
      <div className="ig-section-header">
        <div className="ig-showcase-head">
          <h2 className="ig-section-title">{icon} {title}</h2>
          {subtitle && <span className="ig-showcase-sub">{subtitle}</span>}
        </div>
        {onViewAll && (
          <button className="ig-viewall-btn" onClick={onViewAll}>View all →</button>
        )}
      </div>
      <div className="ig-showcase-row">
        {items.map(prop => (
          <PropertyCard key={`sc-${title}-${prop.id}`} property={prop} />
        ))}
      </div>
    </section>
  );
}

export default function FeedView() {
  const {
    displayedProperties,
    allProperties,
    filters,
    setFilters,
    recentlyViewed,
    setActiveModal,
    addRecentView,
    hasMore,
    loadMore,
    filteredCount,
    openBuilder,
    openProperty,
  } = useApp();

  const [openHouseCountdown, setOpenHouseCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Open house countdown (ends at 6 PM today)
  const updateCountdown = useCallback(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(18, 0, 0, 0);
    if (now > end) end.setDate(end.getDate() + 1);

    const diff = end - now;
    setOpenHouseCountdown({
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    });
  }, []);

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);

  // Active filter detection — hide discovery sections when browsing filtered results
  const hasActiveFilters = !!(
    filters.search || filters.city || filters.builder || filters.priceRange || filters.priceMin || filters.priceMax ||
    (filters.propertyType && filters.propertyType.length) ||
    filters.bedrooms !== null && filters.bedrooms !== undefined ||
    (filters.amenities && filters.amenities.length) ||
    (filters.listingStatus && filters.listingStatus.length)
  );

  // Developer directory — curated list (in the given order), enriched with
  // live listing counts/min-price where the builder has inventory.
  const developers = useMemo(() => {
    const stats = new Map();
    allProperties.forEach(p => {
      if (!p.builder) return;
      const d = stats.get(p.builder) || { count: 0, logo: '', minPrice: Infinity };
      d.count += 1;
      if (!d.logo && p.developerLogo) d.logo = p.developerLogo;
      if (p.price && p.price < d.minPrice) d.minPrice = p.price;
      stats.set(p.builder, d);
    });
    return FEATURED_DEVELOPERS.map(name => {
      const s = stats.get(name) || { count: 0, logo: '', minPrice: Infinity };
      return { name, count: s.count, logo: s.logo, minPrice: s.minPrice };
    });
  }, [allProperties]);

  // Open the builder's dedicated microsite (not just a filter on the feed).
  const selectDeveloper = (name) => {
    openBuilder(name);
  };

  // Get recently viewed properties from context allProperties
  const recentProps = allProperties.filter(p => recentlyViewed.includes(p.id)).slice(0, 4);

  // Trending properties
  const trendingProps = allProperties.filter(p => p.trending).slice(0, TRENDING_COUNT);

  // Spotlight — featured/trending listings for the landscape auto-slider
  const spotlightProps = useMemo(() => {
    const picked = allProperties.filter(p => p.featured || p.trending);
    return (picked.length ? picked : allProperties).slice(0, 6);
  }, [allProperties]);

  // Open House property (first property with open house)
  const openHouseProp = allProperties.find(p => p.openHouse);

  // ---- Curated showcase collections (competitive discovery rows) ----
  const newLaunches = useMemo(
    () => allProperties.filter(p => /new\s*launch|launching/i.test(p.listingStatus || '')).slice(0, SHOWCASE_LIMIT),
    [allProperties]
  );
  const readyToMove = useMemo(
    () => allProperties.filter(p => /ready/i.test(p.listingStatus || '')).slice(0, SHOWCASE_LIMIT),
    [allProperties]
  );
  const luxuryHomes = useMemo(
    () => allProperties.filter(p => p.price >= 50000000).sort((a, b) => b.price - a.price).slice(0, SHOWCASE_LIMIT),
    [allProperties]
  );
  const valueHomes = useMemo(
    () => allProperties.filter(p => p.price > 0 && p.price <= 15000000).sort((a, b) => a.price - b.price).slice(0, SHOWCASE_LIMIT),
    [allProperties]
  );

  // Top cities — grouped from live inventory
  const cities = useMemo(() => {
    const m = new Map();
    allProperties.forEach(p => {
      const c = p.city || deriveCity(p.location || '');
      if (!c || c === 'Other') return;
      const d = m.get(c) || { name: c, count: 0, minPrice: Infinity };
      d.count += 1;
      if (p.price && p.price < d.minPrice) d.minPrice = p.price;
      m.set(c, d);
    });
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [allProperties]);

  const applyAndScroll = (patch) => {
    setFilters(prev => ({ ...prev, ...patch }));
    document.getElementById('heroBanner')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="ig-feed-content">
      {/* Featured spotlight — landscape single-listing auto-slider */}
      {!hasActiveFilters && spotlightProps.length > 0 && (
        <FeaturedSpotlight items={spotlightProps} onOpen={openProperty} />
      )}

      {/* Browse by City */}
      {!hasActiveFilters && cities.length > 0 && (
        <section className="ig-section ig-cities-section">
          <div className="ig-section-header">
            <h2 className="ig-section-title">📍 Browse by City</h2>
            <span className="ig-result-count">{cities.length} cities</span>
          </div>
          <div className="ig-cities-grid">
            {cities.map((c, i) => (
              <button
                key={c.name}
                className="ig-city-tile"
                style={{ background: DEV_GRADIENTS[i % DEV_GRADIENTS.length] }}
                onClick={() => applyAndScroll({ city: c.name, builder: '', search: '' })}
              >
                <img className="ig-city-img" src={cityImage(c.name, i)} alt={c.name} loading="lazy" />
                <span className="ig-city-name">{c.name}</span>
                <span className="ig-city-meta">{c.count} {c.count === 1 ? 'property' : 'properties'}</span>
                {c.minPrice < Infinity && <span className="ig-city-price">from {formatPriceIndian(c.minPrice)}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Top Developers */}
      {!hasActiveFilters && developers.length > 0 && (
        <section className="ig-section ig-developers-section">
          <div className="ig-section-header">
            <h2 className="ig-section-title">🏗️ Top Developers</h2>
            <span className="ig-result-count">{developers.length} builders</span>
          </div>
          <div className="ig-developers-row">
            {developers.map((dev, i) => (
              <DeveloperCard
                key={dev.name}
                dev={dev}
                gradient={DEV_GRADIENTS[i % DEV_GRADIENTS.length]}
                onClick={() => selectDeveloper(dev.name)}
              />
            ))}
          </div>
        </section>
      )}


      {/* Recently Viewed — compact horizontal strip */}
      {!hasActiveFilters && recentProps.length > 0 && (
        <section className="ig-section ig-recent-section">
          <div className="ig-section-header">
            <h2 className="ig-section-title">🕐 Recently Viewed</h2>
          </div>
          <div className="ig-recent-row">
            {recentProps.map(prop => (
              <button
                key={`recent-${prop.id}`}
                className="ig-recent-card"
                onClick={() => openProperty(prop.id)}
              >
                <img
                  className="ig-recent-img"
                  src={prop.media?.[0] || prop.thumbnail || ''}
                  alt={prop.title}
                  loading="lazy"
                />
                <div className="ig-recent-info">
                  <span className="ig-recent-title">{prop.title}</span>
                  <span className="ig-recent-location">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {prop.location}
                  </span>
                  <span className="ig-recent-price">{formatPriceIndian(prop.price)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Curated showcase collections — competitive discovery carousels */}
      {!hasActiveFilters && (
        <>
          {/* Trending Now — full-size showcase cards */}
          <ShowcaseRow
            icon="🔥" title="Trending Now" subtitle="Most-viewed this week"
            items={trendingProps}
            onViewAll={() => applyAndScroll({ priceMin: '', priceMax: '', priceRange: '', listingStatus: [] })}
          />

          {/* Stories */}
          <section className="ig-stories-section">
            <Stories />
          </section>
          <ShowcaseRow
            icon="✨" title="New Launches" subtitle="Fresh on PropertyInsta"
            items={newLaunches}
            onViewAll={() => applyAndScroll({ listingStatus: ['New Launch'], priceMin: '', priceMax: '', priceRange: '' })}
          />

          <ShowcaseRow
            icon="🔑" title="Ready to Move" subtitle="Move in right away"
            items={readyToMove}
            onViewAll={() => applyAndScroll({ listingStatus: ['Ready to Move'], priceMin: '', priceMax: '', priceRange: '' })}
          />
          <ShowcaseRow
            icon="💎" title="Luxury Living" subtitle="₹5 Cr & above"
            items={luxuryHomes}
            onViewAll={() => applyAndScroll({ priceMin: '50000000', priceMax: '', priceRange: '', listingStatus: [] })}
          />
          <ShowcaseRow
            icon="🏷️" title="Value Homes" subtitle="Smart buys under ₹1.5 Cr"
            items={valueHomes}
            onViewAll={() => applyAndScroll({ priceMax: '15000000', priceMin: '', priceRange: '', listingStatus: [] })}
          />

          {/* Why PropertyInsta — trust band */}
          <section className="ig-section ig-trust-band">
            <div className="ig-trust-head">
              <h2 className="ig-section-title">Why PropertyInsta</h2>
              <p className="ig-trust-sub">India&apos;s most visual way to discover, compare &amp; book your next home.</p>
            </div>
            <div className="ig-trust-grid">
              {TRUST_FEATURES.map(f => (
                <div key={f.title} className="ig-trust-card">
                  <span className="ig-trust-icon">{f.icon}</span>
                  <span className="ig-trust-title">{f.title}</span>
                  <span className="ig-trust-desc">{f.desc}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Open House Banner */}
      {!hasActiveFilters && openHouseProp && (
        <section className="ig-open-house-banner">
          <div className="ohb-content">
            <div className="ohb-text">
              <span className="ohb-label">🏠 Open House Today</span>
              <h3>{openHouseProp.title}</h3>
              <p>{openHouseProp.location} • {formatPriceIndian(openHouseProp.price)}</p>
              <div className="ohb-countdown">
                Ends in {openHouseCountdown.hours}h {openHouseCountdown.minutes}m {openHouseCountdown.seconds}s
              </div>
            </div>
            <button
              className="ohb-btn"
              onClick={() => openProperty(openHouseProp.id)}
            >
              View Property →
            </button>
          </div>
        </section>
      )}

      {/* All Properties Feed */}
      <section className="ig-section">
        <div className="ig-section-header">
          <h2 className="ig-section-title">
            {filters.builder
              ? `🏗️ Projects by ${filters.builder}`
              : filters.search
                ? `🔍 Results for "${filters.search}"`
                : filters.city
                  ? `📍 Properties in ${filters.city}`
                  : '🏘️ All Properties'}
          </h2>
          <div className="ig-section-header-right">
            {filters.builder && (
              <button className="ig-clear-filter-btn" onClick={() => setFilters(prev => ({ ...prev, builder: '' }))}>
                ✕ Clear
              </button>
            )}
            <span className="ig-result-count">{filteredCount} {filteredCount === 1 ? 'listing' : 'listings'}</span>
          </div>
        </div>

        {displayedProperties.length === 0 ? (
          <div className="ig-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <h3>No properties found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="ig-feed-grid">
              {displayedProperties.map(prop => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
            {hasMore && (
              <div className="ig-load-more">
                <button className="ig-load-more-btn" onClick={loadMore}>
                  Load More Properties ↓
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}