import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { setSeo, origin } from '../utils/seo';

// =============================================================================
// AmeyaSapphire — dedicated project landing / micro-site for
// "Ameya Sapphire 82A", a premium residential launch on the Dwarka
// Expressway corridor (Sector 82A, Gurugram). Self-contained page: renders
// when `currentView === 'ameya-sapphire'`.
// =============================================================================

const HERO_IMG =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80';

const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80', cap: 'Grand arrival lobby' },
  { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', cap: '3 & 4 BHK sky residences' },
  { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', cap: 'Landscaped central greens' },
  { src: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80', cap: 'Infinity-edge pool deck' },
  { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80', cap: 'Sunlit living interiors' },
  { src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80', cap: 'Clubhouse & lounge' },
];

const HIGHLIGHTS = [
  { icon: '📐', label: 'Configurations', value: '3 & 4 BHK' },
  { icon: '💰', label: 'Starting Price', value: '₹2.45 Cr*' },
  { icon: '🏢', label: 'Towers', value: '6 Towers · G+34' },
  { icon: '🌳', label: 'Open Space', value: '78% Green' },
  { icon: '📅', label: 'Possession', value: 'Dec 2028' },
  { icon: '🛡️', label: 'RERA', value: 'GGM/842/2024' },
];

const AMENITIES = [
  { icon: '🏊', name: 'Infinity Pool' },
  { icon: '🏋️', name: 'Fitness Studio' },
  { icon: '🧘', name: 'Yoga & Spa Deck' },
  { icon: '🎾', name: 'Tennis & Squash' },
  { icon: '🎬', name: 'Mini Theatre' },
  { icon: '🍽️', name: 'Party Lawn' },
  { icon: '🧒', name: "Kids' Play Zone" },
  { icon: '🏃', name: 'Jogging Trail' },
  { icon: '☕', name: 'Café & Co-work' },
  { icon: '🚗', name: '2-Level Parking' },
  { icon: '📹', name: '3-Tier Security' },
  { icon: '🔋', name: '100% Power Backup' },
];

const CONFIGS = [
  { type: '3 BHK + Utility', area: '2,180 sq.ft', price: '₹2.45 Cr*', tag: 'Best Seller' },
  { type: '3 BHK + Study', area: '2,540 sq.ft', price: '₹2.85 Cr*', tag: null },
  { type: '4 BHK Premium', area: '3,120 sq.ft', price: '₹3.60 Cr*', tag: 'Limited' },
  { type: '4 BHK Sky Villa', area: '3,880 sq.ft', price: '₹4.75 Cr*', tag: 'Signature' },
];

const CONNECTIVITY = [
  { place: 'Dwarka Expressway', dist: '0 min · Adjacent' },
  { place: 'IGI Airport', dist: '25 min' },
  { place: 'Cyber City / NH-48', dist: '20 min' },
  { place: 'Proposed Metro (Sec 82)', dist: '6 min walk' },
  { place: 'CPR Hospital & Schools', dist: '8 min' },
  { place: 'Retail & Hospitality Belt', dist: '5 min' },
];

const FAQS = [
  {
    q: 'Where exactly is Ameya Sapphire 82A located?',
    a: 'The project sits in Sector 82A, Gurugram, directly on the Dwarka Expressway (NPR) corridor — one of NCR\'s fastest-appreciating growth belts, with seamless access to IGI Airport and Cyber City.',
  },
  {
    q: 'What configurations and sizes are available?',
    a: 'Ameya Sapphire 82A offers spacious 3 & 4 BHK residences ranging from 2,180 to 3,880 sq.ft, including premium sky villas on the upper floors.',
  },
  {
    q: 'Is the project RERA registered?',
    a: 'Yes. The project is registered under Haryana RERA (illustrative ID GGM/842/2024 shown for this demo). Always verify the live RERA ID on the official portal before booking.',
  },
  {
    q: 'What is the possession timeline?',
    a: 'Possession is targeted for December 2028, with construction-linked and flexible subvention payment plans available for early buyers.',
  },
];

function EnquiryForm({ compact }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', config: '3 BHK + Utility' });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast('Please enter your name and phone number.', 'warning');
      return;
    }
    toast('Thanks! Our Ameya Sapphire 82A expert will call you shortly.', 'success');
    setForm({ name: '', phone: '', config: '3 BHK + Utility' });
  };
  return (
    <form className={`ameya-form ${compact ? 'compact' : ''}`} onSubmit={submit}>
      <h3>Request Best Price &amp; Brochure</h3>
      <p className="ameya-form-sub">Get exclusive launch pricing, floor plans and payment plans.</p>
      <input
        type="text" placeholder="Your name" value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
      />
      <input
        type="tel" placeholder="Phone number" value={form.phone}
        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
      />
      <select value={form.config} onChange={e => setForm(p => ({ ...p, config: e.target.value }))}>
        {CONFIGS.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
      </select>
      <button type="submit" className="ameya-btn primary block">Get Instant Callback</button>
      <span className="ameya-form-fine">By submitting you agree to be contacted about this project.</span>
    </form>
  );
}

export default function AmeyaSapphire() {
  const { setCurrentView, setActiveModal } = useApp();
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    setSeo({
      title: 'Ameya Sapphire 82A | 3 & 4 BHK on Dwarka Expressway, Gurugram',
      description: 'Ameya Sapphire 82A — premium 3 & 4 BHK residences in Sector 82A, Gurugram on the Dwarka Expressway. Starting ₹2.45 Cr*. RERA registered. Book a site visit today.',
      canonical: origin() + '/ameya-sapphire-82a',
    });
  }, []);

  return (
    <div className="ameya-page">
      {/* ───── Hero ───── */}
      <section className="ameya-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(10,12,24,0.35), rgba(10,12,24,0.82)), url(${HERO_IMG})` }}>
        <button className="ameya-back" onClick={() => setCurrentView('feed')}>← Back to home</button>
        <div className="ameya-hero-inner">
          <span className="ameya-eyebrow"><span className="ameya-dot" /> New Launch · Dwarka Expressway</span>
          <h1>Ameya Sapphire 82A</h1>
          <p className="ameya-hero-loc">📍 Sector 82A, Gurugram · On the Dwarka Expressway (NPR)</p>
          <p className="ameya-hero-tag">Where skyline living meets the city&apos;s fastest-growing corridor. Expansive 3 &amp; 4 BHK residences crafted for those who expect more.</p>
          <div className="ameya-hero-price">
            <div><span>Starting</span><strong>₹2.45 Cr*</strong></div>
            <div><span>Sizes</span><strong>2,180 – 3,880 sq.ft</strong></div>
            <div><span>Possession</span><strong>Dec 2028</strong></div>
          </div>
          <div className="ameya-hero-actions">
            <button className="ameya-btn primary" onClick={() => setActiveModal({ type: 'tour', data: { intent: 'Ameya Sapphire 82A site visit' } })}>📅 Book Site Visit</button>
            <button className="ameya-btn ghost" onClick={() => setActiveModal({ type: 'lead', data: { intent: 'Ameya Sapphire 82A brochure' } })}>⬇ Download Brochure</button>
          </div>
        </div>
      </section>

      {/* ───── Highlights strip ───── */}
      <section className="ameya-highlights">
        {HIGHLIGHTS.map(h => (
          <div key={h.label} className="ameya-highlight">
            <span className="ameya-highlight-icon">{h.icon}</span>
            <div>
              <span className="ameya-highlight-val">{h.value}</span>
              <span className="ameya-highlight-lbl">{h.label}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="ameya-body">
        <div className="ameya-main">
          {/* ───── Overview ───── */}
          <section className="ameya-section" id="overview">
            <h2>The address that changes everything</h2>
            <p>
              Rising along the Dwarka Expressway, <strong>Ameya Sapphire 82A</strong> is a landmark
              gated community of six sculpted towers set within lush, low-density greens.
              Every residence is designed corner-to-corner for cross-ventilation, deep balconies
              and uninterrupted skyline views — a rare balance of scale, light and privacy.
            </p>
            <p>
              With the airport, Cyber City and NCR&apos;s new commercial belt minutes away, this is
              a home that lives beautifully today and appreciates strongly tomorrow.
            </p>
          </section>

          {/* ───── Gallery ───── */}
          <section className="ameya-section">
            <h2>A closer look</h2>
            <div className="ameya-gallery">
              {GALLERY.map((g, i) => (
                <figure key={i} className={`ameya-gallery-item ${i === 0 ? 'wide' : ''}`}>
                  <img src={g.src} alt={g.cap} loading="lazy" />
                  <figcaption>{g.cap}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* ───── Configurations / pricing ───── */}
          <section className="ameya-section" id="pricing">
            <h2>Configurations &amp; pricing</h2>
            <p className="ameya-section-sub">Indicative pricing for the current launch phase. Prices exclude registration &amp; taxes.</p>
            <div className="ameya-config-table">
              {CONFIGS.map(c => (
                <div key={c.type} className="ameya-config-row">
                  <div className="ameya-config-type">
                    <strong>{c.type}</strong>
                    {c.tag && <span className="ameya-config-tag">{c.tag}</span>}
                  </div>
                  <span className="ameya-config-area">{c.area}</span>
                  <span className="ameya-config-price">{c.price}</span>
                  <button className="ameya-btn small" onClick={() => setActiveModal({ type: 'lead', data: { intent: `Ameya Sapphire 82A — ${c.type}` } })}>Get Quote</button>
                </div>
              ))}
            </div>
          </section>

          {/* ───── Amenities ───── */}
          <section className="ameya-section">
            <h2>50+ world-class amenities</h2>
            <p className="ameya-section-sub">A 2-acre clubhouse and resort-grade lifestyle at your doorstep.</p>
            <div className="ameya-amenities">
              {AMENITIES.map(a => (
                <div key={a.name} className="ameya-amenity">
                  <span>{a.icon}</span>
                  <strong>{a.name}</strong>
                </div>
              ))}
            </div>
          </section>

          {/* ───── Location / connectivity ───── */}
          <section className="ameya-section" id="location">
            <h2>Everything, minutes away</h2>
            <div className="ameya-connectivity">
              {CONNECTIVITY.map(c => (
                <div key={c.place} className="ameya-conn-row">
                  <span className="ameya-conn-place">📍 {c.place}</span>
                  <span className="ameya-conn-dist">{c.dist}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ───── Developer ───── */}
          <section className="ameya-section">
            <h2>Built by Ameya Group</h2>
            <div className="ameya-developer">
              <div className="ameya-dev-logo">AG</div>
              <div>
                <p>
                  Ameya Group is a Gurugram-based developer known for design-led, on-time
                  communities across the NCR. Ameya Sapphire 82A is its flagship residential
                  address on the Dwarka Expressway — engineered for quality, transparency and
                  long-term value.
                </p>
                <div className="ameya-dev-stats">
                  <div><strong>15+</strong><span>Years</span></div>
                  <div><strong>12 Mn+</strong><span>Sq.ft delivered</span></div>
                  <div><strong>4.5★</strong><span>Buyer rating</span></div>
                </div>
              </div>
            </div>
          </section>

          {/* ───── FAQ ───── */}
          <section className="ameya-section" id="faq">
            <h2>Frequently asked</h2>
            <div className="ameya-faq">
              {FAQS.map((f, i) => (
                <div key={i} className={`ameya-faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="ameya-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    <span>{f.q}</span>
                    <span className="ameya-faq-chev">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="ameya-faq-a">{f.a}</p>}
                </div>
              ))}
            </div>
          </section>

          <p className="ameya-disclaimer">
            *Prices, images, plans and specifications are indicative and for representational
            purposes on this demo page only. This is not a legal offer. Verify all details and
            the live RERA registration before any booking.
          </p>
        </div>

        {/* ───── Sticky enquiry rail ───── */}
        <aside className="ameya-aside">
          <EnquiryForm />
        </aside>
      </div>

      {/* ───── Closing CTA ───── */}
      <section className="ameya-cta">
        <h2>Your skyline home is waiting</h2>
        <p>Limited launch-phase inventory. Talk to our project experts and lock in the best price.</p>
        <div className="ameya-cta-actions">
          <button className="ameya-btn primary" onClick={() => setActiveModal({ type: 'tour', data: { intent: 'Ameya Sapphire 82A site visit' } })}>📅 Schedule a Site Visit</button>
          <button className="ameya-btn ghost light" onClick={() => setActiveModal({ type: 'lead', data: { intent: 'Ameya Sapphire 82A callback' } })}>📞 Request a Callback</button>
        </div>
      </section>
    </div>
  );
}
