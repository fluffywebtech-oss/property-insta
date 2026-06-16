import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';

export default function MapView() {
  const { allProperties, addRecentView, setActiveModal } = useApp();
  const [mapFilter, setMapFilter] = useState('all');
  const [selectedProp, setSelectedProp] = useState(null);

  const filtered = allProperties.filter(p => {
    if (mapFilter === 'all') return true;
    if (mapFilter === 'luxury') return p.price >= 10000000;
    if (mapFilter === 'affordable') return p.price < 5000000;
    return p.type === mapFilter;
  });

  return (
    <div id="mapView" className="">
      <div className="ig-map-header">
        <h3>Property Map</h3>
        <div className="ig-map-controls">
          <select
            value={mapFilter}
            onChange={(e) => setMapFilter(e.target.value)}
          >
            <option value="all">All Properties</option>
            <option value="luxury">Luxury (₹1Cr+)</option>
            <option value="affordable">{'Affordable (<₹50L)'}</option>
            <option value="Apartment">Apartments</option>
            <option value="Villa">Villas</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
      </div>

      <div id="mapContainer" className="ig-map-container">
        <div className="ig-map-placeholder">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <p>Map View</p>
          <span className="map-hint">Showing {filtered.length} properties across major cities</span>
        </div>

        {/* Property Pins */}
        <div className="ig-map-pins">
          {filtered.map((prop, idx) => {
            // Deterministic jitter (stable across re-renders) from the index
            const jitterT = ((idx * 37) % 10) / 2;   // 0–4.5
            const jitterL = ((idx * 53) % 10) / 2;   // 0–4.5
            const top = 25 + (idx % 5) * 15 + jitterT;
            const left = 15 + Math.floor(idx / 5) * 16 + jitterL;
            return (
              <button
                key={prop.id}
                className={`ig-map-pin ${selectedProp?.id === prop.id ? 'active' : ''}`}
                style={{ top: `${top}%`, left: `${left}%` }}
                onClick={() => {
                  setSelectedProp(prop);
                  addRecentView(prop.id);
                }}
                title={`${prop.title} – ${formatPriceIndian(prop.price)}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" /></svg>
              </button>
            );
          })}
        </div>

        {/* Selected Property Card */}
        {selectedProp && (
          <div className="ig-map-selected">
            <div className="ig-map-selected-inner">
              <div className="ig-map-selected-media">
                {selectedProp.media && selectedProp.media.length > 0 ? (
                  <img src={selectedProp.media[0]} alt={selectedProp.title} />
                ) : (
                  <div className="ig-card-img-fallback" style={{ height: 120 }}>No Image</div>
                )}
              </div>
              <div className="ig-map-selected-info">
                <h4>{selectedProp.title}</h4>
                <p className="ig-card-location">{selectedProp.location}</p>
                <p className="ig-card-price">{formatPriceIndian(selectedProp.price)}</p>
                <div className="ig-card-specs">
                  {selectedProp.bedrooms && <span>{selectedProp.bedrooms} BHK</span>}
                  {selectedProp.bathrooms && <span>{selectedProp.bathrooms} Bath</span>}
                  {selectedProp.area && <span>{selectedProp.area} sq.ft</span>}
                </div>
                <button
                  className="ig-load-more-btn"
                  onClick={() => setActiveModal({ type: 'property', data: { propertyId: selectedProp.id } })}
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}