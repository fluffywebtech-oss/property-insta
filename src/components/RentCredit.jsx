import { useState, useMemo, useEffect } from 'react';
import { saveLead, whatsappLink } from '../utils/leads';
import { setSeo, origin } from '../utils/seo';
import { useToast } from '../hooks/useToast';

const DESK_PHONE = '+91-98100 00000';
const RATE = 15;            // indicative annual % for an unsecured rent credit line
const FOIR = 0.5;           // max share of income that can go to all monthly obligations
const PROCESSING_PCT = 0.015;
const EMP = { 'Salaried': 1.0, 'Self-employed': 0.82 };
const TENURES = [6, 12, 18, 24];

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
// Reverse: the largest principal whose EMI stays within `emi`.
const principalOf = (emi, annual, months) => {
  const r = annual / 12 / 100;
  if (emi <= 0) return 0;
  if (r === 0) return emi * months;
  return emi * (1 - Math.pow(1 + r, -months)) / r;
};

// Module-level so the sliders don't remount (and lose drag) on every render.
function Field({ label, value, min, max, step, onChange, lo, hi }) {
  return (
    <div className="ig-loan-field">
      <div className="ig-loan-field-top"><label>{label}</label><strong>{inr(value)}</strong></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
      <div className="ig-loan-scale"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

export default function RentCredit() {
  const toast = useToast();
  const [income, setIncome] = useState(120000);
  const [rent, setRent] = useState(35000);
  const [existingEmi, setExistingEmi] = useState(15000);
  const [depositMonths, setDepositMonths] = useState(3);
  const [financeMonths, setFinanceMonths] = useState(1);
  const [tenure, setTenure] = useState(12);
  const [employment, setEmployment] = useState('Salaried');
  const [activated, setActivated] = useState(null);

  useEffect(() => {
    setSeo({
      title: 'Rent Credit — Deposit-Free Renting | PropertyInsta',
      description: 'Get pre-approved for a rent credit line to cover your security deposit and months of rent — move in deposit-free and repay in easy EMIs.',
      canonical: origin() + '/rent-credit',
    });
  }, []);

  const calc = useMemo(() => {
    const empM = EMP[employment] ?? 1;
    const requested = rent * (depositMonths + financeMonths);
    // Room left for a new EMI after existing EMIs and the ongoing rent.
    const maxCreditEmi = Math.max(0, FOIR * income * empM - existingEmi - rent);
    const maxLine = principalOf(maxCreditEmi, RATE, tenure);
    const approved = Math.max(0, Math.min(requested, maxLine));
    const emi = emiOf(approved, RATE, tenure);
    const totalRepay = emi * tenure;
    const interest = totalRepay - approved;
    const processing = approved * PROCESSING_PCT;
    const coverageMonths = rent > 0 ? approved / rent : 0;
    const eligible = approved >= rent;                 // at least ~1 month of value
    const partial = eligible && approved < requested - 1;
    const foirUsed = income > 0 ? (existingEmi + rent + emi) / income : 0;
    return { requested, approved, emi, totalRepay, interest, processing, coverageMonths, eligible, partial, maxLine, foirUsed };
  }, [income, rent, existingEmi, depositMonths, financeMonths, tenure, employment]);

  const activate = () => {
    const { ref } = saveLead({
      intent: 'rent-credit',
      propertyTitle: `💳 Rent Credit line — ${inr(calc.approved)}`,
      message: `Rent Credit application. Income ${inrFull(income)}/mo, rent ${inrFull(rent)}/mo, existing EMI ${inrFull(existingEmi)}, ${employment}. Pre-approved line ${inr(calc.approved)} over ${tenure} months (EMI ${inrFull(calc.emi)}). Covers ${depositMonths}-month deposit + ${financeMonths} month(s) rent. Please call to complete KYC.`,
    });
    setActivated({ ref, amount: inr(calc.approved), emi: inrFull(calc.emi), tenure });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (activated) {
    return (
      <div className="ig-bwu ig-credit">
        <div className="ig-loan-success" style={{ marginTop: 24 }}>
          <span className="ig-loan-success-ico">💳</span>
          <h3>Rent Credit application received!</h3>
          <p>Your pre-approved line of <strong>{activated.amount}</strong> ({activated.emi}/mo × {activated.tenure} months) is reserved. Reference <strong>{activated.ref}</strong> — our team will call to complete a quick KYC and activate it, usually within a day.</p>
          <div className="ig-loan-success-actions">
            <button className="ig-bwu-quote book" onClick={() => setActivated(null)}>Recalculate</button>
            <a className="ig-loan-reset" href={whatsappLink(DESK_PHONE, `Hi, I applied for a Rent Credit line of ${activated.amount}. Ref ${activated.ref}.`)} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ig-bwu ig-credit">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">💳 Rent Credit</span>
        <h1>Move in deposit-free.</h1>
        <p>Get pre-approved for a rent credit line that covers your security deposit &amp; first months of rent — then repay in easy monthly EMIs. No collateral, instant decision.</p>
      </div>

      <div className="ig-loan-calc">
        <div className="ig-loan-inputs">
          <Field label="Monthly income" value={income} min={20000} max={500000} step={5000} onChange={setIncome} lo="₹20 K" hi="₹5 L" />
          <Field label="Monthly rent" value={rent} min={8000} max={200000} step={1000} onChange={setRent} lo="₹8 K" hi="₹2 L" />
          <Field label="Existing EMIs / month" value={existingEmi} min={0} max={200000} step={1000} onChange={setExistingEmi} lo="₹0" hi="₹2 L" />
          <div className="ig-credit-selects">
            <div className="ig-loan-input"><label>Deposit (months of rent)</label>
              <select value={depositMonths} onChange={e => setDepositMonths(+e.target.value)}>{[1, 2, 3, 4, 5, 6].map(m => <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>)}</select>
            </div>
            <div className="ig-loan-input"><label>Also finance rent</label>
              <select value={financeMonths} onChange={e => setFinanceMonths(+e.target.value)}>{[0, 1, 2, 3].map(m => <option key={m} value={m}>{m === 0 ? 'Deposit only' : `+${m} month${m > 1 ? 's' : ''}`}</option>)}</select>
            </div>
            <div className="ig-loan-input"><label>Repayment tenure</label>
              <select value={tenure} onChange={e => setTenure(+e.target.value)}>{TENURES.map(t => <option key={t} value={t}>{t} months</option>)}</select>
            </div>
            <div className="ig-loan-input"><label>Employment</label>
              <select value={employment} onChange={e => setEmployment(e.target.value)}>{Object.keys(EMP).map(k => <option key={k}>{k}</option>)}</select>
            </div>
          </div>
          <p className="ig-loan-note">You’re asking for {inr(calc.requested)} ({depositMonths}-month deposit{financeMonths ? ` + ${financeMonths} month${financeMonths > 1 ? 's' : ''} rent` : ''}).</p>
        </div>

        <div className="ig-loan-results">
          {calc.eligible ? (
            <>
              <div className={`ig-credit-approve ${calc.partial ? 'partial' : ''}`}>
                <span className="ig-credit-badge">{calc.partial ? '✅ Partially pre-approved' : '🎉 You’re pre-approved!'}</span>
                <span className="ig-credit-cap">Rent Credit Line</span>
                <h2>{inr(calc.approved)}</h2>
                <p className="ig-credit-covers">Covers your {inr(rent * depositMonths)} deposit{financeMonths ? ` + ${financeMonths} month${financeMonths > 1 ? 's' : ''} rent` : ''} — that’s about <strong>{calc.coverageMonths.toFixed(1)} months</strong> of rent.</p>
                {calc.partial && <p className="ig-credit-note">Based on your income we’ve approved a bit less than requested. Lower the deposit months or extend the tenure to fit more.</p>}
              </div>
              <div className="ig-credit-emi">
                <div><span>Monthly EMI</span><strong>{inrFull(calc.emi)}</strong></div>
                <div><span>Tenure</span><strong>{tenure} months</strong></div>
                <div><span>Interest rate</span><strong>{RATE}% p.a.</strong></div>
              </div>
              <div className="ig-loan-stats">
                <div><span>Total repayment</span><strong>{inr(calc.totalRepay)}</strong></div>
                <div><span>Interest</span><strong>{inr(calc.interest)}</strong></div>
                <div><span>Processing fee</span><strong>{inrFull(calc.processing)}</strong></div>
                <div><span>Income used</span><strong>{Math.round(calc.foirUsed * 100)}%</strong></div>
              </div>
              <button className="ig-bwu-quote book" onClick={activate}>Activate credit line →</button>
              <p className="ig-loan-disclaimer">Indicative pre-approval from the details you entered — final limit &amp; rate confirmed after KYC and verification. Representative {RATE}% p.a.; a {(PROCESSING_PCT * 100).toFixed(1)}% processing fee applies. Not a loan sanction.</p>
            </>
          ) : (
            <div className="ig-credit-decline">
              <span>😕</span>
              <h3>Not quite eligible yet</h3>
              <p>With your current income and obligations, the rent + a new EMI would exceed our limit. Try a lower rent, a smaller deposit, or clearing some existing EMIs — then check again.</p>
            </div>
          )}
        </div>
      </div>

      <div className="ig-bwu-benefits ig-credit-benefits">
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🔓</span><div><strong>Deposit-free move-in</strong><span>Keep your savings liquid.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">⚡</span><div><strong>Instant decision</strong><span>Pre-approved in seconds.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🧾</span><div><strong>Easy EMIs</strong><span>Repay over 6–24 months.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🛡️</span><div><strong>No collateral</strong><span>Unsecured, paperwork-light.</span></div></div>
      </div>

      <section className="ig-credit-how">
        <h2>How Rent Credit works</h2>
        <div className="ig-credit-steps">
          <div className="ig-credit-step"><span>1</span><strong>Check your limit</strong><p>Enter income &amp; rent to see your pre-approved credit line instantly.</p></div>
          <div className="ig-credit-step"><span>2</span><strong>Activate &amp; KYC</strong><p>Complete a quick digital KYC — we verify and sanction, usually within a day.</p></div>
          <div className="ig-credit-step"><span>3</span><strong>We pay the deposit</strong><p>The deposit goes straight to your landlord — you move in deposit-free.</p></div>
          <div className="ig-credit-step"><span>4</span><strong>Repay in EMIs</strong><p>Pay it back comfortably over your chosen tenure. Foreclose anytime.</p></div>
        </div>
      </section>
    </div>
  );
}
