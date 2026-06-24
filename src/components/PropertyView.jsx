import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useApp, deriveCity } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import { whatsappLink, leadMessage } from '../utils/leads';
import PropertyCard from './PropertyCard';

const PropertyTour = lazy(() => import('./PropertyTour'));
const Property3DShowcase = lazy(() => import('./Property3DShowcase'));

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
  const [tourOpen, setTourOpen] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [mode3d, setMode3d] = useState('exterior');

  useEffect(() => {
    if (property?.id) addRecentView(property.id);
    setActiveImg(0);
    setTourOpen(false);
    setShow3d(false);
  }, [property?.id, addRecentView]);

  const open3d = (mode) => { setMode3d(mode); setShow3d(true); };

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
          <div className="pi-prop-launch-stack">
            <button
              className="pi-prop-tour-launch"
              onClick={(e) => { e.stopPropagation(); setTourOpen(true); }}
            >
              <span className="pi-prop-tour-launch-icon">▶</span>
              <span className="pi-prop-tour-launch-text">
                <strong>Play guided tour</strong>
                <small>An agent walks you through · with voice</small>
              </span>
            </button>
            <button
              className="pi-prop-tour-launch pi-prop-3d-launch"
              onClick={(e) => { e.stopPropagation(); open3d('exterior'); }}
            >
              <span className="pi-prop-tour-launch-icon cube">◧</span>
              <span className="pi-prop-tour-launch-text">
                <strong>View in 3D</strong>
                <small>Rotate the building · AI 3D advisor</small>
              </span>
            </button>
            <button
              className="pi-prop-tour-launch pi-prop-int-launch"
              onClick={(e) => { e.stopPropagation(); open3d('interior'); }}
            >
              <span className="pi-prop-tour-launch-icon room">⌂</span>
              <span className="pi-prop-tour-launch-text">
                <strong>Interior tour</strong>
                <small>Walk the furnished home · with voice</small>
              </span>
            </button>
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

          {/* PropScore™ breakdown */}
          {property.propScore && (
            <section className="pi-prop-section pi-propscore-panel">
              <h2>📊 PropScore™ — AI Investment Score</h2>
              <div className="pi-ps-head">
                <div className="pi-ps-ring" style={{ '--ps-color': property.propScore.color, '--ps-pct': property.propScore.score }}>
                  <svg viewBox="0 0 80 80" width="96" height="96">
                    <circle className="pi-ps-track" cx="40" cy="40" r="34" />
                    <circle
                      className="pi-ps-fill"
                      cx="40" cy="40" r="34"
                      style={{ stroke: property.propScore.color, strokeDasharray: 2 * Math.PI * 34, strokeDashoffset: 2 * Math.PI * 34 * (1 - property.propScore.score / 100) }}
                    />
                  </svg>
                  <div className="pi-ps-ring-num">
                    <strong>{property.propScore.score}</strong>
                    <span>/ 100</span>
                  </div>
                </div>
                <div className="pi-ps-head-info">
                  <span className="pi-ps-grade" style={{ background: property.propScore.color }}>
                    {property.propScore.grade} · {property.propScore.tag}
                  </span>
                  <p className="pi-ps-summary">{property.propScore.summary}</p>
                </div>
              </div>

              <div className="pi-ps-factors">
                {property.propScore.factors.map(f => (
                  <div key={f.key} className="pi-ps-factor">
                    <div className="pi-ps-factor-top">
                      <span className="pi-ps-factor-label">{f.label}</span>
                      <span className="pi-ps-factor-score">{f.score}</span>
                    </div>
                    <div className="pi-ps-factor-bar">
                      <span style={{ width: `${f.score}%`, background: property.propScore.color }} />
                    </div>
                    <div className="pi-ps-factor-foot">
                      <span className="pi-ps-factor-hint">{f.hint}</span>
                      <span className="pi-ps-factor-weight">{f.weight}% weight</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="pi-ps-disclaimer">PropScore™ is an algorithmic estimate from value, builder, locality, rental yield & lifestyle signals — not financial advice.</p>
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
              <button className="pi-prop-tool-3d" onClick={() => open3d('exterior')}>
                <span>🧊</span><strong>3D Showcase</strong><span className="hint">Rotate + AI 3D advisor</span>
              </button>
              <button className="pi-prop-tool-int" onClick={() => open3d('interior')}>
                <span>🛋️</span><strong>Interior Tour</strong><span className="hint">Walk the furnished home</span>
              </button>
              <button className="pi-prop-tool-tour" onClick={() => setTourOpen(true)}>
                <span>🎧</span><strong>Guided Tour</strong><span className="hint">Agent narrates with voice</span>
              </button>
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
            <button className="pi-prop-cta three-d" onClick={() => open3d('exterior')}>
              🧊 View in 3D + Advisor
            </button>
            <button className="pi-prop-cta interior" onClick={() => open3d('interior')}>
              🛋️ Walk the Interior
            </button>
            <button className="pi-prop-cta tour" onClick={() => setTourOpen(true)}>
              🎧 Play Guided Tour
            </button>
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

          {/* Agent + lead funnel */}
          {property.agent && (
            <div className="pi-prop-agent-card">
              <div className="pi-prop-agent">
                <img src={property.agent.avatar || property.agentAvatar} alt={property.agent.name} />
                <div>
                  <strong>{property.agent.name}</strong>
                  <span>{property.agent.company || 'PropertyInsta Realty'}</span>
                  {property.agent.rating && <span className="pi-prop-agent-rating">⭐ {property.agent.rating} · {property.agent.sales} sales</span>}
                </div>
              </div>
              <div className="pi-prop-lead-actions">
                <button className="pi-lead-btn primary" onClick={() => setActiveModal({ type: 'lead', data: { propertyId: property.id, intent: 'contact' } })}>💬 Contact Agent</button>
                <button className="pi-lead-btn" onClick={() => setActiveModal({ type: 'lead', data: { propertyId: property.id, intent: 'visit' } })}>📅 Site Visit</button>
                <button className="pi-lead-btn" onClick={() => setActiveModal({ type: 'lead', data: { propertyId: property.id, intent: 'callback' } })}>📞 Callback</button>
              </div>
              {property.agent.phone && (
                <a
                  className="pi-lead-whatsapp"
                  href={whatsappLink(property.agent.phone, leadMessage({ intent: 'contact', property }))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>🟢</span> Chat instantly on WhatsApp
                </a>
              )}
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

      {/* ─────── Guided audio-visual tour overlay ─────── */}
      {tourOpen && (
        <Suspense fallback={null}>
          <PropertyTour
            property={property}
            saved={isSaved}
            onClose={() => setTourOpen(false)}
            onSave={() => toggleSave(property.id)}
            onSchedule={() => setActiveModal({ type: 'tour', data: { propertyId: property.id } })}
          />
        </Suspense>
      )}

      {/* ─────── 3D showcase + AI advisor overlay ─────── */}
      {show3d && (
        <Suspense fallback={null}>
          <Property3DShowcase
            property={property}
            coverImg={media[0]}
            initialMode={mode3d}
            saved={isSaved}
            onClose={() => setShow3d(false)}
            onSave={() => toggleSave(property.id)}
            onSchedule={() => setActiveModal({ type: 'tour', data: { propertyId: property.id } })}
          />
        </Suspense>
      )}
    </div>
  );
}
