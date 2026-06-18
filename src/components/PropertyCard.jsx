import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';

export default function PropertyCard({ property }) {
  const {
    savedIds,
    toggleSave,
    likedIds,
    toggleLike,
    openProperty,
    compareIds,
    toggleCompare,
  } = useApp();

  const [carouselIdx, setCarouselIdx] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const media = property.media || [];
  const maxIdx = media.length - 1;

  const handleCardClick = (e) => {
    // Don't navigate if clicking interactive elements within the card
    if (e.target.closest('button, .card-save-btn, .ig-card-media-nav, .ig-card-badge')) return;
    openProperty(property.id);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCarouselIdx(prev => (prev === 0 ? maxIdx : prev - 1));
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCarouselIdx(prev => (prev === maxIdx ? 0 : prev + 1));
  };

  const handleImageError = (idx) => {
    setImageErrors(prev => ({ ...prev, [idx]: true }));
  };

  const isSaved = savedIds.includes(property.id);
  const isLiked = likedIds.includes(property.id);
  const isCompared = compareIds.includes(property.id);
  const isRera = property.rera;

  return (
    <div className="ig-card" onClick={handleCardClick}>
      {/* Media Section */}
      <div className="ig-card-media" style={{ aspectRatio: property.mediaAspectRatio || '4/3' }}>
        {/* Badges */}
        <div className="ig-card-badges">
          {property.badge && (
            <span className={`ig-card-badge ${property.badgeType || ''}`}>{property.badge}</span>
          )}
          {property.verified && (
            <span className="ig-card-badge verified" title="Verified Property">✓ Verified</span>
          )}
          {isRera && (
            <span className="ig-card-badge rera" title="RERA Registered">🏛️ RERA</span>
          )}
        </div>

        {/* Save Button */}
        <button
          className={`card-save-btn ${isSaved ? 'saved' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleSave(property.id); }}
          title={isSaved ? 'Remove from saved' : 'Save property'}
        >
          {isSaved ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
          )}
        </button>

        {/* Image */}
        {media.length > 0 && (
          imageErrors[carouselIdx] ? (
            <div className="ig-card-img-fallback">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
          ) : (
            <img
              className="ig-card-img"
              src={media[carouselIdx]}
              alt={`${property.title} - ${carouselIdx + 1}`}
              loading="lazy"
              onError={() => handleImageError(carouselIdx)}
            />
          )
        )}

        {/* Carousel Navigation */}
        {media.length > 1 && (
          <>
            <button className="ig-card-media-nav prev" onClick={prevSlide} aria-label="Previous image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button className="ig-card-media-nav next" onClick={nextSlide} aria-label="Next image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div className="ig-card-dots">
              {media.map((_, i) => (
                <button
                  key={i}
                  className={`ig-card-dot ${i === carouselIdx ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCarouselIdx(i); }}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Overlay Info */}
        <div className="ig-card-overlay-info">
          <span className="ig-card-price">{formatPriceIndian(property.price)}</span>
          {property.pricePerSqft && (
            <span className="ig-card-price-sqft">₹{property.pricePerSqft}/sq.ft</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="ig-card-body">
        <div className="ig-card-title-row">
          <h3 className="ig-card-title">{property.title}</h3>
          {property.trending && <span className="trending-badge">🔥 Trending</span>}
        </div>

        <p className="ig-card-location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {property.location}
        </p>

        <div className="ig-card-stats">
          {property.bedrooms && <span>{property.bedrooms} BHK</span>}
          {property.area && <span>{property.area} sq.ft</span>}
          {property.bathrooms && <span>{property.bathrooms} Bath</span>}
        </div>

        <div className="ig-card-footer">
          <div className="ig-card-agent">
            <img
              src={property.agentAvatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face`}
              alt={property.agent?.name || 'Agent'}
              width="28"
              height="28"
              loading="lazy"
            />
            <span>{property.agent?.name || 'Agent'}</span>
          </div>
          <div className="ig-card-actions">
            <button
              className={`ig-card-action-btn ${isLiked ? 'liked' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleLike(property.id); }}
              title="Like"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
            </button>
            <button
              className={`ig-card-action-btn ${isCompared ? 'compared' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleCompare(property.id); }}
              title={isCompared ? 'Remove from compare' : 'Add to compare'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
            {isRera && <span className="rera-badge-mini" title="RERA Registered: Click for details">RERA</span>}
          </div>
        </div>
      </div>
    </div>
  );
}