import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const SEARCH_TABS = ['buy', 'rent', 'pg'];
const BUDGETS = ['Under ₹30L', '₹30L-60L', '₹60L-1Cr', '₹1Cr-2Cr', '₹2Cr-5Cr', '₹5Cr+'];
const PROPERTY_TYPES = ['All Types', 'Apartment', 'Villa', 'Penthouse', 'Cottage', 'Farmhouse', 'Studio', 'Commercial'];
const SEARCH_TAGS = ['2 BHK', '3 BHK', 'Furnished', 'Pool', 'Gym', 'Parking', 'Sea View', 'Gated'];

const HERO_STATS = [
  { value: '10,000+', label: 'Properties', icon: 'building' },
  { value: '5,000+', label: 'Happy Families', icon: 'heart' },
  { value: '50+', label: 'Cities', icon: 'map' },
  { value: '4.8', label: 'Rating ⭐', icon: 'star' },
];

export default function HeroBanner() {
  const { filters, setFilters } = useApp();
  const [activeTab, setActiveTab] = useState('buy');
  const videoRef = useRef(null);

  // Retry video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = () => {
      video.play().catch(() => {
        setTimeout(() => video.play().catch(() => {}), 500);
      });
    };

    playVideo();
    document.addEventListener('click', playVideo, { once: true });
    return () => document.removeEventListener('click', playVideo);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
  };

  const handleTagClick = (tag) => {
    setFilters(prev => ({ ...prev, search: tag.toLowerCase() }));
  };

  const renderStatIcon = (icon) => {
    switch (icon) {
      case 'building':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22V12h6v10" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01" />
          </svg>
        );
      case 'heart':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case 'map':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        );
      case 'star':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="hero-video-banner" id="heroBanner">
      <video
        ref={videoRef}
        className="hero-video"
        src="/33.mp4"
        autoPlay
        muted
        loop
        playsInline
        id="heroVideo"
      />
      <div className="hero-overlay-gradient" />
      <div className="hero-floating-orb hero-orb-1" />
      <div className="hero-floating-orb hero-orb-2" />

      <div className="hero-banner-content">
        <div className="hero-content-left">
          <h1 className="hero-banner-title">
            with PropertyInsta — Look · Visit · Book
          </h1>
          <p className="hero-banner-subtitle">
            Premium listings with virtual tours, reels & AI-powered recommendations
          </p>

          <div className="hero-search-box">
            {/* Search Tabs */}
            <div className="hero-search-tabs">
              {SEARCH_TABS.map(tab => (
                <button
                  key={tab}
                  className={`hero-search-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Search Fields */}
            <form className="hero-search-input-row" onSubmit={handleSearch}>
              <div className="hero-search-field">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search city, locality, or project..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

              <div className="hero-search-field hero-search-price">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <select
                  id="heroSearchBudget"
                  value={filters.priceRange || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                >
                  <option value="">Budget</option>
                  {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="hero-search-field hero-search-type">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <select
                  id="heroSearchType"
                  value={filters.propertyType?.[0] || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value ? [e.target.value] : [] }))}
                >
                  {PROPERTY_TYPES.map(t => <option key={t} value={t === 'All Types' ? '' : t}>{t}</option>)}
                </select>
              </div>

              <button type="submit" className="hero-search-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search
              </button>
            </form>

            {/* Search Tags */}
            <div className="hero-search-tags">
              {SEARCH_TAGS.map(tag => (
                <button key={tag} className="hero-search-tag" onClick={() => handleTagClick(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-content-right">
          <div className="hero-stats-grid">
            {HERO_STATS.map(stat => (
              <div key={stat.label} className="hero-stat-card">
                <div className="hero-stat-icon">{renderStatIcon(stat.icon)}</div>
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span>Explore</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}