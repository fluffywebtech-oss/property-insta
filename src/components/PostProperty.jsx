import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { saveLead } from '../utils/leads';
import { setSeo, origin } from '../utils/seo';

const LISTING_TYPES = ['Sell', 'Rent'];
const PROPERTY_TYPES = ['Apartment', 'Villa / House', 'Plot / Land', 'Builder Floor', 'Commercial'];
const OWNER_TYPES = ['Owner', 'Agent', 'Builder'];
const FURNISHING = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'];
const AMENITIES = ['Pool', 'Gym', 'Parking', 'Security', 'Power Backup', 'Lift', 'Garden', 'Clubhouse'];
const STEPS = ['Property', 'Location & Layout', 'Price & Photos', 'Your Contact'];

const EMPTY = {
  listingType: 'Sell', propertyType: '', ownerType: 'Owner',
  city: 'Gurgaon', locality: '', address: '',
  bhk: '3', baths: '2', area: '', furnishing: 'Semi-Furnished',
  price: '', maintenance: '', amenities: [], photos: '', description: '',
  name: '', phone: '', email: '',
};

export default function PostProperty() {
  const { setCurrentView } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setSeo({
      title: 'Post Your Property — Sell or Rent | PropertyInsta',
      description: 'List your property to sell or rent on PropertyInsta — free, no brokerage. Reach verified buyers and tenants across Gurgaon NCR.',
      canonical: origin() + '/post-property',
      keywords: 'post property, sell property, rent property, list property free, Gurgaon',
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a) => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));
  const isRent = form.listingType === 'Rent';

  const validate = (s) => {
    if (s === 1 && !form.propertyType) return 'Please choose a property type.';
    if (s === 2 && (!form.locality.trim() || !form.area)) return 'Please add the locality and built-up area.';
    if (s === 3 && !form.price) return `Please enter the ${isRent ? 'monthly rent' : 'expected price'}.`;
    if (s === 4) {
      if (!form.name.trim()) return 'Please enter your name.';
      if (form.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit phone number.';
    }
    return '';
  };

  const next = () => { const e = validate(step); if (e) { setError(e); return; } setError(''); setStep(s => Math.min(4, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = () => { setError(''); setStep(s => Math.max(1, s - 1)); };

  const submit = () => {
    const e = validate(4); if (e) { setError(e); return; }
    setError('');
    const title = `${form.bhk ? form.bhk + ' BHK ' : ''}${form.propertyType} in ${form.locality}`;
    const message = [
      `New ${form.listingType.toUpperCase()} listing from ${form.ownerType}.`,
      `${title}, ${form.city}.`,
      `Area ${form.area} sq.ft · ${form.bhk} BHK · ${form.baths} bath · ${form.furnishing}.`,
      `${isRent ? 'Rent' : 'Price'}: ${form.price}${form.maintenance ? ` · Maintenance: ${form.maintenance}` : ''}.`,
      form.amenities.length ? `Amenities: ${form.amenities.join(', ')}.` : '',
      form.address ? `Address: ${form.address}.` : '',
      form.photos ? `Photos: ${form.photos}` : '',
      form.description ? `Notes: ${form.description}` : '',
    ].filter(Boolean).join(' ');
    const { ref } = saveLead({
      intent: 'callback',
      name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
      propertyTitle: `🏷️ ${form.listingType} listing — ${title}`,
      message,
    });
    setResult({ ref, title });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (result) {
    return (
      <div className="ig-bwu ig-post">
        <div className="ig-loan-success" style={{ marginTop: 24 }}>
          <span className="ig-loan-success-ico">🎉</span>
          <h3>Your property is submitted!</h3>
          <p>“{result.title}” is in review. Reference <strong>{result.ref}</strong> — our listings team will call you to verify details and publish it.</p>
          <div className="ig-loan-success-actions">
            <button className="ig-bwu-quote book" onClick={() => { setForm(EMPTY); setStep(1); setResult(null); }}>Post another</button>
            <button className="ig-loan-reset" onClick={() => setCurrentView('feed')}>Browse listings</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ig-bwu ig-post">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🏷️ Post Your Property</span>
        <h1>List your property — free, zero brokerage</h1>
        <p>Reach verified buyers &amp; tenants across Gurgaon NCR. Takes about 2 minutes.</p>
      </div>

      {/* Stepper */}
      <div className="ig-post-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`ig-post-step ${step === i + 1 ? 'current' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <span className="ig-post-step-dot">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="ig-post-step-label">{s}</span>
          </div>
        ))}
      </div>

      <form className="ig-loan-form" onSubmit={e => { e.preventDefault(); step < 4 ? next() : submit(); }}>
        {step === 1 && (
          <>
            <div className="ig-bwu-modes" style={{ marginBottom: 18 }}>
              {LISTING_TYPES.map(t => (
                <button type="button" key={t} className={`ig-bwu-mode ${form.listingType === t ? 'active' : ''}`} onClick={() => set('listingType', t)}>
                  {t === 'Sell' ? '🏠 Sell' : '🔑 Rent'}
                </button>
              ))}
            </div>
            <label className="ig-post-label">Property type *</label>
            <div className="ig-bwu-filters" style={{ marginBottom: 18 }}>
              {PROPERTY_TYPES.map(p => (
                <button type="button" key={p} className={`ig-bwu-chip ${form.propertyType === p ? 'active' : ''}`} onClick={() => set('propertyType', p)}>{p}</button>
              ))}
            </div>
            <label className="ig-post-label">You are a *</label>
            <div className="ig-bwu-filters">
              {OWNER_TYPES.map(o => (
                <button type="button" key={o} className={`ig-bwu-chip ${form.ownerType === o ? 'active' : ''}`} onClick={() => set('ownerType', o)}>{o}</button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="ig-loan-form-grid">
            <div className="ig-loan-input"><label>City</label><input value={form.city} onChange={e => set('city', e.target.value)} /></div>
            <div className="ig-loan-input"><label>Locality / Sector *</label><input placeholder="e.g. Golf Course Road" value={form.locality} onChange={e => set('locality', e.target.value)} /></div>
            <div className="ig-loan-input"><label>Project / Address</label><input placeholder="Tower / society (optional)" value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div className="ig-loan-input"><label>Bedrooms (BHK)</label><select value={form.bhk} onChange={e => set('bhk', e.target.value)}>{['1', '2', '3', '4', '5', '5+'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="ig-loan-input"><label>Bathrooms</label><select value={form.baths} onChange={e => set('baths', e.target.value)}>{['1', '2', '3', '4', '4+'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="ig-loan-input"><label>Built-up Area (sq.ft) *</label><input type="number" inputMode="numeric" placeholder="2400" value={form.area} onChange={e => set('area', e.target.value)} /></div>
            <div className="ig-loan-input"><label>Furnishing</label><select value={form.furnishing} onChange={e => set('furnishing', e.target.value)}>{FURNISHING.map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="ig-loan-form-grid">
              <div className="ig-loan-input"><label>{isRent ? 'Monthly Rent (₹) *' : 'Expected Price (₹) *'}</label><input placeholder={isRent ? '₹85,000' : '₹2.4 Cr'} value={form.price} onChange={e => set('price', e.target.value)} /></div>
              <div className="ig-loan-input"><label>{isRent ? 'Deposit / Maintenance' : 'Maintenance (monthly)'}</label><input placeholder="optional" value={form.maintenance} onChange={e => set('maintenance', e.target.value)} /></div>
              <div className="ig-loan-input"><label>Photo URLs</label><input placeholder="comma-separated links (optional)" value={form.photos} onChange={e => set('photos', e.target.value)} /></div>
            </div>
            <label className="ig-post-label" style={{ marginTop: 14 }}>Amenities</label>
            <div className="ig-bwu-filters" style={{ marginBottom: 14 }}>
              {AMENITIES.map(a => (
                <button type="button" key={a} className={`ig-bwu-chip ${form.amenities.includes(a) ? 'active' : ''}`} onClick={() => toggleAmenity(a)}>{a}</button>
              ))}
            </div>
            <div className="ig-loan-input"><label>Description</label><textarea rows={3} placeholder="Highlight the best things about your property…" value={form.description} onChange={e => set('description', e.target.value)} /></div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="ig-post-summary">
              <h4>Review your listing</h4>
              <ul>
                <li><span>Listing</span><strong>{form.listingType} · {form.propertyType || '—'}</strong></li>
                <li><span>Where</span><strong>{form.locality || '—'}, {form.city}</strong></li>
                <li><span>Layout</span><strong>{form.bhk} BHK · {form.baths} bath · {form.area || '—'} sq.ft · {form.furnishing}</strong></li>
                <li><span>{isRent ? 'Rent' : 'Price'}</span><strong>{form.price || '—'}</strong></li>
                {form.amenities.length > 0 && <li><span>Amenities</span><strong>{form.amenities.join(', ')}</strong></li>}
              </ul>
            </div>
            <div className="ig-loan-form-grid">
              <div className="ig-loan-input"><label>Full Name *</label><input placeholder="Arjun Sharma" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="ig-loan-input"><label>Phone *</label><input type="tel" inputMode="numeric" placeholder="98xxxxxxxx" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div className="ig-loan-input"><label>Email</label><input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <p className="ig-loan-disclaimer" style={{ marginTop: 12 }}>By submitting you agree our team may contact you to verify and publish the listing. No brokerage charged to you.</p>
          </>
        )}

        {error && <p className="ig-loan-error">{error}</p>}

        <div className="ig-post-foot">
          {step > 1
            ? <button type="button" className="ig-loan-reset" onClick={back}>← Back</button>
            : <span className="ig-post-stepcount">Step {step} of 4</span>}
          {step < 4
            ? <button type="button" className="ig-bwu-quote book" onClick={next}>Continue →</button>
            : <button type="submit" className="ig-bwu-quote book">Submit listing</button>}
        </div>
      </form>
    </div>
  );
}
