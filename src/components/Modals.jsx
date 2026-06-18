import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  propertyStories,
  propertyReviews,
  quizQuestions,
  agents,
  formatPriceIndian,
} from '../data';

// ==================== Story Modal ====================
function StoryModal() {
  const { activeModal, setActiveModal } = useApp();
  const { index } = activeModal.data || {};
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / 5000) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        setTimeout(() => close(), 300);
      }
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [index]);

  const close = () => setActiveModal(null);

  const story = propertyStories[index];
  if (!story) return null;

  return (
    <div className="story-modal-backdrop" onClick={close}>
      <div className="story-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="story-modal-close" onClick={close}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        {/* Progress Bars */}
        <div className="story-progress-bars">
          {propertyStories.map((_, i) => (
            <div key={i} className="story-progress-track">
              <div
                className="story-progress-fill"
                style={{
                  width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                  transition: i === index ? 'width 50ms linear' : 'none',
                }}
              />
            </div>
          ))}
        </div>

        <div className="story-modal-media">
          <img src={story.image} alt={story.city} />
          <div className="story-modal-info">
            <div className="story-modal-city">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {story.city}
            </div>
            <span className="story-modal-count">{story.count} properties</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Property Detail Modal ====================
function PropertyDetailModal() {
  const { activeModal, setActiveModal, savedIds, toggleSave, compareIds, toggleCompare, likedIds, toggleLike, addRecentView, allProperties } = useApp();
  const { propertyId } = activeModal.data || {};
  const [activeImg, setActiveImg] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const property = allProperties.find(p => p.id === propertyId);
  if (!property) return null;

  const isSaved = savedIds.includes(property.id);
  const isLiked = likedIds.includes(property.id);
  const isCompared = compareIds.includes(property.id);
  const reviews = propertyReviews[property.id] || [];
  const agent = agents[property.agent.id] || property.agent;

  const close = () => setActiveModal(null);

  return (
    <div className="prop-modal-backdrop" onClick={close}>
      <div className="prop-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        {/* Media Gallery */}
        <div className="prop-modal-media">
          {property.media && property.media.length > 0 ? (
            <>
              <img src={property.media[activeImg]} alt={`${property.title} - ${activeImg + 1}`} />
              {property.media.length > 1 && (
                <>
                  <button
                    className="ig-card-media-nav prev"
                    onClick={() => setActiveImg(p => p === 0 ? property.media.length - 1 : p - 1)}
                  >〈</button>
                  <button
                    className="ig-card-media-nav next"
                    onClick={() => setActiveImg(p => p === property.media.length - 1 ? 0 : p + 1)}
                  >〉</button>
                  <div className="ig-card-dots">
                    {property.media.map((_, i) => (
                      <button key={i} className={`ig-card-dot ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="ig-card-img-fallback" style={{ height: 350 }}>No Image Available</div>
          )}
        </div>

        {/* Content */}
        <div className="prop-modal-body">
          <div className="prop-modal-header-row">
            <div>
              <div className="prop-modal-badges">
                {property.badge && <span className="modal-badge">{property.badge}</span>}
                {property.verified && <span className="modal-badge verified">✓ Verified</span>}
                {property.rera && <span className="modal-badge rera">🏛️ RERA</span>}
              </div>
              <h2>{property.title}</h2>
              <p className="prop-modal-location">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {property.location}
              </p>
            </div>
            <div className="prop-modal-price">{formatPriceIndian(property.price)}</div>
          </div>

          {/* Quick Stats */}
          <div className="prop-modal-specs">
            {property.bedrooms && <div className="spec-item"><strong>{property.bedrooms}</strong><span>BHK</span></div>}
            {property.area && <div className="spec-item"><strong>{property.area}</strong><span>sq.ft</span></div>}
            {property.bathrooms && <div className="spec-item"><strong>{property.bathrooms}</strong><span>Bath</span></div>}
            {property.floor && <div className="spec-item"><strong>{property.floor}</strong><span>Floor</span></div>}
            {property.age && <div className="spec-item"><strong>{property.age}</strong><span>Age</span></div>}
            {property.pricePerSqft && <div className="spec-item"><strong>₹{property.pricePerSqft}</strong><span>/sqft</span></div>}
            {property.views > 0 && <div className="spec-item"><strong>{property.views >= 1000 ? (property.views/1000).toFixed(1)+'k' : property.views}</strong><span>Views</span></div>}
          </div>

          {/* Description */}
          {property.description && (
            <div className="prop-modal-section">
              <h4>Description</h4>
              <p className={!showFullDesc ? 'truncated' : ''}>
                {showFullDesc ? property.description : property.description.slice(0, 200) + '...'}
              </p>
              {property.description.length > 200 && (
                <button className="text-link" onClick={() => setShowFullDesc(!showFullDesc)}>
                  {showFullDesc ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Financial: EMI & Bank Offers */}
          {(property.emiEstimate || property.bankOffers) && (
            <div className="prop-modal-section">
              <h4>💰 Financial Info</h4>
              <div className="prop-financial-row">
                {property.emiEstimate > 0 && (
                  <div className="financial-card emi">
                    <span className="financial-icon">🏦</span>
                    <div>
                      <span className="financial-label">Estimated EMI</span>
                      <strong>₹{property.emiEstimate.toLocaleString('en-IN')}/mo</strong>
                    </div>
                  </div>
                )}
                {property.bankOffers && (
                  <div className="financial-card offers">
                    <span className="financial-icon">🎁</span>
                    <div>
                      <span className="financial-label">Bank Offers</span>
                      <strong>{typeof property.bankOffers === 'string' ? property.bankOffers : 'Available'}</strong>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="text-link"
                onClick={() => setActiveModal({ type: 'mortgage', data: { propertyId: property.id, price: property.price } })}
              >
                📊 Open EMI Calculator
              </button>
            </div>
          )}

          {/* Detail Grid */}
          <div className="prop-modal-section">
            <h4>Property Details</h4>
            <div className="prop-detail-grid">
              {property.type && <div className="detail-item"><span>Type</span><strong>{property.type}</strong></div>}
              {property.status && <div className="detail-item"><span>Status</span><strong>{property.status}</strong></div>}
              {property.furnishing && <div className="detail-item"><span>Furnishing</span><strong>{property.furnishing}</strong></div>}
              {property.facing && <div className="detail-item"><span>Facing</span><strong>{property.facing}</strong></div>}
              {property.parking && <div className="detail-item"><span>Parking</span><strong>{property.parking}</strong></div>}
              {property.possession && <div className="detail-item"><span>Possession</span><strong>{property.possession}</strong></div>}
              {property.listingStatus && <div className="detail-item"><span>Listing Status</span><strong>{property.listingStatus}</strong></div>}
              {property.reraId && <div className="detail-item"><span>RERA ID</span><strong>{property.reraId}</strong></div>}
              {property.postDate && <div className="detail-item"><span>Posted</span><strong>{property.postDate}</strong></div>}
              {property.builder && <div className="detail-item"><span>Builder</span><strong>{property.builder}</strong></div>}
            </div>
          </div>

          {/* Developer / Builder Info */}
          {(property.builder || property.developerLogo || property.developerWebsite) && (
            <div className="prop-modal-section">
              <h4>🏗️ Developer / Builder</h4>
              <div className="prop-developer-row">
                {property.developerLogo && (
                  <img src={property.developerLogo} alt={property.builder || 'Developer'} className="developer-logo" />
                )}
                <div className="developer-info">
                  {property.builder && <strong className="developer-name">{property.builder}</strong>}
                  {property.developerWebsite && (
                    <a href={property.developerWebsite} target="_blank" rel="noopener noreferrer" className="developer-website-link">
                      🌐 Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="prop-modal-section">
              <h4>Amenities</h4>
              <div className="prop-modal-amenities">
                {property.amenities.map(a => (
                  <span key={a} className="amenity-chip">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Neighborhood */}
          {property.neighborhood && property.neighborhood.length > 0 && (
            <div className="prop-modal-section">
              <h4>Nearby</h4>
              <div className="prop-modal-amenities">
                {property.neighborhood.map(n => (
                  <span key={n} className="amenity-chip nearby">{n}</span>
                ))}
              </div>
            </div>
          )}

          {/* Floor Plan */}
          {property.floorPlan && (
            <div className="prop-modal-section">
              <h4>📐 Floor Plan</h4>
              <div className="floor-plan-container">
                <img
                  src={property.floorPlan}
                  alt="Floor Plan"
                  className="floor-plan-img"
                  onClick={() => window.open(property.floorPlan, '_blank')}
                />
                <button
                  className="text-link"
                  onClick={() => window.open(property.floorPlan, '_blank')}
                  style={{ marginTop: 8 }}
                >
                  🔍 View Full Floor Plan
                </button>
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          {(property.comments > 0 || property.shares > 0 || property.views > 0) && (
            <div className="prop-modal-section">
              <h4>📈 Engagement</h4>
              <div className="prop-engagement-row">
                {property.views > 0 && (
                  <div className="engagement-stat">
                    <span>👁️</span>
                    <strong>{property.views >= 1000 ? (property.views/1000).toFixed(1)+'k' : property.views}</strong>
                    <span>Views</span>
                  </div>
                )}
                {property.comments > 0 && (
                  <div className="engagement-stat">
                    <span>💬</span>
                    <strong>{property.comments}</strong>
                    <span>Comments</span>
                  </div>
                )}
                {property.shares > 0 && (
                  <div className="engagement-stat">
                    <span>🔄</span>
                    <strong>{property.shares}</strong>
                    <span>Shares</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="prop-modal-section">
              <h4>Reviews ({reviews.length})</h4>
              {reviews.slice(0, 3).map((r, i) => (
                <div key={i} className="review-card-mini">
                  <div className="review-stars">{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p>{r.comment}</p>
                  <span className="review-author">— {r.user}</span>
                </div>
              ))}
            </div>
          )}

          {/* Agent Section */}
          <div className="prop-modal-section">
            <h4>Listed by</h4>
            <div className="prop-modal-agent">
              <img
                src={agent.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'}
                alt={agent.name}
                width="48"
                height="48"
              />
              <div className="agent-info">
                <strong>{agent.name}</strong>
                {agent.company && <span>{agent.company}</span>}
                {agent.experience && <span>{agent.experience} experience</span>}
                <div className="agent-stats-row">
                  {agent.rating && <span className="agent-stat">⭐ {agent.rating}</span>}
                  {agent.sales > 0 && <span className="agent-stat">🏠 {agent.sales} sold</span>}
                </div>
              </div>
              <div className="agent-actions-col">
                {agent.phone && (
                  <button
                    className="agent-contact-btn"
                    onClick={() => setShowPhone(!showPhone)}
                  >
                    {showPhone ? `📞 ${agent.phone}` : '📞 Call Agent'}
                  </button>
                )}
                {agent.email && (
                  <a href={`mailto:${agent.email}`} className="agent-email-link">
                    ✉️ Email
                  </a>
                )}
                <button className="agent-profile-link text-link"
                  onClick={() => setActiveModal({ type: 'agent', data: { agentId: property.agent.id } })}
                >
                  View Full Profile →
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="prop-modal-actions">
            <button className="modal-action-btn primary" onClick={() => setActiveModal({ type: 'tour', data: { propertyId: property.id } })}>
              📅 Schedule Tour
            </button>
            <button
              className={`modal-action-btn ${isSaved ? 'saved' : ''}`}
              onClick={() => toggleSave(property.id)}
            >
              {isSaved ? '❤️ Saved' : '🤍 Save'}
            </button>
            <button
              className={`modal-action-btn ${isCompared ? 'compared' : ''}`}
              onClick={() => toggleCompare(property.id)}
            >
              {isCompared ? '⚖️ Compared' : '⚖️ Compare'}
            </button>
            <button className="modal-action-btn" onClick={() => setActiveModal({ type: 'reviews', data: { propertyId: property.id } })}>
              ⭐ Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Mortgage Calculator Modal ====================
function MortgageModal() {
  const { setActiveModal } = useApp();
  const [form, setForm] = useState({ amount: '5000000', rate: '8.5', years: '20', downPayment: '1000000' });
  const [results, setResults] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    const P = Number(form.amount) - Number(form.downPayment || 0);
    const r = Number(form.rate) / 12 / 100;
    const n = Number(form.years) * 12;

    if (P <= 0 || r <= 0 || n <= 0) return;

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - P;

    setResults({
      emi: Math.round(emi),
      total: Math.round(total),
      interest: Math.round(interest),
      principal: P,
    });
  };

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="mortgage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏦 Mortgage Calculator</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="mortgage-body">
          <form className="mortgage-form" onSubmit={calculate}>
            <div className="mortgage-field">
              <label>Property Value (₹)</label>
              <input type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} />
            </div>
            <div className="mortgage-field">
              <label>Down Payment (₹)</label>
              <input type="number" value={form.downPayment} onChange={(e) => update('downPayment', e.target.value)} />
            </div>
            <div className="mortgage-field">
              <label>Interest Rate (%)</label>
              <input type="number" step="0.1" value={form.rate} onChange={(e) => update('rate', e.target.value)} />
            </div>
            <div className="mortgage-field">
              <label>Loan Tenure</label>
              <select id="mortgageTerm" value={form.years} onChange={(e) => update('years', e.target.value)}>
                <option value="10">10 Years</option>
                <option value="15">15 Years</option>
                <option value="20">20 Years</option>
                <option value="25">25 Years</option>
                <option value="30">30 Years</option>
              </select>
            </div>
            <button type="submit" className="mortgage-calc-btn">Calculate EMI</button>
          </form>
          {results && (
            <div id="mortgageResults" className="mortgage-results">
              <div className="mortgage-result-card">
                <span>Monthly EMI</span>
                <strong>₹{results.emi.toLocaleString('en-IN')}</strong>
              </div>
              <div className="mortgage-result-card">
                <span>Total Payment</span>
                <strong>₹{results.total.toLocaleString('en-IN')}</strong>
              </div>
              <div className="mortgage-result-card">
                <span>Total Interest</span>
                <strong>₹{results.interest.toLocaleString('en-IN')}</strong>
              </div>
              <div className="mortgage-result-card">
                <span>Principal</span>
                <strong>₹{results.principal.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Tour Scheduler Modal ====================
function TourModal() {
  const { activeModal, setActiveModal } = useApp();
  const { propertyId } = activeModal.data || {};
  const property = allProperties.find(p => p.id === propertyId);
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '10:00', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const schedule = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="tour-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📅 Schedule a Tour</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="tour-body">
          {submitted ? (
            <div className="tour-success">
              <div className="success-icon">✅</div>
              <h3>Tour Scheduled!</h3>
              <p>We'll confirm your visit shortly via email/phone.</p>
              <button className="modal-action-btn primary" onClick={() => setActiveModal(null)}>Done</button>
            </div>
          ) : (
            <>
              {property && (
                <div className="tour-prop-preview">
                  <img src={property.media?.[0]} alt={property.title} />
                  <div>
                    <strong>{property.title}</strong>
                    <span>{formatPriceIndian(property.price)}</span>
                  </div>
                </div>
              )}
              <form className="tour-form" onSubmit={schedule}>
                <div className="tour-field">
                  <label>Full Name</label>
                  <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your full name" />
                </div>
                <div className="tour-field">
                  <label>Email</label>
                  <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@email.com" />
                </div>
                <div className="tour-field">
                  <label>Phone</label>
                  <input type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="tour-field">
                  <label>Preferred Date</label>
                  <input type="date" required value={form.date} onChange={(e) => update('date', e.target.value)} />
                </div>
                <div className="tour-field">
                  <label>Preferred Time</label>
                  <select id="tourTime" value={form.time} onChange={(e) => update('time', e.target.value)}>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
                <div className="tour-field">
                  <label>Message (Optional)</label>
                  <textarea rows="3" value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Any specific requirements..." />
                </div>
                <button type="submit" className="mortgage-calc-btn">Schedule Tour</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Price Alerts Modal ====================
function AlertsModal() {
  const { setActiveModal } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ location: '', budget: '', type: 'price_drop', beds: '' });

  const createAlert = (e) => {
    e.preventDefault();
    if (!form.location) return;
    setAlerts(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ location: '', budget: '', type: 'price_drop', beds: '' });
  };

  const removeAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="alerts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔔 Price Alerts</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="alerts-body">
          <form className="alerts-form" onSubmit={createAlert}>
            <div className="alerts-field">
              <label>Location / City</label>
              <input type="text" required value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Whitefield, Bangalore" />
            </div>
            <div className="alerts-field">
              <label>Budget</label>
              <input type="text" value={form.budget} onChange={(e) => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="e.g. Under ₹1Cr" />
            </div>
            <div className="alerts-field">
              <label>Alert Type</label>
              <select id="alertType" value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="price_drop">Price Drop</option>
                <option value="new_listing">New Listing</option>
                <option value="open_house">Open House</option>
              </select>
            </div>
            <div className="alerts-field">
              <label>Bedrooms</label>
              <select id="alertBeds" value={form.beds} onChange={(e) => setForm(p => ({ ...p, beds: e.target.value }))}>
                <option value="">Any</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>
            </div>
            <button type="submit" className="mortgage-calc-btn">Create Alert</button>
          </form>

          {alerts.length > 0 && (
            <div id="activeAlerts" className="active-alerts">
              <h4>Active Alerts</h4>
              {alerts.map(a => (
                <div key={a.id} className="active-alert-item">
                  <div>
                    <strong>{a.location}</strong>
                    <span>{a.type === 'price_drop' ? '💰 Price Drop' : a.type === 'new_listing' ? '🏠 New Listing' : '📅 Open House'}</span>
                  </div>
                  <button onClick={() => removeAlert(a.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== AI Quiz Modal ====================
function QuizModal() {
  const { setActiveModal, openProperty } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const currentQ = quizQuestions[step];

  const selectOption = (field, value) => {
    setAnswers(p => ({ ...p, [field]: value }));
  };

  const nextStep = () => {
    if (step < quizQuestions.length - 1) {
      setStep(s => s + 1);
    } else {
      // Calculate results
      const budget = answers.budget || 'Mid-range';
      const type = answers.type || 'Apartment';
      const matching = allProperties.filter(p => {
        const budgetMatch = budget === 'Affordable' ? p.price < 5000000
          : budget === 'Mid-range' ? p.price >= 5000000 && p.price < 15000000
          : p.price >= 15000000;
        const typeMatch = !type || p.type === type || type === 'Any';
        return budgetMatch && typeMatch;
      }).slice(0, 4);

      setResults({
        budget,
        type,
        city: answers.city || 'Bangalore',
        matches: matching,
        message: matching.length > 0
          ? `We found ${matching.length} properties matching your preferences!`
          : 'No exact matches found. Try broadening your criteria.',
      });
    }
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🤖 AI Property Quiz</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="quiz-body" id="quizBody">
          {results ? (
            <div className="quiz-results">
              <h4>🎉 Your Personalized Recommendations</h4>
              <p>{results.message}</p>
              <div className="quiz-prefs">
                <span>💰 {results.budget}</span>
                <span>🏠 {results.type}</span>
                <span>📍 {results.city}</span>
              </div>
              {results.matches.length > 0 && (
                <div className="quiz-matches">
                  {results.matches.map(p => (
                    <div key={p.id} className="quiz-match-card"
                      onClick={() => { setActiveModal(null); openProperty(p.id); }}
                    >
                      <img src={p.media?.[0]} alt={p.title} />
                      <div>
                        <strong>{p.title}</strong>
                        <span>{formatPriceIndian(p.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="modal-action-btn primary" onClick={() => { setStep(0); setAnswers({}); setResults(null); }}>
                Retake Quiz
              </button>
            </div>
          ) : currentQ ? (
            <>
              <div className="quiz-progress">
                Question {step + 1} of {quizQuestions.length}
                <div className="quiz-progress-bar">
                  <div style={{ width: `${((step + 1) / quizQuestions.length) * 100}%` }} />
                </div>
              </div>
              <h4 className="quiz-question">{currentQ.question}</h4>
              <div className="quiz-options">
                {currentQ.options.map(opt => (
                  <button
                    key={opt.value}
                    className={`quiz-option ${answers[currentQ.field] === opt.value ? 'selected' : ''}`}
                    onClick={() => selectOption(currentQ.field, opt.value)}
                  >
                    <span className="quiz-option-icon">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="quiz-navigation">
                {step > 0 && <button className="quiz-nav-btn" onClick={prevStep}>← Back</button>}
                <button
                  className="quiz-nav-btn primary"
                  onClick={nextStep}
                  disabled={!answers[currentQ.field]}
                >
                  {step < quizQuestions.length - 1 ? 'Next →' : 'Get Results 🎯'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ==================== ROI Calculator Modal ====================
function ROIModal() {
  const { setActiveModal } = useApp();
  const [form, setForm] = useState({ purchasePrice: '5000000', monthlyRent: '25000', appreciation: '5', years: '10', maintenance: '15000', tax: '5000' });
  const [results, setResults] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    const price = Number(form.purchasePrice);
    const rent = Number(form.monthlyRent) * 12;
    const appRate = Number(form.appreciation) / 100;
    const years = Number(form.years);
    const maint = Number(form.maintenance) * 12;
    const tax = Number(form.tax) * 12;

    const futureValue = price * Math.pow(1 + appRate, years);
    const totalRent = rent * years;
    const totalExpense = (maint + tax) * years;
    const netReturn = futureValue - price + totalRent - totalExpense;
    const roiPct = (netReturn / price) * 100;
    const annualRoi = roiPct / years;

    setResults({
      futureValue: Math.round(futureValue),
      totalRent: Math.round(totalRent),
      totalExpense: Math.round(totalExpense),
      netReturn: Math.round(netReturn),
      roiPct: roiPct.toFixed(1),
      annualRoi: annualRoi.toFixed(1),
    });
  };

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="roi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 ROI Calculator</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="roi-body">
          <form className="roi-form" onSubmit={calculate}>
            <div className="roi-form-grid">
              <div className="roi-field">
                <label>Purchase Price (₹)</label>
                <input type="number" value={form.purchasePrice} onChange={(e) => update('purchasePrice', e.target.value)} />
              </div>
              <div className="roi-field">
                <label>Monthly Rent (₹)</label>
                <input type="number" value={form.monthlyRent} onChange={(e) => update('monthlyRent', e.target.value)} />
              </div>
              <div className="roi-field">
                <label>Appreciation Rate (%)</label>
                <input type="number" step="0.1" value={form.appreciation} onChange={(e) => update('appreciation', e.target.value)} />
              </div>
              <div className="roi-field">
                <label>Investment Period (Years)</label>
                <input type="number" value={form.years} onChange={(e) => update('years', e.target.value)} />
              </div>
              <div className="roi-field">
                <label>Monthly Maintenance (₹)</label>
                <input type="number" value={form.maintenance} onChange={(e) => update('maintenance', e.target.value)} />
              </div>
              <div className="roi-field">
                <label>Monthly Tax (₹)</label>
                <input type="number" value={form.tax} onChange={(e) => update('tax', e.target.value)} />
              </div>
            </div>
            <button type="submit" className="mortgage-calc-btn">Calculate ROI</button>
          </form>
          {results && (
            <div id="roiResults" className="roi-results">
              <div className="roi-result-card highlight">
                <span>Net Return</span>
                <strong>₹{results.netReturn.toLocaleString('en-IN')}</strong>
              </div>
              <div className="roi-result-card">
                <span>Total ROI</span>
                <strong>{results.roiPct}%</strong>
              </div>
              <div className="roi-result-card">
                <span>Annual ROI</span>
                <strong>{results.annualRoi}%</strong>
              </div>
              <div className="roi-result-card">
                <span>Future Value</span>
                <strong>₹{results.futureValue.toLocaleString('en-IN')}</strong>
              </div>
              <div className="roi-result-card">
                <span>Total Rental Income</span>
                <strong>₹{results.totalRent.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Reviews Modal ====================
function ReviewsModal() {
  const { activeModal, setActiveModal, allProperties } = useApp();
  const { propertyId } = activeModal.data || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');

  const property = allProperties.find(p => p.id === propertyId);
  const reviews = propertyReviews[propertyId] || [];

  const submitReview = (e) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;
    alert('Review submitted! Thank you for your feedback.');
    setRating(0);
    setComment('');
    setName('');
  };

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="reviews-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⭐ Reviews {property ? `- ${property.title}` : ''}</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="reviews-body" id="reviewsBody">
          {/* Existing Reviews */}
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((r, i) => (
                <div key={i} className="review-card">
                  <div className="review-header">
                    <strong>{r.user}</strong>
                    <div className="review-stars-display">{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  </div>
                  <p>{r.comment}</p>
                  {r.date && <span className="review-date">{r.date}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          )}

          {/* Review Form */}
          <div className="review-form-card">
            <h4>Write a Review</h4>
            <form onSubmit={submitReview}>
              <div className="review-stars-input" id="reviewStars">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`review-star ${s <= rating ? 'active' : ''}`}
                    onClick={() => setRating(s)}
                  >
                    {s <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="review-name-input"
              />
              <textarea
                rows="3"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button type="submit" className="mortgage-calc-btn">Submit Review</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Currency Converter Modal ====================
function CurrencyModal() {
  const { setActiveModal } = useApp();
  const [amount, setAmount] = useState('10000000');
  const [target, setTarget] = useState('USD');
  const [result, setResult] = useState(null);

  const currencies = {
    USD: { rate: 0.012, symbol: '$', label: 'US Dollar' },
    EUR: { rate: 0.011, symbol: '€', label: 'Euro' },
    GBP: { rate: 0.0095, symbol: '£', label: 'British Pound' },
    AED: { rate: 0.044, symbol: 'د.إ', label: 'UAE Dirham' },
    SGD: { rate: 0.016, symbol: 'S$', label: 'Singapore Dollar' },
    AUD: { rate: 0.018, symbol: 'A$', label: 'Australian Dollar' },
    CAD: { rate: 0.016, symbol: 'C$', label: 'Canadian Dollar' },
  };

  const convert = (e) => {
    e.preventDefault();
    const c = currencies[target];
    const val = Number(amount) * c.rate;
    setResult({ value: val.toFixed(0), symbol: c.symbol, label: c.label });
  };

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="currency-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💱 Currency Converter</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="currency-body">
          <form className="currency-form" onSubmit={convert}>
            <div className="currency-field">
              <label>Amount in ₹ (INR)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="currency-field">
              <label>Convert to</label>
              <select id="currencyTarget" value={target} onChange={(e) => setTarget(e.target.value)}>
                {Object.entries(currencies).map(([code, c]) => (
                  <option key={code} value={code}>{c.label} ({c.symbol})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="mortgage-calc-btn">Convert</button>
            {result && (
              <div className="currency-result" id="currencyResult">
                {result.symbol} {Number(result.value).toLocaleString('en-IN')} {result.label}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ==================== Compare Modal ====================
function CompareModal() {
  const { setActiveModal, compareIds, toggleCompare, allProperties } = useApp();

  const compareProps = allProperties.filter(p => compareIds.includes(p.id));

  const rows = [
    { label: 'Price', key: 'price', format: (v) => formatPriceIndian(v) },
    { label: 'Location', key: 'location' },
    { label: 'Type', key: 'type' },
    { label: 'Bedrooms', key: 'bedrooms', suffix: ' BHK' },
    { label: 'Area', key: 'area', suffix: ' sq.ft' },
    { label: 'Bathrooms', key: 'bathrooms', suffix: ' Bath' },
    { label: 'Status', key: 'status' },
    { label: 'Furnishing', key: 'furnishing' },
    { label: 'Price/sqft', key: 'pricePerSqft', format: (v) => `₹${v}` },
  ];

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="mortgage-modal compare-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <h3>⚖️ Compare Properties ({compareProps.length}/3)</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
          {compareProps.length === 0 ? (
            <div className="ig-empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              <h3>No properties to compare</h3>
              <p>Click the ⚖️ button on property cards to add up to 3 properties</p>
            </div>
          ) : (
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  {compareProps.map(p => (
                    <th key={p.id}>
                      <div className="compare-th-content">
                        <img src={p.media?.[0]} alt={p.title} />
                        <span>{p.title}</span>
                        <button className="compare-remove" onClick={() => toggleCompare(p.id)}>✕ Remove</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.key}>
                    <td className="compare-row-label">{row.label}</td>
                    {compareProps.map(p => (
                      <td key={p.id}>
                        {row.format
                          ? row.format(p[row.key])
                          : `${p[row.key] || '-'}${row.suffix || ''}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Agent Profile Modal ====================
function AgentModal() {
  const { activeModal, setActiveModal, allProperties, openProperty } = useApp();
  const { agentId } = activeModal.data || {};

  const agent = agents[agentId];
  if (!agent) return null;

  const agentProperties = allProperties.filter(p => p.agent.id === agentId);

  return (
    <div className="prop-modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="tour-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👤 Agent Profile</h3>
          <button className="modal-close" onClick={() => setActiveModal(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div className="agent-profile-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img
              src={agent.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'}
              alt={agent.name}
              width="80"
              height="80"
              style={{ borderRadius: '50%', marginBottom: '0.75rem' }}
            />
            <h3>{agent.name}</h3>
            {agent.company && <p>{agent.company}</p>}
            {agent.experience && <p>{agent.experience} experience</p>}
            {agent.rating && <p>⭐ {agent.rating} Rating</p>}
            {agent.specialization && (
              <div style={{ marginTop: '0.5rem' }}>
                {agent.specialization.map(s => (
                  <span key={s} className="amenity-chip" style={{ margin: '0.2rem' }}>{s}</span>
                ))}
              </div>
            )}
          </div>

          {agentProperties.length > 0 && (
            <div>
              <h4>Listings by {agent.name}</h4>
              <div className="ig-feed-grid" style={{ marginTop: '0.75rem' }}>
                {agentProperties.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    className="ig-saved-card"
                    onClick={() => { setActiveModal(null); openProperty(p.id); }}
                  >
                    <div className="ig-card-media">
                      <img src={p.media?.[0]} alt={p.title} />
                      <div className="ig-card-overlay-info">
                        <span className="ig-card-price">{formatPriceIndian(p.price)}</span>
                      </div>
                    </div>
                    <div className="ig-card-body">
                      <h3 className="ig-card-title">{p.title}</h3>
                      <p className="ig-card-location">{p.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button className="modal-action-btn primary" onClick={() => setActiveModal({ type: 'tour', data: {} })}>
              📅 Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Admin Panel Modal ====================
function AdminPanelModal() {
  const { user, signIn, signOut } = useAuth();
  const { allProperties, adminAddProperty, adminDeleteProperty, dbReady } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', location: '', price: '', beds: 2, baths: 2, sqft: 1000,
    type: 'apartment', status: 'sale', builder: '', description: '',
    images: '', featured: false, hot: false, agent_name: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      const images = form.images
        ? form.images.split(',').map(s => s.trim()).filter(Boolean)
        : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop'];
      await adminAddProperty({
        ...form,
        price: Number(form.price),
        beds: Number(form.beds),
        baths: Number(form.baths),
        sqft: Number(form.sqft),
        images,
        amenities: [],
        agent: { name: form.agent_name || 'Admin Agent', avatar: 'https://i.pravatar.cc/150?img=3', rating: 4.5, sales: 10 },
      });
      setForm({ title: '', location: '', price: '', beds: 2, baths: 2, sqft: 1000, type: 'apartment', status: 'sale', builder: '', description: '', images: '', featured: false, hot: false, agent_name: '' });
      setShowForm(false);
      alert('Property added! Changes will appear in real-time.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await adminDeleteProperty(id);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="prop-modal-backdrop" onClick={() => {}}>
      <div className="admin-panel-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
          <h3>🛠️ Admin Panel {!dbReady && '(Supabase not configured)'}</h3>
          {user && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{user.email}</span>
              <button className="modal-close" onClick={signOut} style={{ position: 'static' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {!dbReady && (
            <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              ⚠️ Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.
              Currently using static data from <code>src/data.js</code>.
            </div>
          )}

          {!user ? (
            <form onSubmit={handleLogin} style={{ maxWidth: 400 }}>
              <h4 style={{ marginBottom: '1rem' }}>Admin Login</h4>
              {authError && <div style={{ color: '#dc3545', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{authError}</div>}
              <div className="roi-field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com" />
              </div>
              <div className="roi-field">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <button type="submit" className="mortgage-calc-btn" disabled={authLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
                {authLoading ? 'Logging in...' : 'Login'}
              </button>
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.6 }}>
                Create admin users in Supabase Dashboard → Authentication → Users → Add User.
              </p>
            </form>
          ) : (
            <>
              {/* Add Property Form */}
              <div style={{ marginBottom: '1.5rem' }}>
                <button className="mortgage-calc-btn" onClick={() => setShowForm(!showForm)} style={{ marginBottom: '0.75rem' }}>
                  {showForm ? '✕ Cancel' : '+ Add New Property'}
                </button>
                {showForm && (
                  <form onSubmit={handleAddProperty} className="roi-form" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <div className="roi-form-grid">
                      <div className="roi-field">
                        <label>Title *</label>
                        <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
                      </div>
                      <div className="roi-field">
                        <label>Location *</label>
                        <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} required />
                      </div>
                      <div className="roi-field">
                        <label>Price (₹) *</label>
                        <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required />
                      </div>
                      <div className="roi-field">
                        <label>Beds</label>
                        <input type="number" value={form.beds} onChange={(e) => setForm({...form, beds: e.target.value})} />
                      </div>
                      <div className="roi-field">
                        <label>Baths</label>
                        <input type="number" value={form.baths} onChange={(e) => setForm({...form, baths: e.target.value})} />
                      </div>
                      <div className="roi-field">
                        <label>Sq.Ft</label>
                        <input type="number" value={form.sqft} onChange={(e) => setForm({...form, sqft: e.target.value})} />
                      </div>
                      <div className="roi-field">
                        <label>Type</label>
                        <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                          <option value="apartment">Apartment</option>
                          <option value="villa">Villa</option>
                          <option value="commercial">Commercial</option>
                          <option value="plot">Plot</option>
                        </select>
                      </div>
                      <div className="roi-field">
                        <label>Status</label>
                        <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                          <option value="sale">For Sale</option>
                          <option value="rent">For Rent</option>
                        </select>
                      </div>
                      <div className="roi-field">
                        <label>Builder</label>
                        <input type="text" value={form.builder} onChange={(e) => setForm({...form, builder: e.target.value})} />
                      </div>
                      <div className="roi-field">
                        <label>Agent Name</label>
                        <input type="text" value={form.agent_name} onChange={(e) => setForm({...form, agent_name: e.target.value})} />
                      </div>
                      <div className="roi-field">
                        <label>Image URLs (comma-separated)</label>
                        <input type="text" value={form.images} onChange={(e) => setForm({...form, images: e.target.value})} placeholder="https://..." />
                      </div>
                      <div className="roi-field" style={{ gridColumn: '1 / -1' }}>
                        <label>Description</label>
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
                      </div>
                      <div className="roi-field" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form, featured: e.target.checked})} />
                          Featured
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.hot} onChange={(e) => setForm({...form, hot: e.target.checked})} />
                          Hot Deal
                        </label>
                      </div>
                    </div>
                    <button type="submit" className="mortgage-calc-btn" style={{ marginTop: '0.5rem' }}>Add Property</button>
                  </form>
                )}
              </div>

              {/* Property List */}
              <h4>Manage Properties ({allProperties.length} total)</h4>
              <div style={{ maxHeight: 400, overflow: 'auto', marginTop: '0.5rem' }}>
                <table className="compare-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProperties.slice(0, 50).map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                        <td>₹{(p.price / 100000).toFixed(1)}L</td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location}</td>
                        <td>
                          <button
                            className="compare-remove"
                            onClick={() => handleDelete(p.id, p.title)}
                            style={{ margin: 0 }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Main Modals Component ====================
export default function Modals() {
  const { activeModal, setActiveModal } = useApp();

  // Handle Escape — hook MUST run on every render, so it sits above the
  // early-return below. (Previously this hook was conditional, which
  // violated Rules of Hooks and could cause stale listeners.)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setActiveModal]);

  if (!activeModal) return null;

  const { type } = activeModal;

  return (
    <>
      {type === 'story' && <StoryModal />}
      {type === 'property' && <PropertyDetailModal />}
      {type === 'mortgage' && <MortgageModal />}
      {type === 'tour' && <TourModal />}
      {type === 'alerts' && <AlertsModal />}
      {type === 'quiz' && <QuizModal />}
      {type === 'roi' && <ROIModal />}
      {type === 'reviews' && <ReviewsModal />}
      {type === 'currency' && <CurrencyModal />}
      {type === 'compare' && <CompareModal />}
      {type === 'agent' && <AgentModal />}
      {type === 'admin' && <AdminPanelModal />}
    </>
  );
}