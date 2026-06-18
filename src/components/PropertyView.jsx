import { useState, useMemo, useEffect } from 'react';
import { useApp, deriveCity } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import PropertyCard from './PropertyCard';

// =============================================================================
// PropertyView — full dedicated page for a single property/project listing.
// Renders when `currentView === 'property'` (selectedPropertyId set via
// openProperty(id)). Replaces the modal-based detail view for a much richer,
// link-shareable experience.
// =============================================================================

function StickyCta({ property, onSchedule, onMortgage, onSave, saved }) {
  return (
    <div className="pi-prop-sticky">
      <div className="pi-prop-sticky-info">
        <span className="pi-prop-sticky-price">{formatPriceIndian(property.price)}</span>
        <span className="pi-prop-sticky-meta">
          {property.bedrooms && <>{property.bedrooms} BHK · </>}
          {property.area && <>{property.area} sq.ft</>}
        </span>
      </div>
      <div className="pi-prop-sticky-actions">
        <button className={`pi-prop-sticky-save ${saved ? 'saved' : ''}`} onClick={onSave} title={saved ? 'Saved' : 'Save'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
        </button>
        <button className="pi-prop-sticky-btn ghost" onClick={onMortgage}>🏦 EMI</button>
        <button className="pi-prop-sticky-btn primary" onClick={onSchedule}>📅 Schedule Visit</button>
      </div>
    </div>
  );
}

export default function PropertyView() {
  const {
    allProperties,
    selectedPropertyId,
    setCurrentView,
    setActiveModal,
    openProperty,
    openBuilder,
    savedIds,
    toggleSave,
    addRecentView,
  } = useApp();

  const property = useMemo(
    () => allProperties.find(p => p.id === selectedPropertyId),
    [allProperties, selectedPropertyId]
  );

  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (property?.id) addRecentView(property.id);
    setActiveImg(0);
  }, [property?.id, addRecentView]);

  const similar = useMemo(() => {
    if (!property) return [];
    return allProperties
      .filter(p => p.id !== property.id && (p.builder === property.builder || p.city === property.city))
      .slice(0, 6);
  }, [allProperties, property]);

  if (!property) {
    return (
      <div className="pi-prop-empty">
        <span>🏠</span>
        <h3>Property not found</h3>
        <p>This listing may have been removed or the link is invalid.</p>
        <button className="pi-builder-back" onClick={() => setCurrentView('feed')}>← Back to home</button>
      </div>
    );
  }

  const media = property.media || property.images || [];
  const isSaved = savedIds?.includes(property.id);
  const city = property.city || deriveCity(property.location || '');

  return (
    <div className="pi-prop-page">
      {/* ─────── Top bar (back / share) ─────── */}
      <div className="pi-prop-topbar">
        <button className="pi-prop-back" onClick={() => setCurrentView('feed')}>← Browse all properties</button>
        <div className="pi-prop-topbar-actions">
          <button onClick={() => {
            if (navigator.share) navigator.share({ title: property.title, url: window.location.href }).catch(() => {});
            else { navigator.clipboard?.writeText(window.location.href); }
          }}>↗ Share</button>
          <button className={isSaved ? 'saved' : ''} onClick={() => toggleSave(property.id)}>
            {isSaved ? '♥ Saved' : '♡ Save'}
          </button>
        </div>
      </div>

      {/* ─────── Gallery hero ─────── */}
      <section className="pi-prop-gallery">
        <div className="pi-prop-gallery-main" onClick={() => setActiveModal({ type: 'gallery', data: { propertyId: property.id, startIndex: activeImg } })}>
          {media[activeImg]
            ? <img src={media[activeImg]} alt={property.title} />
            : <div className="pi-prop-gallery-fallback">No image</div>
          }
          <div className="pi-prop-gallery-badges">
            {property.verified && <span className="pi-prop-badge verified">✓ Verified</span>}
            {property.rera && <span className="pi-prop-badge rera">🏛️ RERA</span>}
            {property.trending && <span className="pi-prop-badge hot">🔥 Trending</span>}
          </div>
          <span className="pi-prop-gallery-count">{activeImg + 1} / {media.length || 1}</span>
        </div>
        {media.length > 1 && (
          <div className="pi-prop-gallery-thumbs">
            {media.slice(0, 5).map((src, i) => (
              <button
                key={i}
                className={`pi-prop-thumb ${i === activeImg ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="pi-prop-body">
        {/* ─────── LEFT column — details ─────── */}
        <div className="pi-prop-main">
          <header className="pi-prop-header">
            <h1>{property.title}</h1>
            <p className="pi-prop-loc">📍 {property.location}</p>
            <div className="pi-prop-quick">
              {property.bedrooms && <span><strong>{property.bedrooms}</strong> BHK</span>}
              {property.bathrooms && <span><strong>{property.bathrooms}</strong> Bath</span>}
              {property.area && <span><strong>{property.area}</strong> sq.ft</span>}
              {property.facing && property.facing !== 'Not Set' && <span><strong>{property.facing}</strong> Facing</span>}
              {property.floor && <span>Floor: <strong>{property.floor}</strong></span>}
            </div>
          </header>

          {/* About */}
          {property.description && (
            <section className="pi-prop-section">
              <h2>📖 About this project</h2>
              <p className="pi-prop-desc">{property.description}</p>
            </section>
          )}

          {/* Key specs grid */}
          <section className="pi-prop-section">
            <h2>📋 Key details</h2>
            <div className="pi-prop-specs">
              <div><label>Price</label><strong>{formatPriceIndian(property.price)}</strong></div>
              {property.pricePerSqft && <div><label>Per sq.ft</label><strong>₹{property.pricePerSqft.toLocaleString('en-IN')}</strong></div>}
              {property.type && <div><label>Type</label><strong>{property.type}</strong></div>}
              {property.possession && <div><label>Possession</label><strong>{property.possession}</strong></div>}
              {property.furnishing && <div><label>Furnishing</label><strong>{property.furnishing}</strong></div>}
              {property.listingStatus && <div><label>Status</label><strong>{property.listingStatus}</strong></div>}
              {property.parking && <div><label>Parking</label><strong>{property.parking}</strong></div>}
              {property.reraId && <div><label>RERA ID</label><strong className="pi-prop-rera">{property.reraId}</strong></div>}
            </div>
          </section>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <section className="pi-prop-section">
              <h2>✨ Amenities</h2>
              <div className="pi-prop-amenities">
                {property.amenities.map(a => (
                  <span key={a} className="pi-prop-amenity">{a}</span>
                ))}
              </div>
            </section>
          )}

          {/* Neighborhood */}
          {Array.isArray(property.neighborhood) && property.neighborhood.length > 0 && (
            <section className="pi-prop-section">
              <h2>🏘️ Neighborhood</h2>
              <ul className="pi-prop-neighborhood">
                {property.neighborhood.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </section>
          )}

          {/* Tools */}
          <section className="pi-prop-section pi-prop-tools">
            <h2>🛠️ Tools</h2>
            <div className="pi-prop-tools-grid">
              <button onClick={() => setActiveModal({ type: 'mortgage', data: { propertyId: property.id } })}>
                <span>🏦</span><strong>EMI Calculator</strong><span className="hint">Calculate monthly payment</span>
              </button>
              <button onClick={() => setActiveModal({ type: 'roi', data: { propertyId: property.id } })}>
                <span>📈</span><strong>ROI Calculator</strong><span className="hint">Project returns over time</span>
              </button>
              <button onClick={() => setActiveModal({ type: 'compare' })}>
                <span>⚖️</span><strong>Compare</strong><span className="hint">Side-by-side comparison</span>
              </button>
              <button onClick={() => setActiveModal({ type: 'tour', data: { propertyId: property.id } })}>
                <span>📅</span><strong>Schedule Visit</strong><span className="hint">Book a guided tour</span>
              </button>
            </div>
          </section>
        </div>

        {/* ─────── RIGHT column — sidebar ─────── */}
        <aside className="pi-prop-side">
          {/* Price card */}
          <div className="pi-prop-price-card">
            <span className="pi-prop-price">{formatPriceIndian(property.price)}</span>
            {property.pricePerSqft && (
              <span className="pi-prop-price-sub">₹{property.pricePerSqft.toLocaleString('en-IN')}/sq.ft</span>
            )}
            {property.emiEstimate > 0 && (
              <span className="pi-prop-emi-line">EMI from ₹{property.emiEstimate.toLocaleString('en-IN')}/mo</span>
            )}
            <button className="pi-prop-cta primary" onClick={() => setActiveModal({ type: 'tour', data: { propertyId: property.id } })}>
              📅 Schedule Site Visit
            </button>
            <button className="pi-prop-cta ghost" onClick={() => setActiveModal({ type: 'mortgage', data: { propertyId: property.id } })}>
              🏦 Get Home Loan Quote
            </button>
            <button className={`pi-prop-cta save ${isSaved ? 'saved' : ''}`} onClick={() => toggleSave(property.id)}>
              {isSaved ? '♥ Saved' : '♡ Save this property'}
            </button>
          </div>

          {/* Builder card */}
          {property.builder && (
            <button className="pi-prop-builder-card" onClick={() => openBuilder(property.builder)}>
              <span className="pi-prop-builder-eyebrow">Built by</span>
              <strong>{property.builder}</strong>
              <span className="pi-prop-builder-cta">View all projects →</span>
            </button>
          )}

          {/* Agent */}
          {property.agent && (
            <div className="pi-prop-agent">
              <img src={property.agent.avatar || property.agentAvatar} alt={property.agent.name} />
              <div>
                <strong>{property.agent.name}</strong>
                <span>{property.agent.company || 'PropertyInsta Realty'}</span>
                {property.agent.rating && <span className="pi-prop-agent-rating">⭐ {property.agent.rating} · {property.agent.sales} sales</span>}
              </div>
              <button onClick={() => setActiveModal({ type: 'tour', data: { propertyId: property.id } })}>Contact</button>
            </div>
          )}
        </aside>
      </div>

      {/* ─────── Similar projects ─────── */}
      {similar.length > 0 && (
        <section className="pi-prop-similar">
          <h2>🔍 Similar projects in {city || 'your area'}</h2>
          <div className="pi-prop-similar-row">
            {similar.map(p => (
              <div key={p.id} onClick={() => openProperty(p.id)} style={{ cursor: 'pointer' }}>
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────── Sticky bottom CTA (always visible) ─────── */}
      <StickyCta
        property={property}
        saved={isSaved}
        onSave={() => toggleSave(property.id)}
        onSchedule={() => setActiveModal({ type: 'tour', data: { propertyId: property.id } })}
        onMortgage={() => setActiveModal({ type: 'mortgage', data: { propertyId: property.id } })}
      />
    </div>
  );
}
