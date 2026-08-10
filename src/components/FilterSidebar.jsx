import { useApp } from '../context/AppContext';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'area_desc', label: 'Largest Area' },
];

const PRICE_PRESETS = [
  { value: '', label: 'All' },
  { value: 'Under ₹30L', label: 'Under ₹30L' },
  { value: '₹30L-60L', label: '₹30L–60L' },
  { value: '₹60L-1Cr', label: '₹60L–1Cr' },
  { value: '₹1Cr-2Cr', label: '₹1Cr–2Cr' },
  { value: '₹2Cr-5Cr', label: '₹2Cr–5Cr' },
  { value: '₹5Cr+', label: '₹5Cr+' },
];

const PROPERTY_TYPES = [
  { value: 'Apartment', label: 'Apartment', icon: '🏢' },
  { value: 'Villa', label: 'Villa', icon: '🏡' },
  { value: 'Penthouse', label: 'Penthouse', icon: '🌆' },
  { value: 'Studio', label: 'Studio', icon: '🏠' },
  { value: 'Commercial', label: 'Commercial', icon: '🏬' },
  { value: 'Cottage', label: 'Cottage', icon: '🛖' },
  { value: 'Farmhouse', label: 'Farmhouse', icon: '🌾' },
];
const BEDROOMS = [1, 2, 3, 4, 5];
const AMENITIES = ['Pool', 'Gym', 'Parking', 'Garden', 'Security', 'Smart Home'];
const LISTING_STATUS = ['Ready to Move', 'Under Construction', 'New Launch'];

export default function FilterSidebar() {
  const {
    filters,
    setFilters,
    filteredCount,
    setActiveModal,
    setCurrentView,
    sidebarOpen,
    toggleSidebar,
  } = useApp();

  const updateFilters = (updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilters({ [key]: next });
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      city: '',
      builder: '',
      priceRange: '',
      priceMin: '',
      priceMax: '',
      propertyType: [],
      bedrooms: null,
      amenities: [],
      listingStatus: [],
      sortBy: 'newest',
    });
  };

  const hasActiveFilters = filters.propertyType?.length > 0 ||
    filters.bedrooms ||
    filters.amenities?.length > 0 ||
    filters.listingStatus?.length > 0 ||
    filters.priceRange ||
    filters.search;

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      {sidebarOpen && <div className="ig-sidebar-backdrop" onClick={toggleSidebar} />}

      <aside id="filterSidebar" className={`ig-sidebar ig-sidebar--compact${sidebarOpen ? ' ig-sidebar--open' : ''}`}>
        <div className="ig-sidebar-inner">
          {/* Compact Filter Buttons Card */}
          <div className="ig-filter-card ig-filter-card--compact">
            {/* Header row */}
            <div className="ig-filter-header ig-filter-header--compact">
              <svg className="ig-filter-header-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span className="ig-filter-header-title">Filters</span>
              {filteredCount !== undefined && (
                <span className="ig-filter-count">{filteredCount}</span>
              )}
              {hasActiveFilters && (
                <button className="ig-filter-reset" onClick={resetFilters}>
                  Reset
                </button>
              )}
              <button className="ig-filter-close" onClick={toggleSidebar} title="Close filters">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Sort — compact inline select */}
            <div className="ig-filter-row">
              <span className="ig-filter-chip-label">Sort</span>
              <div className="ig-sort-select-wrapper ig-sort-select-wrapper--compact">
                <select
                  className="ig-sort-select ig-sort-select--compact"
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => updateFilters({ sortBy: e.target.value })}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <svg className="ig-sort-arrow" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 11L3 6h10z" />
                </svg>
              </div>
            </div>

            {/* Price — preset buttons */}
            <div className="ig-filter-row">
              <span className="ig-filter-chip-label">Price</span>
              <div className="ig-filter-chips">
                {PRICE_PRESETS.map(p => (
                  <button
                    key={p.value}
                    className={`ig-filter-chip ${filters.priceRange === p.value ? 'active' : ''}`}
                    onClick={() => updateFilters({ priceRange: filters.priceRange === p.value ? '' : p.value })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type — icon filter buttons */}
            <div className="ig-filter-row">
              <span className="ig-filter-chip-label">Type</span>
              <div className="ig-filter-type-grid">
                {PROPERTY_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`ig-filter-type-btn ${filters.propertyType?.includes(t.value) ? 'active' : ''}`}
                    onClick={() => toggleArrayFilter('propertyType', t.value)}
                  >
                    <span className="ig-filter-type-icon">{t.icon}</span>
                    <span className="ig-filter-type-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms — chip buttons */}
            <div className="ig-filter-row">
              <span className="ig-filter-chip-label">BHK</span>
              <div className="ig-filter-chips">
                <button
                  className={`ig-filter-chip ${!filters.bedrooms ? 'active' : ''}`}
                  onClick={() => updateFilters({ bedrooms: null })}
                >
                  Any
                </button>
                {BEDROOMS.map(b => (
                  <button
                    key={b}
                    className={`ig-filter-chip ${filters.bedrooms === b ? 'active' : ''}`}
                    onClick={() => updateFilters({ bedrooms: filters.bedrooms === b ? null : b })}
                  >
                    {b} BHK
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities — chip buttons */}
            <div className="ig-filter-row">
              <span className="ig-filter-chip-label">Amenities</span>
              <div className="ig-filter-chips">
                {AMENITIES.map(a => (
                  <button
                    key={a}
                    className={`ig-filter-chip ${filters.amenities?.includes(a) ? 'active' : ''}`}
                    onClick={() => toggleArrayFilter('amenities', a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Status — chip buttons */}
            <div className="ig-filter-row">
              <span className="ig-filter-chip-label">Status</span>
              <div className="ig-filter-chips">
                {LISTING_STATUS.map(status => (
                  <button
                    key={status}
                    className={`ig-filter-chip ${filters.listingStatus?.includes(status) ? 'active' : ''}`}
                    onClick={() => toggleArrayFilter('listingStatus', status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="ig-quick-actions-card">
            <h4 className="ig-quick-actions-title">Quick Tools</h4>
            <div className="ig-quick-actions-grid">
              <button className="ig-quick-action" onClick={() => setActiveModal({ type: 'quiz' })}>
                <span className="ig-quick-action-icon">🤖</span>
                <span>AI Quiz</span>
              </button>
              <button className="ig-quick-action" onClick={() => setActiveModal({ type: 'roi' })}>
                <span className="ig-quick-action-icon">📊</span>
                <span>ROI Calc</span>
              </button>
              <button className="ig-quick-action" onClick={() => setActiveModal({ type: 'mortgage' })}>
                <span className="ig-quick-action-icon">🏦</span>
                <span>Mortgage</span>
              </button>
              <button className="ig-quick-action" onClick={() => setCurrentView('compare')}>
                <span className="ig-quick-action-icon">⚖️</span>
                <span>Compare</span>
              </button>
              <button className="ig-quick-action" onClick={() => setActiveModal({ type: 'tour' })}>
                <span className="ig-quick-action-icon">📅</span>
                <span>Tour</span>
              </button>
              <button className="ig-quick-action" onClick={() => setActiveModal({ type: 'currency' })}>
                <span className="ig-quick-action-icon">💱</span>
                <span>Currency</span>
              </button>
              <button className="ig-quick-action" onClick={() => setActiveModal({ type: 'alerts' })}>
                <span className="ig-quick-action-icon">🔔</span>
                <span>Alerts</span>
              </button>
              <button className="ig-quick-action" onClick={() => setActiveModal({ type: 'reviews', data: { propertyId: 1 } })}>
                <span className="ig-quick-action-icon">⭐</span>
                <span>Reviews</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}