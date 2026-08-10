import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';

const REEL_CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Premium', value: 'premium' },
  { label: 'Family', value: 'family' },
  { label: 'Budget', value: 'budget' },
  { label: 'Commercial', value: 'commercial' },
];

// ── SVG Icons ──────────────────────────────────────────────────────────────

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DetailsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function ToastIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ReelsView() {
  const {
    allReels,
    activeReelCategory,
    setActiveReelCategory,
    savedIds,
    toggleSave,
    likedIds,
    toggleLike,
    setActiveModal,
    addRecentView,
    openProperty,
  } = useApp();

  const [toast, setToast] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const toastTimer = useRef(null);

  // ── Case-insensitive category filtering ────────────────────────────────
  const normalizedCategory = activeReelCategory.toLowerCase();
  const filteredReels = normalizedCategory === 'all'
    ? allReels
    : allReels.filter(r => (r.category || '').toLowerCase() === normalizedCategory);

  // ── Toast ───────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // ── Reset active index when category changes ────────────────────────────
  useEffect(() => {
    setActiveIndex(0);
  }, [activeReelCategory]);

  // ── Autoplay active video, pause others ─────────────────────────────────
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, vid]) => {
      if (!vid) return;
      const reel = filteredReels[activeIndex];
      if (reel && reel.id === id) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [activeIndex, filteredReels]);

  // ── Scroll handler — detect active slide ────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const slides = containerRef.current.querySelectorAll('.ig-reel-slide');
    const containerTop = containerRef.current.getBoundingClientRect().top;
    let closest = 0;
    let closestDist = Infinity;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs(rect.top - containerTop);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHeaderScrolled(closest > 0);
    if (closest !== activeIndex) {
      setActiveIndex(closest);
    }
  }, [activeIndex]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleLike = (reel) => {
    toggleLike(reel.id);
    showToast(likedIds.includes(reel.id) ? 'Removed from likes' : 'Added to likes ❤️');
  };

  const handleSave = (reel) => {
    toggleSave(reel.propertyId || reel.id);
    showToast(savedIds.includes(reel.propertyId || reel.id) ? 'Removed from saved' : 'Saved! 🔖');
  };

  const handleDetails = (reel) => {
    openProperty(reel.propertyId || reel.id);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Fixed Header with Chips & Progress Dots */}
      <div className={`ig-reels-header ${headerScrolled ? 'reels-header-overlay' : ''}`}>
        <div className="ig-reel-chips">
          {REEL_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`ig-reel-chip ${normalizedCategory === cat.value ? 'active' : ''}`}
              onClick={() => setActiveReelCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Progress Dots */}
        {filteredReels.length > 0 && (
          <div className="ig-reel-progress-dots">
            {filteredReels.map((_, i) => (
              <div
                key={i}
                className={`ig-reel-progress-dot ${i === activeIndex ? 'active' : ''} ${i < activeIndex ? 'watched' : ''}`}
              >
                {i === activeIndex && <div className="reel-progress-fill" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Reels Container */}
      <div
        ref={containerRef}
        className="ig-reels-container"
        onScroll={handleScroll}
      >
        {filteredReels.length === 0 ? (
          <div className="ig-empty-state" style={{ color: 'white', textAlign: 'center', paddingTop: '40vh' }}>
            <h3>No reels in this category</h3>
            <p style={{ opacity: 0.6, marginTop: 8 }}>Try selecting a different category</p>
          </div>
        ) : (
          filteredReels.map((reel) => {
            const isLiked = likedIds.includes(reel.id);
            const isSaved = savedIds.includes(reel.propertyId || reel.id);

            return (
              <div key={reel.id} className="ig-reel-slide">
                {/* Video */}
                <video
                  ref={el => (videoRefs.current[reel.id] = el)}
                  className="ig-reel-video"
                  src={reel.video}
                  poster={reel.thumbnail}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onClick={() => {
                    const vid = videoRefs.current[reel.id];
                    if (vid) vid.paused ? vid.play() : vid.pause();
                  }}
                />

                {/* Gradient Overlay */}
                <div className="ig-reel-overlay" />

                {/* Bottom Info */}
                <div className="ig-reel-info">
                  <h3 className="ig-reel-title">{reel.title}</h3>
                  <p className="ig-reel-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {reel.location}
                    {reel.builder && ` • ${reel.builder}`}
                  </p>
                  <div className="ig-reel-price-row">
                    <span className="ig-reel-price">{formatPriceIndian(reel.price)}</span>
                    {reel.sqft && <span className="ig-reel-spec">{reel.sqft} sq.ft</span>}
                    {reel.furnishing && <span className="ig-reel-spec">{reel.furnishing}</span>}
                    {reel.status && <span className="ig-reel-spec">{reel.status}</span>}
                  </div>
                  {reel.description && (
                    <p className="ig-reel-desc">{reel.description.slice(0, 120)}{reel.description.length > 120 ? '...' : ''}</p>
                  )}
                  {(reel.possessionDate || reel.reraId || reel.floor) && (
                    <div className="reel-detail-bar">
                      {reel.possessionDate && <span>📅 {reel.possessionDate}</span>}
                      {reel.reraId && <span>🏛️ {reel.reraId}</span>}
                      {reel.floor && <span>🏢 {reel.floor}</span>}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="ig-reel-actions">
                  <button
                    className={`ig-reel-action-btn ${isLiked ? 'reel-liked' : ''}`}
                    onClick={() => handleLike(reel)}
                  >
                    <HeartIcon filled={isLiked} />
                    <span>{reel.likes || 0}</span>
                  </button>

                  <button
                    className={`ig-reel-action-btn ${isSaved ? 'reel-saved' : ''}`}
                    onClick={() => handleSave(reel)}
                  >
                    <BookmarkIcon filled={isSaved} />
                    <span>Save</span>
                  </button>

                  <button
                    className="ig-reel-action-btn"
                    onClick={() => handleDetails(reel)}
                  >
                    <DetailsIcon />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="ig-toast">
          <ToastIcon />
          {toast}
        </div>
      )}
    </>
  );
}