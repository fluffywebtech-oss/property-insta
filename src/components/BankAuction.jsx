import { useState, useMemo, useEffect } from 'react';
import { saveLead, whatsappLink } from '../utils/leads';
import { setSeo, origin } from '../utils/seo';
import { useToast } from '../hooks/useToast';

const DESK_PHONE = '+91-98100 00000';
const img = (id) => `https://images.unsplash.com/photo-${id}?w=600&h=400&fit=crop`;

// Representative SARFAESI bank-auction inventory. Reserve price sits below the
// open-market value — that gap is the headline "discount".
const AUCTIONS = [
  { id: 'a1', title: '3 BHK Apartment — DLF Phase 4', type: 'Residential', location: 'Sector 28, Golf Course Road', city: 'Gurgaon', bank: 'State Bank of India', reserve: 14200000, market: 18500000, possession: 'Physical', date: '2026-07-28', area: 1850, image: img('1600585154340-be6161a56a0c') },
  { id: 'a2', title: 'Commercial Shop — Sohna Road', type: 'Commercial', location: 'Sector 48, Sohna Road', city: 'Gurgaon', bank: 'HDFC Bank', reserve: 9500000, market: 13800000, possession: 'Symbolic', date: '2026-08-05', area: 620, image: img('1497366216548-37526070297c') },
  { id: 'a3', title: 'Residential Plot — 250 sq.yd', type: 'Plot', location: 'Sector 82, New Gurgaon', city: 'Gurgaon', bank: 'Punjab National Bank', reserve: 8800000, market: 12500000, possession: 'Physical', date: '2026-07-22', area: 2250, image: img('1500382017468-9049fed747ef') },
  { id: 'a4', title: '2 BHK Flat — Vaishali', type: 'Residential', location: 'Sector 4, Vaishali', city: 'Ghaziabad', bank: 'Bank of Baroda', reserve: 5200000, market: 7100000, possession: 'Physical', date: '2026-08-12', area: 1150, image: img('1560448204-e02f11c3d0e2') },
  { id: 'a5', title: 'Office Space — Cyber City fringe', type: 'Commercial', location: 'Sector 24, NH-8', city: 'Gurgaon', bank: 'ICICI Bank', reserve: 21000000, market: 27500000, possession: 'Symbolic', date: '2026-08-18', area: 1400, image: img('1524758631624-e2822e304c36') },
  { id: 'a6', title: '4 BHK Builder Floor — Green Park', type: 'Residential', location: 'Green Park', city: 'Delhi', bank: 'Axis Bank', reserve: 32000000, market: 41000000, possession: 'Physical', date: '2026-07-30', area: 2400, image: img('1600607687939-ce8a6c25118c') },
  { id: 'a7', title: 'Industrial Shed — Manesar', type: 'Commercial', location: 'IMT Manesar', city: 'Gurgaon', bank: 'Union Bank of India', reserve: 15500000, market: 22000000, possession: 'Symbolic', date: '2026-08-25', area: 5000, image: img('1553413077-190dd305871c') },
  { id: 'a8', title: '3 BHK Apartment — Noida Expressway', type: 'Residential', location: 'Sector 137, Expressway', city: 'Noida', bank: 'Canara Bank', reserve: 7400000, market: 9800000, possession: 'Physical', date: '2026-08-02', area: 1560, image: img('1600566753086-00f18fb6b3ea') },
  { id: 'a9', title: 'Farmland Plot — Sohna', type: 'Plot', location: 'Sohna–Alwar Road', city: 'Gurgaon', bank: 'IDBI Bank', reserve: 6200000, market: 9000000, possession: 'Physical', date: '2026-09-01', area: 43560, image: img('1500382017468-9049fed747ef') },
];

const FILTERS = ['All', 'Residential', 'Commercial', 'Plot'];

const PORTALS = [
  { name: 'IBAPI', full: 'Indian Banks Auctions Mortgaged Properties Info', url: 'https://ibapi.in' },
  { name: 'Baanknet / eBKray', full: 'PSB e-auction portal', url: 'https://baanknet.com' },
  { name: 'MSTC e-Auction', full: 'Govt e-auction marketplace', url: 'https://www.mstcecommerce.com' },
];

const CHECKLIST = [
  'Read the full auction notice and confirm it cites SARFAESI Sec.13(2)/13(4).',
  'Get the title chain and a fresh Encumbrance Certificate (EC) for 13–30 years.',
  'Confirm possession type — Physical (ready) vs Symbolic (you may need to evict via DRT/court).',
  'Check all outstanding dues — property tax, society maintenance, electricity, water.',
  'Physically inspect the property on the bank’s inspection date.',
  'Verify reserve price, EMD amount, and the incremental bid value.',
  'Arrange funds — winner pays 25% immediately (less EMD) and the balance within ~15 days.',
  'Read EMD refund terms for unsuccessful bidders.',
];

const inr = (n) => {
  n = Math.round(Math.abs(n || 0));
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const fmtDate = (s) => new Date(s + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const daysLeft = (s) => Math.ceil((new Date(s + 'T00:00') - new Date('2026-07-08')) / 86400000);
const discountPct = (a) => Math.round((a.market - a.reserve) / a.market * 100);
const emdOf = (reserve) => Math.round(reserve * 0.1);

export default function BankAuction() {
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  const [done, setDone] = useState({});
  const [registered, setRegistered] = useState(null);

  useEffect(() => {
    setSeo({
      title: 'Bank Auction & Distressed Properties | PropertyInsta',
      description: 'Browse bank auction (SARFAESI) properties below market value — reserve prices, EMD, auction dates and a due-diligence checklist. Register to bid.',
      canonical: origin() + '/auctions',
    });
  }, []);

  const list = useMemo(() => {
    const l = filter === 'All' ? AUCTIONS : AUCTIONS.filter(a => a.type === filter);
    return [...l].sort((a, b) => discountPct(b) - discountPct(a));
  }, [filter]);

  const doneCount = CHECKLIST.filter((_, i) => done[i]).length;

  const register = (a) => {
    const { ref } = saveLead({
      intent: 'auction-bid',
      propertyTitle: `⚖️ Auction bid — ${a.title}`,
      message: `Auction registration. ${a.title}, ${a.location}, ${a.city}. Bank: ${a.bank}. Reserve ${inr(a.reserve)} (market ~${inr(a.market)}, ${discountPct(a)}% below). EMD ${inr(emdOf(a.reserve))}. Auction on ${fmtDate(a.date)}. Please help me register and complete due diligence.`,
    });
    setRegistered({ ref, title: a.title, bank: a.bank, date: fmtDate(a.date), emd: inr(emdOf(a.reserve)) });
    toast('Registered! Our team will help you bid.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (registered) {
    return (
      <div className="ig-bwu ig-auction">
        <div className="ig-loan-success" style={{ marginTop: 24 }}>
          <span className="ig-loan-success-ico">⚖️</span>
          <h3>Bid registration received!</h3>
          <p>We’ve noted your interest in “{registered.title}” ({registered.bank}), auction on <strong>{registered.date}</strong>. Reference <strong>{registered.ref}</strong> — our team will call to guide EMD payment ({registered.emd}), due diligence and the e-auction process.</p>
          <div className="ig-loan-success-actions">
            <button className="ig-bwu-quote book" onClick={() => setRegistered(null)}>Browse more auctions</button>
            <a className="ig-loan-reset" href={whatsappLink(DESK_PHONE, `Hi, I registered to bid on ${registered.title} (${registered.bank}). Ref ${registered.ref}.`)} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ig-bwu ig-auction">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">⚖️ Bank Auctions</span>
        <h1>Distressed deals, below market value.</h1>
        <p>Bank-auctioned (SARFAESI) properties often sell under market price. Browse live auctions, do your due diligence, and register to bid — we’ll guide the process end-to-end.</p>
      </div>

      <div className="ig-auction-warn">
        ⚠️ Auction properties are sold <strong>“as-is, where-is”</strong>. Great value, but the title, dues and possession are your risk — always complete the due-diligence checklist below before bidding.
      </div>

      <div className="ig-bwu-benefits ig-auction-benefits">
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🏷️</span><div><strong>Below market</strong><span>Reserve set under value.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🏦</span><div><strong>Bank-backed</strong><span>Transparent SARFAESI process.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🔍</span><div><strong>Due diligence</strong><span>We help you check title & dues.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🤝</span><div><strong>Guided bidding</strong><span>EMD to registration.</span></div></div>
      </div>

      <div className="ig-auction-filters">
        {FILTERS.map(f => (
          <button key={f} className={`ig-bwu-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' ? ` (${AUCTIONS.filter(a => a.type === f).length})` : ` (${AUCTIONS.length})`}
          </button>
        ))}
      </div>

      <div className="ig-auction-grid">
        {list.map(a => {
          const dl = daysLeft(a.date);
          return (
            <div key={a.id} className="ig-auction-card">
              <div className="ig-auction-card-img">
                <img src={a.image} alt={a.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                <span className="ig-auction-disc">{discountPct(a)}% below market</span>
                <span className={`ig-auction-poss ${a.possession === 'Physical' ? 'phys' : 'sym'}`}>{a.possession} possession</span>
              </div>
              <div className="ig-auction-card-body">
                <div className="ig-auction-prices">
                  <strong className="ig-auction-reserve">{inr(a.reserve)}</strong>
                  <span className="ig-auction-market">{inr(a.market)}</span>
                </div>
                <span className="ig-auction-reserve-lbl">Reserve price</span>
                <h4>{a.title}</h4>
                <p>📍 {a.location}, {a.city}</p>
                <div className="ig-auction-meta">
                  <span>🏦 {a.bank}</span>
                  <span>{a.type}</span>
                  <span>{a.area >= 43560 ? `${(a.area / 43560).toFixed(2)} acre` : `${a.area.toLocaleString('en-IN')} sq.ft`}</span>
                </div>
                <div className="ig-auction-facts">
                  <div><span>EMD</span><strong>{inr(emdOf(a.reserve))}</strong></div>
                  <div><span>Auction</span><strong>{fmtDate(a.date)}</strong></div>
                  <div><span>Closes in</span><strong className={dl <= 10 ? 'soon' : ''}>{dl} days</strong></div>
                </div>
                <button className="ig-auction-bid" onClick={() => register(a)}>Register to bid</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ig-auction-lower">
        <section className="ig-auction-dd">
          <h2>🔍 Due-diligence checklist <span className="ig-pv-progress">{doneCount}/{CHECKLIST.length} done</span></h2>
          <div className="ig-pv-doclist">
            {CHECKLIST.map((c, i) => (
              <button key={i} className={`ig-pv-doc ${done[i] ? 'done' : ''}`} onClick={() => setDone(p => ({ ...p, [i]: !p[i] }))}>
                <span className="ig-pv-box">{done[i] ? '✓' : ''}</span>
                <span className="ig-pv-doc-label">{c}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ig-auction-portals">
          <h2>Official e-auction portals</h2>
          <div className="ig-auction-portal-list">
            {PORTALS.map(p => (
              <a key={p.name} className="ig-auction-portal" href={p.url} target="_blank" rel="noopener noreferrer">
                <div><strong>{p.name}</strong><span>{p.full}</span></div>
                <em>Open ↗</em>
              </a>
            ))}
          </div>
          <p className="ig-loan-disclaimer">Listings shown are representative examples. Auction details, reserve prices and dates are published by the respective banks — always verify on the official portal and notice before bidding. Not investment or legal advice.</p>
        </section>
      </div>
    </div>
  );
}
