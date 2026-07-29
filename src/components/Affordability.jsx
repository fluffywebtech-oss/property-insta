import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import { setSeo, origin } from '../utils/seo';

const FOIR = 0.5;          // max share of income toward all EMIs (lender comfort)
const BUY_COSTS = 0.07;    // stamp duty + registration + charges, from savings
const MIN_DOWN = 0.15;     // banks fund ~85%, so keep at least 15% down

const inr = (n) => {
  n = Math.round(Math.abs(n || 0));
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const inrFull = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const emiOf = (P, annual, months) => {
  const r = annual / 12 / 100;
  if (!P) return 0;
  if (r === 0) return P / months;
  return (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};
const principalOf = (emi, annual, months) => {
  const r = annual / 12 / 100;
  if (emi <= 0) return 0;
  if (r === 0) return emi * months;
  return emi * (1 - Math.pow(1 + r, -months)) / r;
};
const normP = (p) => ({
  id: p.id, title: p.title, location: p.location || '', price: p.price,
  beds: p.beds ?? p.bedrooms, sqft: p.sqft ?? p.area,
  image: (p.images && p.images[0]) || p.image,
});

// Pure so we can re-run it for "what-if" scenarios (the budget-boost levers).
const computeAfford = ({ income, existingEmi, savings, rate, tenure }) => {
  const maxEmi = Math.max(0, FOIR * income - existingEmi);
  const maxLoan = principalOf(maxEmi, rate, tenure * 12);
  const priceByFunds = (maxLoan + savings) / (1 + BUY_COSTS);
  const priceByDown = savings / (MIN_DOWN + BUY_COSTS);
  const maxPrice = Math.max(0, Math.min(priceByFunds, priceByDown));
  const loanUsed = Math.min(maxLoan, (1 - MIN_DOWN) * maxPrice);
  const downPayment = Math.max(0, maxPrice - loanUsed);
  const buyingCosts = maxPrice * BUY_COSTS;
  const emi = emiOf(loanUsed, rate, tenure * 12);
  const downLimited = priceByDown < priceByFunds;
  return { maxEmi, maxLoan, maxPrice, loanUsed, downPayment, buyingCosts, emi, downLimited };
};

function Field({ label, value, min, max, step, onChange, lo, hi }) {
  return (
    <div className="ig-loan-field">
      <div className="ig-loan-field-top"><label>{label}</label><strong>{inr(value)}</strong></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
      <div className="ig-loan-scale"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

export default function Affordability() {
  const { allProperties, openProperty, setCurrentView } = useApp();
  const [income, setIncome] = useState(150000);
  const [existingEmi, setExistingEmi] = useState(10000);
  const [savings, setSavings] = useState(2500000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  useEffect(() => {
    setSeo({
      title: 'How Much Home Can I Afford? Affordability Calculator | PropertyInsta',
      description: 'Find your home-buying budget in seconds — enter income, EMIs and savings to see the maximum property price you can afford, your loan eligibility and matching homes.',
      canonical: origin() + '/affordability',
    });
  }, []);

  const calc = useMemo(
    () => computeAfford({ income, existingEmi, savings, rate, tenure }),
    [income, existingEmi, savings, rate, tenure]
  );

  // EMI-to-income health — how much of the paycheck goes to all EMIs.
  const health = useMemo(() => {
    const pct = income ? (existingEmi + calc.emi) / income : 0;
    const cls = pct <= 0.35 ? 'good' : pct <= 0.45 ? 'ok' : 'tight';
    const label = pct <= 0.35 ? 'Comfortable' : pct <= 0.45 ? 'Manageable' : 'Stretched';
    return { pct, cls, label };
  }, [income, existingEmi, calc.emi]);

  // "What-if" levers — how much each move would add to the budget.
  const levers = useMemo(() => {
    const base = calc.maxPrice;
    const at = (o) => computeAfford({ income, existingEmi, savings, rate, tenure, ...o }).maxPrice - base;
    const opts = [
      { id: 'co', icon: '👥', label: 'Add a co-applicant', sub: 'Combine two incomes', delta: at({ income: income + Math.max(40000, Math.round(income * 0.6)) }) },
      { id: 'dp', icon: '💰', label: 'Save ₹10 L more', sub: 'Bigger down payment', delta: at({ savings: savings + 1000000 }) },
    ];
    if (tenure < 30) {
      const nt = Math.min(30, tenure + 5);
      opts.push({ id: 'ten', icon: '📅', label: `Extend tenure to ${nt} yrs`, sub: 'Lower EMI, bigger loan', delta: at({ tenure: nt }) });
    }
    if (existingEmi > 0) {
      opts.push({ id: 'clear', icon: '✅', label: 'Clear existing EMIs', sub: 'Frees up your income', delta: at({ existingEmi: 0 }) });
    }
    return opts.filter(o => o.delta > 50000).sort((a, b) => b.delta - a.delta).slice(0, 3);
  }, [income, existingEmi, savings, rate, tenure, calc.maxPrice]);

  const matches = useMemo(() => {
    if (calc.maxPrice <= 0) return [];
    const inBudget = (allProperties || [])
      .filter(p => (p.status === 'sale' || p.status === 'For Sale' || !p.status) && p.price > 0 && p.price <= calc.maxPrice)
      .map(normP)
      .sort((a, b) => b.price - a.price);
    return inBudget.slice(0, 6);
  }, [allProperties, calc.maxPrice]);

  return (
    <div className="ig-bwu ig-afford">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">💰 Affordability</span>
        <h1>How much home can you afford?</h1>
        <p>Enter your income, existing EMIs and savings — we’ll show your realistic budget, loan eligibility, and homes that fit it. Free, no sign-up.</p>
      </div>

      <div className="ig-loan-calc">
        <div className="ig-loan-inputs">
          <Field label="Monthly income" value={income} min={25000} max={1000000} step={5000} onChange={setIncome} lo="₹25 K" hi="₹10 L" />
          <Field label="Existing EMIs / month" value={existingEmi} min={0} max={300000} step={1000} onChange={setExistingEmi} lo="₹0" hi="₹3 L" />
          <Field label="Savings for down payment" value={savings} min={0} max={30000000} step={100000} onChange={setSavings} lo="₹0" hi="₹3 Cr" />
          <Field label="Loan interest rate" value={rate} min={7} max={12} step={0.05} onChange={setRate} lo="7%" hi="12%" />
          <div className="ig-loan-input"><label>Loan tenure</label>
            <select value={tenure} onChange={e => setTenure(+e.target.value)}>{[10, 15, 20, 25, 30].map(t => <option key={t} value={t}>{t} years</option>)}</select>
          </div>
          <p className="ig-loan-note">Assumes lenders cap all EMIs at {Math.round(FOIR * 100)}% of income, ~{Math.round(BUY_COSTS * 100)}% one-time buying costs, and at least {Math.round(MIN_DOWN * 100)}% down.</p>
        </div>

        <div className="ig-loan-results">
          <div className="ig-afford-hero">
            <span>You can afford a home up to</span>
            <h2>{inr(calc.maxPrice)}</h2>
            <p>with a monthly EMI of <strong>{inrFull(calc.emi)}</strong></p>
            <div className={`ig-afford-health ${health.cls}`}>
              <i />EMIs would be <strong>{Math.round(health.pct * 100)}%</strong> of your income · {health.label}
            </div>
          </div>

          <div className="ig-afford-split">
            <div className="ig-afford-split-bar">
              <span className="loan" style={{ width: `${calc.maxPrice ? calc.loanUsed / calc.maxPrice * 100 : 0}%` }} />
              <span className="down" style={{ width: `${calc.maxPrice ? calc.downPayment / calc.maxPrice * 100 : 0}%` }} />
            </div>
            <div className="ig-afford-legend">
              <span><i className="loan" />Home loan {inr(calc.loanUsed)}</span>
              <span><i className="down" />Down payment {inr(calc.downPayment)}</span>
            </div>
          </div>

          <div className="ig-loan-stats">
            <div><span>Loan eligibility</span><strong>{inr(calc.maxLoan)}</strong></div>
            <div><span>Down payment</span><strong>{inr(calc.downPayment)}</strong></div>
            <div><span>Est. buying costs</span><strong>{inr(calc.buyingCosts)}</strong></div>
            <div><span>Monthly EMI</span><strong>{inrFull(calc.emi)}</strong></div>
          </div>

          {calc.downLimited && (
            <div className="ig-afford-tip">💡 Your budget is capped by savings, not income — a bigger down payment (or a co-applicant) would raise it.</div>
          )}
          <p className="ig-loan-disclaimer">Indicative estimate — actual eligibility depends on credit score, employer, and lender policy. Buying costs vary by state. Not a loan sanction.</p>
        </div>
      </div>

      {levers.length > 0 && (
        <section className="ig-afford-boost">
          <h2>Ways to raise your budget</h2>
          <div className="ig-afford-levers">
            {levers.map(l => (
              <div key={l.id} className="ig-afford-lever">
                <span className="ig-afford-lever-ico">{l.icon}</span>
                <div className="ig-afford-lever-txt">
                  <strong>{l.label}</strong>
                  <span>{l.sub}</span>
                </div>
                <span className="ig-afford-lever-delta">+{inr(l.delta)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="ig-bwu-section" style={{ marginTop: 28 }}>
        <div className="ig-bwu-section-head">
          <h2>Homes within your budget</h2>
          {matches.length > 0 && <span className="ig-bwu-section-count">up to {inr(calc.maxPrice)}</span>}
        </div>
        {matches.length === 0 ? (
          <div className="ig-bwu-empty">No listings under {inr(calc.maxPrice)} right now — try adjusting the inputs or <button className="ig-afford-link" onClick={() => setCurrentView('feed')}>browse all homes</button>.</div>
        ) : (
          <div className="ig-loc-projects-grid">
            {matches.map(m => (
              <button key={m.id} className="ig-loc-proj" onClick={() => openProperty(m.id)}>
                <img src={m.image} alt={m.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                <div className="ig-loc-proj-body">
                  <strong>{formatPriceIndian(m.price)}</strong>
                  <span className="ig-loc-proj-title">{m.title}</span>
                  <span className="ig-loc-proj-loc">{m.beds} BHK · {Number(m.sqft).toLocaleString('en-IN')} sq.ft · {m.location}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
