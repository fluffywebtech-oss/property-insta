import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { localities } from '../data';
import { formatPriceIndian } from '../data';
import { saveLead, whatsappLink } from '../utils/leads';
import { setSeo, origin } from '../utils/seo';
import { useToast } from '../hooks/useToast';

const DESK_PHONE = '+91-98100 00000';

const TYPES = [
  { key: 'Apartment', m: 1.0 }, { key: 'Builder Floor', m: 0.96 },
  { key: 'Villa / House', m: 1.14 }, { key: 'Penthouse', m: 1.22 }, { key: 'Plot / Land', m: 0.72 },
];
const CONDITIONS = [
  { key: 'Newly built', m: 1.05 }, { key: 'Well maintained', m: 1.0 }, { key: 'Needs work', m: 0.9 },
];

const inrShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const normP = (p) => ({
  id: p.id, title: p.title, location: p.location || '', price: p.price,
  beds: p.beds ?? p.bedrooms, sqft: p.sqft ?? p.area,
  image: (p.images && p.images[0]) || p.image,
  builder: p.builder, possession: p.possessionStatus || p.possession,
  rera: p.reraId || p.rera, type: p.type,
});

export default function InstantDeal() {
  const { allProperties, openProperty } = useApp();
  const toast = useToast();
  const [mode, setMode] = useState('sell');

  // ── Instant Sell state ──
  const [locId, setLocId] = useState(localities[0].id);
  const [ptype, setPtype] = useState('Apartment');
  const [bhk, setBhk] = useState('3');
  const [area, setArea] = useState(1800);
  const [condition, setCondition] = useState('Well maintained');
  const [accepted, setAccepted] = useState(null);

  // ── Instant Buy state ──
  const [reserved, setReserved] = useState(null);

  useEffect(() => {
    setSeo({
      title: 'Instant Buy & Instant Sell | PropertyInsta',
      description: 'Sell your home for an instant cash offer in days — or reserve a ready-to-move, verified home instantly with a refundable token. No waiting, no showings.',
      canonical: origin() + '/instant',
    });
  }, []);

  const loc = localities.find(l => l.id === locId) || localities[0];

  // Instant Sell offer — iBuyer style: a certain, fast offer slightly below
  // open-market value, in exchange for speed and zero hassle.
  const offer = useMemo(() => {
    const tM = TYPES.find(t => t.key === ptype)?.m ?? 1;
    const cM = CONDITIONS.find(c => c.key === condition)?.m ?? 1;
    const rate = Math.round(loc.avgPrice * tM * cM);
    const marketValue = rate * Number(area || 0);
    const instant = marketValue * 0.91;              // ~9% convenience discount
    return { marketValue, instant, low: instant * 0.97, high: instant * 1.03, rate };
  }, [loc, ptype, condition, area]);

  const acceptOffer = () => {
    const title = `${bhk} BHK ${ptype} in ${loc.name}`;
    const { ref } = saveLead({
      intent: 'instant-sell',
      propertyTitle: `⚡ Instant Sell — ${title}`,
      message: `Instant Sell request. ${title}, ~${area} sq.ft, ${condition}. Instant offer ${inrShort(offer.instant)} (market ~${inrShort(offer.marketValue)}). Please call to confirm and schedule inspection.`,
    });
    setAccepted({ ref, title, amount: inrShort(offer.instant) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Instant Buy inventory — ready-to-move, RERA-tagged sale homes only.
  const instantHomes = useMemo(() => {
    return allProperties
      .filter(p => (p.status === 'sale' || p.status === 'For Sale' || !p.status) &&
        String(p.possessionStatus || p.possession || '').toLowerCase().includes('ready') &&
        (p.reraId || p.rera))
      .map(normP)
      .slice(0, 9);
  }, [allProperties]);

  const tokenOf = (price) => Math.max(50000, Math.round(price * 0.01 / 1000) * 1000); // 1%, min ₹50k

  const reserve = (home) => {
    const token = tokenOf(home.price);
    const { ref } = saveLead({
      intent: 'instant-buy',
      propertyId: home.id,
      propertyTitle: `⚡ Instant Buy — ${home.title}`,
      message: `Instant Buy reservation for ${home.title}, ${home.location}. Price ${inrShort(home.price)}. Refundable token ${inrShort(token)}. Please call to confirm and hold the unit.`,
    });
    setReserved({ ref, title: home.title, token: inrShort(token), price: inrShort(home.price) });
    toast('Unit held! Our team will call you to confirm.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Confirmation screens ──
  if (mode === 'sell' && accepted) {
    return (
      <div className="ig-bwu ig-instant">
        <div className="ig-loan-success" style={{ marginTop: 24 }}>
          <span className="ig-loan-success-ico">⚡</span>
          <h3>Instant offer locked in!</h3>
          <p>Your instant offer of <strong>{accepted.amount}</strong> for “{accepted.title}” is reserved. Reference <strong>{accepted.ref}</strong> — our team will call within 24 hours to schedule a quick inspection and finalise the sale.</p>
          <div className="ig-loan-success-actions">
            <button className="ig-bwu-quote book" onClick={() => setAccepted(null)}>Recalculate</button>
            <a className="ig-loan-reset" href={whatsappLink(DESK_PHONE, `Hi, I accepted the Instant Sell offer for my ${accepted.title} (${accepted.amount}). Ref ${accepted.ref}.`)} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          </div>
        </div>
      </div>
    );
  }
  if (mode === 'buy' && reserved) {
    return (
      <div className="ig-bwu ig-instant">
        <div className="ig-loan-success" style={{ marginTop: 24 }}>
          <span className="ig-loan-success-ico">🔒</span>
          <h3>Unit reserved for you!</h3>
          <p>“{reserved.title}” ({reserved.price}) is on hold with a refundable token of <strong>{reserved.token}</strong>. Reference <strong>{reserved.ref}</strong> — our team will call to confirm the hold and guide the next steps. The token is fully refundable if you don’t proceed.</p>
          <div className="ig-loan-success-actions">
            <button className="ig-bwu-quote book" onClick={() => setReserved(null)}>Browse more homes</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ig-bwu ig-instant">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">⚡ Instant Deal</span>
        <h1>Buy or sell in days, not months.</h1>
        <p>Skip the endless showings and waiting. Get an instant cash offer for your home, or reserve a ready-to-move verified home on the spot.</p>
      </div>

      <div className="ig-bwu-modes ig-instant-modes">
        <button className={`ig-bwu-mode ${mode === 'sell' ? 'active' : ''}`} onClick={() => setMode('sell')}>⚡ Instant Sell</button>
        <button className={`ig-bwu-mode ${mode === 'buy' ? 'active' : ''}`} onClick={() => setMode('buy')}>⚡ Instant Buy</button>
      </div>

      {mode === 'sell' ? (
        <>
          <div className="ig-loan-calc">
            <div className="ig-loan-inputs ig-val-inputs">
              <div className="ig-loan-input"><label>Locality</label>
                <select value={locId} onChange={e => setLocId(e.target.value)}>{localities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
              </div>
              <div className="ig-loan-input"><label>Property type</label>
                <select value={ptype} onChange={e => setPtype(e.target.value)}>{TYPES.map(t => <option key={t.key}>{t.key}</option>)}</select>
              </div>
              <div className="ig-val-row">
                <div className="ig-loan-input"><label>Bedrooms</label>
                  <select value={bhk} onChange={e => setBhk(e.target.value)}>{['1', '2', '3', '4', '5', '5+'].map(o => <option key={o}>{o}</option>)}</select>
                </div>
                <div className="ig-loan-input"><label>Built-up area (sq.ft)</label>
                  <input type="number" inputMode="numeric" value={area} onChange={e => setArea(e.target.value)} />
                </div>
              </div>
              <div className="ig-loan-input"><label>Condition</label>
                <select value={condition} onChange={e => setCondition(e.target.value)}>{CONDITIONS.map(c => <option key={c.key}>{c.key}</option>)}</select>
              </div>
              <p className="ig-loan-note">{loc.name}: market rate ~₹{loc.avgPrice.toLocaleString('en-IN')}/sq.ft</p>
            </div>

            <div className="ig-loan-results">
              <div className="ig-instant-offer">
                <span>Your instant cash offer</span>
                <h2>{inrShort(offer.instant)}</h2>
                <div className="ig-instant-range"><span>{inrShort(offer.low)}</span><em>indicative range</em><span>{inrShort(offer.high)}</span></div>
                <div className="ig-instant-vs">Open-market value ~<strong>{inrShort(offer.marketValue)}</strong> — the instant offer trades a small discount for a fast, certain sale.</div>
              </div>
              <button className="ig-bwu-quote book" onClick={acceptOffer}>Accept &amp; get a callback</button>
              <p className="ig-loan-disclaimer">Indicative instant offer from locality trends — final offer confirmed after a quick inspection. Not a binding quote.</p>
            </div>
          </div>

          <div className="ig-bwu-benefits ig-instant-benefits">
            <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">⏱️</span><div><strong>Sell in ~7 days</strong><span>No months of waiting.</span></div></div>
            <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🚫</span><div><strong>Zero showings</strong><span>No strangers in your home.</span></div></div>
            <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">✅</span><div><strong>Certain sale</strong><span>No chain, no fall-through.</span></div></div>
            <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">💵</span><div><strong>Fast payout</strong><span>Cash offer, quick close.</span></div></div>
          </div>
        </>
      ) : (
        <>
          <div className="ig-instant-buyhead">
            <div className="ig-bwu-benefits ig-instant-benefits">
              <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🏠</span><div><strong>Ready to move</strong><span>Shift in immediately.</span></div></div>
              <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🛡️</span><div><strong>RERA verified</strong><span>Clean, checked titles.</span></div></div>
              <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🔒</span><div><strong>Hold instantly</strong><span>1% refundable token.</span></div></div>
              <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">↩️</span><div><strong>Fully refundable</strong><span>Back out any time.</span></div></div>
            </div>
          </div>

          {instantHomes.length === 0 ? (
            <div className="ig-bwu-empty">No instant-buy homes available right now — check back soon.</div>
          ) : (
            <div className="ig-instant-grid">
              {instantHomes.map(h => (
                <div key={h.id} className="ig-instant-card">
                  <button className="ig-instant-card-img" onClick={() => openProperty(h.id)}>
                    <img src={h.image} alt={h.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                    <span className="ig-instant-tag">⚡ Instant Buy</span>
                    <span className="ig-instant-ready">Ready to Move</span>
                  </button>
                  <div className="ig-instant-card-body">
                    <strong className="ig-instant-price">{inrShort(h.price)}</strong>
                    <h4>{h.title}</h4>
                    <p>📍 {h.location}</p>
                    <div className="ig-instant-card-meta">
                      <span>{h.beds} BHK</span>
                      <span>{Number(h.sqft).toLocaleString('en-IN')} sq.ft</span>
                      {h.rera && <span className="rera">🛡️ RERA</span>}
                    </div>
                    <div className="ig-instant-token">Reserve with <strong>{inrShort(tokenOf(h.price))}</strong> refundable token</div>
                    <div className="ig-instant-card-actions">
                      <button className="ig-instant-reserve" onClick={() => reserve(h)}>🔒 Reserve now</button>
                      <button className="ig-instant-view" onClick={() => openProperty(h.id)}>View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="ig-loan-disclaimer" style={{ marginTop: 16 }}>Reservation places a temporary hold subject to confirmation by our team. The token is fully refundable if you choose not to proceed. Not a purchase contract.</p>
        </>
      )}
    </div>
  );
}
