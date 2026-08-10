import { useState, useEffect, useMemo } from 'react';
import { setSeo, origin } from '../utils/seo';

const inrShort = (n) => {
  const neg = n < 0; n = Math.abs(Math.round(n || 0));
  let s;
  if (n >= 10000000) s = `₹${(n / 10000000).toFixed(2)} Cr`;
  else if (n >= 100000) s = `₹${(n / 100000).toFixed(1)} L`;
  else s = `₹${n.toLocaleString('en-IN')}`;
  return (neg ? '−' : '') + s;
};

const emiOf = (P, annual, years) => {
  const r = annual / 12 / 100, n = years * 12;
  if (!P) return 0;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};
const balanceAfter = (P, annual, tenure, yrs) => {
  const r = annual / 12 / 100, n = tenure * 12, m = Math.min(yrs, tenure) * 12;
  if (P <= 0) return 0;
  if (r === 0) return Math.max(0, P - (P / n) * m);
  const emi = emiOf(P, annual, tenure);
  return Math.max(0, P * Math.pow(1 + r, m) - emi * ((Math.pow(1 + r, m) - 1) / r));
};

const BUY_COSTS_PCT = 0.06;   // stamp duty + registration + charges (one-time)
const MAINT_PCT = 0.005;      // annual maintenance + property tax

// Module-level so sliders don't remount (and lose drag) on every render.
function Field({ label, value, unit, min, max, step, onChange, lo, hi }) {
  return (
    <div className="ig-loan-field">
      <div className="ig-loan-field-top"><label>{label}</label><strong>{unit === '₹' ? inrShort(value) : `${value}${unit}`}</strong></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
      <div className="ig-loan-scale"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

export default function RentVsBuy() {
  const [price, setPrice] = useState(8000000);
  const [rent, setRent] = useState(28000);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [stay, setStay] = useState(7);
  const [appr, setAppr] = useState(7);
  const [rentInc, setRentInc] = useState(5);
  const [invest, setInvest] = useState(9);

  useEffect(() => {
    setSeo({ title: 'Rent vs Buy Calculator | PropertyInsta', description: 'Should you rent or buy? Compare the true cost of buying (with equity & appreciation) vs renting (with your down payment invested), and find your break-even year.', canonical: origin() + '/rent-vs-buy' });
  }, []);

  const compute = (y) => {
    const loan = price * (1 - down / 100);
    const emi = emiOf(loan, rate, tenure);
    const downAmt = price * down / 100;
    const buyCosts = price * BUY_COSTS_PCT;
    const emiPaid = emi * Math.min(y, tenure) * 12;
    const maint = price * MAINT_PCT * y;
    const homeVal = price * Math.pow(1 + appr / 100, y);
    const outstanding = balanceAfter(loan, rate, tenure, y);
    const equity = homeVal - outstanding;
    const buyNet = downAmt + buyCosts + emiPaid + maint - equity;
    let totalRent = 0;
    for (let k = 0; k < y; k++) totalRent += rent * 12 * Math.pow(1 + rentInc / 100, k);
    const invGain = (downAmt + buyCosts) * (Math.pow(1 + invest / 100, y) - 1);
    const rentNet = totalRent - invGain;
    return { buyNet, rentNet, emi, equity, homeVal, totalRent, invGain, appreciation: homeVal - price };
  };

  const r = useMemo(() => compute(stay), [price, rent, down, rate, tenure, stay, appr, rentInc, invest]);
  const buyWins = r.buyNet < r.rentNet;
  const diff = Math.abs(r.rentNet - r.buyNet);
  const breakEven = useMemo(() => {
    for (let y = 1; y <= 30; y++) { const c = compute(y); if (c.buyNet <= c.rentNet) return y; }
    return null;
  }, [price, rent, down, rate, tenure, appr, rentInc, invest]);
  const maxNet = Math.max(Math.abs(r.buyNet), Math.abs(r.rentNet), 1);

  return (
    <div className="ig-bwu ig-rvb">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">⚖️ Rent vs Buy</span>
        <h1>Should you rent or buy?</h1>
        <p>Compare the real cost of buying (equity &amp; appreciation) against renting (with your down payment invested) — and find your break-even year.</p>
      </div>

      <div className="ig-loan-calc">
        <div className="ig-loan-inputs">
          <Field label="Property Price" value={price} unit="₹" min={2000000} max={50000000} step={100000} onChange={setPrice} lo="₹20 L" hi="₹5 Cr" />
          <Field label="Equivalent Monthly Rent" value={rent} unit="₹" min={8000} max={300000} step={1000} onChange={setRent} lo="₹8 K" hi="₹3 L" />
          <Field label="Down Payment" value={down} unit="%" min={10} max={50} step={1} onChange={setDown} lo="10%" hi="50%" />
          <Field label="Loan Interest Rate" value={rate} unit="%" min={7} max={12} step={0.05} onChange={setRate} lo="7%" hi="12%" />
          <Field label="Loan Tenure" value={tenure} unit=" yrs" min={5} max={30} step={1} onChange={setTenure} lo="5 yrs" hi="30 yrs" />
          <Field label="How long you'll stay" value={stay} unit=" yrs" min={1} max={30} step={1} onChange={setStay} lo="1 yr" hi="30 yrs" />
          <div className="ig-rvb-assump">
            <div className="ig-loan-input"><label>Appreciation %/yr</label><input type="number" step="0.5" value={appr} onChange={e => setAppr(+e.target.value)} /></div>
            <div className="ig-loan-input"><label>Rent hike %/yr</label><input type="number" step="0.5" value={rentInc} onChange={e => setRentInc(+e.target.value)} /></div>
            <div className="ig-loan-input"><label>Invest return %/yr</label><input type="number" step="0.5" value={invest} onChange={e => setInvest(+e.target.value)} /></div>
          </div>
        </div>

        <div className="ig-loan-results">
          <div className={`ig-rvb-verdict ${buyWins ? 'buy' : 'rent'}`}>
            <span>Over {stay} year{stay === 1 ? '' : 's'}</span>
            <h2>{buyWins ? 'Buying wins' : 'Renting wins'}</h2>
            <p>by <strong>{inrShort(diff)}</strong></p>
          </div>
          <div className="ig-rvb-bars">
            <div className="ig-rvb-bar-row">
              <span className="ig-rvb-bar-label">Buy — net cost</span>
              <div className="ig-rvb-bar"><span className={`fill buy ${buyWins ? 'win' : ''}`} style={{ width: `${Math.max(4, Math.abs(r.buyNet) / maxNet * 100)}%` }} /></div>
              <span className="ig-rvb-bar-val">{inrShort(r.buyNet)}</span>
            </div>
            <div className="ig-rvb-bar-row">
              <span className="ig-rvb-bar-label">Rent — net cost</span>
              <div className="ig-rvb-bar"><span className={`fill rent ${!buyWins ? 'win' : ''}`} style={{ width: `${Math.max(4, Math.abs(r.rentNet) / maxNet * 100)}%` }} /></div>
              <span className="ig-rvb-bar-val">{inrShort(r.rentNet)}</span>
            </div>
          </div>
          <div className="ig-rvb-breakeven">
            {breakEven ? <>📈 Buying pays off from <strong>year {breakEven}</strong></> : <>🏠 Renting stays cheaper for 30+ years at these numbers</>}
          </div>
          <div className="ig-loan-stats">
            <div><span>Home value @ {stay}y</span><strong>{inrShort(r.homeVal)}</strong></div>
            <div><span>Equity built</span><strong>{inrShort(r.equity)}</strong></div>
            <div><span>Total rent paid</span><strong>{inrShort(r.totalRent)}</strong></div>
            <div><span>Invest. gains</span><strong>{inrShort(r.invGain)}</strong></div>
          </div>
          <p className="ig-loan-disclaimer">Indicative model — assumes {(BUY_COSTS_PCT * 100)}% one-time buying costs, {(MAINT_PCT * 100)}%/yr upkeep, and the down payment invested if you rent. Not financial advice.</p>
        </div>
      </div>
    </div>
  );
}
