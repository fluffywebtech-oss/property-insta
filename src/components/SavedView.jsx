import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';

export default function SavedView() {
  const {
    savedIds,
    allProperties,
    toggleSave,
    addRecentView,
    setActiveModal,
    setCurrentView,
    openProperty,
  } = useApp();

  const [sortBy, setSortBy] = useState('newest');

  const savedProperties = allProperties
    .filter(p => savedIds.includes(p.id))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return b.id - a.id;
    });

  const grouped = savedProperties.reduce((acc, prop) => {
    const loc = prop.location || 'Other';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(prop);
    return acc;
  }, {});

  return (
    <div className="ig-saved-view">
      <div className="ig-saved-header">
        <h2>🔖 Saved Properties ({savedProperties.length})</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="saved-sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {savedProperties.length === 0 ? (
        <div className="ig-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          <h3>No saved properties yet</h3>
          <p>Tap the bookmark icon on any property to save it here</p>
          <button className="ig-load-more-btn" onClick={() => setCurrentView('feed')}>
            Browse Properties
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([location, props]) => (
          <div key={location} className="ig-saved-group">
            <h3 className="ig-saved-group-title">{location}</h3>
            <div className="ig-feed-grid">
              {props.map(prop => (
                <div
                  key={prop.id}
                  className="ig-saved-card"
                  onClick={() => openProperty(prop.id)}
                >
                  <div className="ig-card-media">
                    {prop.media && prop.media.length > 0 ? (
                      <img src={prop.media[0]} alt={prop.title} />
                    ) : (
                      <div className="ig-card-img-fallback">No Image</div>
                    )}
                    {prop.badge && (
                      <span className={`ig-card-badge ${prop.badgeType || ''}`}>{prop.badge}</span>
                    )}
                    <button
                      className="card-save-btn saved"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(prop.id);
                      }}
                    >
                      🔖
                    </button>
                    <div className="ig-card-overlay-info">
                      <span className="ig-card-price">{formatPriceIndian(prop.price)}</span>
                    </div>
                  </div>
                  <div className="ig-card-body">
                    <h3 className="ig-card-title">{prop.title}</h3>
                    <p className="ig-card-location">{prop.location}</p>
                    <div className="ig-card-specs">
                      {prop.bedrooms && <span>{prop.bedrooms} BHK</span>}
                      {prop.bathrooms && <span>{prop.bathrooms} Bath</span>}
                      {prop.area && <span>{prop.area} sq.ft</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}