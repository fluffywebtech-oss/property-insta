import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';

// Add VITE_GOOGLE_MAPS_API_KEY to .env to use the real Google Maps Embed API.
// Without a key, Google blocks iframe embedding, so we fall back to a free,
// embeddable OpenStreetMap (real interactive map, no key required).
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function gmapQuery(p) {
  if (p && p.lat && p.lng) return `${p.lat},${p.lng}`;
  return encodeURIComponent(((p && p.location) || 'India') + ', India');
}

function osmSrc(lat, lng, span = 0.06) {
  const bbox = [lng - span, lat - span * 0.8, lng + span, lat + span * 0.8].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

const DEFAULT_LAT = 28.6139;  // Delhi
const DEFAULT_LNG = 77.2090;

function mapSrc(center, zoom = 14) {
  if (GMAPS_KEY) {
    if (!center) return `https://www.google.com/maps/embed/v1/view?key=${GMAPS_KEY}&center=22.5,79&zoom=4`;
    return `https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${gmapQuery(center)}&zoom=${zoom}`;
  }
  // OpenStreetMap fallback (needs coordinates)
  const lat = (center && center.lat) || DEFAULT_LAT;
  const lng = (center && center.lng) || DEFAULT_LNG;
  const span = zoom >= 15 ? 0.025 : 0.08;
  return osmSrc(lat, lng, span);
}

export default function MapView() {
  const { allProperties, addRecentView, setActiveModal } = useApp();
  const [mapFilter, setMapFilter] = useState('all');
  const [selectedProp, setSelectedProp] = useState(null);

  const filtered = useMemo(() => allProperties.filter(p => {
    if (mapFilter === 'all') return true;
    if (mapFilter === 'luxury') return p.price >= 10000000;
    if (mapFilter === 'affordable') return p.price < 5000000;
    return p.type === mapFilter;
  }), [allProperties, mapFilter]);

  const center = selectedProp || filtered[0];
  const src = mapSrc(center, selectedProp ? 15 : 12);

  const selectProperty = (p) => {
    setSelectedProp(p);
    addRecentView(p.id);
  };

  return (
    <div id="mapView" className="ig-gmap-page">
      <div className="ig-map-header">
        <div>
          <h3>📍 Property Map</h3>
          <span className="ig-gmap-count">{filtered.length} properties</span>
        </div>
        <div className="ig-map-controls">
          <select value={mapFilter} onChange={(e) => { setMapFilter(e.target.value); setSelectedProp(null); }}>
            <option value="all">All Properties</option>
            <option value="luxury">Luxury (₹1Cr+)</option>
            <option value="affordable">{'Affordable (<₹50L)'}</option>
            <option value="Apartment">Apartments</option>
            <option value="Villa">Villas</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
      </div>

      <div className="ig-gmap-wrap">
        {/* Real Google Map */}
        <div className="ig-gmap-frame">
          <iframe
            title="Property location map"
            src={src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />

          {/* Selected property overlay card */}
          {selectedProp && (
            <div className="ig-gmap-selected">
              <img
                className="ig-gmap-selected-img"
                src={selectedProp.media?.[0] || selectedProp.thumbnail || ''}
                alt={selectedProp.title}
              />
              <div className="ig-gmap-selected-info">
                <h4>{selectedProp.title}</h4>
                <p className="ig-gmap-selected-loc">{selectedProp.location}</p>
                <p className="ig-gmap-selected-price">{formatPriceIndian(selectedProp.price)}</p>
                <div className="ig-gmap-selected-specs">
                  {selectedProp.bedrooms && <span>{selectedProp.bedrooms} BHK</span>}
                  {selectedProp.bathrooms && <span>{selectedProp.bathrooms} Bath</span>}
                  {selectedProp.area && <span>{selectedProp.area} sq.ft</span>}
                </div>
                <button
                  className="ig-gmap-view-btn"
                  onClick={() => setActiveModal({ type: 'property', data: { propertyId: selectedProp.id } })}
                >
                  View Details →
                </button>
              </div>
              <button className="ig-gmap-selected-close" onClick={() => setSelectedProp(null)} title="Close">✕</button>
            </div>
          )}
        </div>

        {/* Property list — click to locate on the map */}
        <div className="ig-gmap-list">
          {filtered.map(p => (
            <button
              key={p.id}
              className={`ig-gmap-item ${selectedProp?.id === p.id ? 'active' : ''}`}
              onClick={() => selectProperty(p)}
            >
              <img className="ig-gmap-item-img" src={p.media?.[0] || p.thumbnail || ''} alt={p.title} loading="lazy" />
              <div className="ig-gmap-item-info">
                <span className="ig-gmap-item-title">{p.title}</span>
                <span className="ig-gmap-item-loc">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {p.location}
                </span>
                <span className="ig-gmap-item-price">{formatPriceIndian(p.price)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
