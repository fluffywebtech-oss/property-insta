import { useState, useEffect, useRef, useMemo } from 'react';
import { saveLead, whatsappLink } from '../utils/leads';
import { setSeo, setJsonLd, origin } from '../utils/seo';

const DESK_PHONE = '+91-98100 00000';

// Partner lenders — indicative rates (per annum, reducing balance)
const LENDERS = [
  { name: 'HDFC Bank', logo: '🏦', rate: 8.40, processing: '0.50%', maxTenure: 30, maxLoan: '₹10 Cr' },
  { name: 'State Bank of India', logo: '🏛️', rate: 8.35, processing: '₹2,000+', maxTenure: 30, maxLoan: '₹15 Cr' },
  { name: 'ICICI Bank', logo: '💳', rate: 8.55, processing: '0.50%', maxTenure: 30, maxLoan: '₹10 Cr' },
  { name: 'Axis Bank', logo: '🔷', rate: 8.60, processing: '1.00%', maxTenure: 30, maxLoan: '₹5 Cr' },
  { name: 'Kotak Mahindra', logo: '🔴', rate: 8.70, processing: '0.50%', maxTenure: 25, maxLoan: '₹5 Cr' },
  { name: 'LIC Housing Finance', logo: '📋', rate: 8.30, processing: '₹3,000+', maxTenure: 30, maxLoan: '₹3 Cr' },
];

const EMPLOYMENT = ['Salaried', 'Self-Employed', 'Business Owner'];

// EMI for a reducing-balance loan
function calcEMI(principal, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}
// Back-calculate the principal a given EMI can service
function principalFromEMI(emi, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(emi * n);
  return Math.round((emi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n)));
}
// ₹ in Lakh / Crore for big amounts
function inrShort(n) {
  n = Math.round(n);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
const inrFull = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function HomeLoans() {
  // EMI calculator (single source of truth for rate & tenure)
  const [loanAmount, setLoanAmount] = useState(5000000); // ₹50 L
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  // Eligibility
  const [income, setIncome] = useState(150000);
  const [existingEmi, setExistingEmi] = useState(0);
  // Pre-approval lead form
  const [form, setForm] = useState({ name: '', phone: '', email: '', employment: 'Salaried', bank: '' });
  const [result, setResult] = useState(null); // { ref }
  const [error, setError] = useState('');
  const formRef = useRef(null);

  useEffect(() => {
    setSeo({
      title: 'Home Loans — EMI Calculator & Eligibility',
      description: 'Calculate your home-loan EMI, check eligibility and compare interest rates from HDFC, SBI, ICICI, Axis & more. Get pre-approved with PropertyInsta.',
      canonical: origin() + '/home-loans',
      keywords: 'home loan, EMI calculator, loan eligibility, interest rates, pre-approval, Gurgaon',
    });
    setJsonLd('ld-loans', {
      '@context': 'https://schema.org', '@type': 'FinancialProduct',
      name: 'PropertyInsta Home Loans', url: origin() + '/home-loans',
    });
  }, []);

  // EMI results
  const emi = useMemo(() => calcEMI(loanAmount, rate, tenure), [loanAmount, rate, tenure]);
  const totalPayable = emi * tenure * 12;
  const totalInterest = totalPayable - loanAmount;
  const principalPct = Math.round((loanAmount / totalPayable) * 100);

  // Eligibility (FOIR 50% — half of net income can service EMIs)
  const maxEmi = Math.max(0, income * 0.5 - existingEmi);
  const eligibleLoan = principalFromEMI(maxEmi, rate, tenure);
  const maxHomePrice = Math.round(eligibleLoan / 0.8); // assume 80% LTV / 20% down

  const enquire = (lender) => {
    setForm(f => ({ ...f, bank: lender.name }));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submit = (e) => {
    e.preventDefault();
    const digits = form.phone.replace(/\D/g, '');
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (digits.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    setError('');
    const message = `Home loan enquiry — ${inrShort(loanAmount)} over ${tenure} yrs (EMI ~${inrFull(emi)}/mo)${form.bank ? ` · preferred: ${form.bank}` : ''} · ${form.employment} · income ${inrShort(income)}/mo.`;
    const { ref } = saveLead({
      intent: 'callback',
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      propertyTitle: 'Home Loan — Pre-Approval',
      message,
    });
    setResult({ ref });
  };

  const waFollowUp = whatsappLink(
    DESK_PHONE,
    `Hi, I just requested home-loan pre-approval on PropertyInsta (${inrShort(loanAmount)} / ${tenure} yrs${form.bank ? `, ${form.bank}` : ''}). My ref is ${result?.ref || ''}.`,
  );

  return (
    <div className="ig-bwu ig-loan">
      {/* Hero */}
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🏦 Home Loans</span>
        <h1>Finance your dream home</h1>
        <p>Calculate your EMI, check eligibility and compare rates from India&apos;s top lenders — then get pre-approved in minutes.</p>
      </div>

      {/* Trust strip */}
      <div className="ig-bwu-benefits">
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">📉</span><div><strong>Rates from 8.30%</strong><span>Across leading partner banks.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">⚡</span><div><strong>Quick Pre-Approval</strong><span>In-principle sanction, fast.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🧮</span><div><strong>Up to 90% Funding</strong><span>Loan-to-value on eligibility.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🤝</span><div><strong>Zero Brokerage</strong><span>We don&apos;t charge you a fee.</span></div></div>
      </div>

      {/* EMI Calculator */}
      <section className="ig-bwu-section">
        <div className="ig-bwu-section-head"><h2>EMI Calculator</h2><span className="ig-bwu-section-count">indicative</span></div>
        <div className="ig-loan-calc">
          <div className="ig-loan-inputs">
            <div className="ig-loan-field">
              <div className="ig-loan-field-top"><label>Loan Amount</label><strong>{inrShort(loanAmount)}</strong></div>
              <input type="range" min={500000} max={50000000} step={100000} value={loanAmount} onChange={e => setLoanAmount(+e.target.value)} />
              <div className="ig-loan-scale"><span>₹5 L</span><span>₹5 Cr</span></div>
            </div>
            <div className="ig-loan-field">
              <div className="ig-loan-field-top"><label>Interest Rate (p.a.)</label><strong>{rate.toFixed(2)}%</strong></div>
              <input type="range" min={7} max={12} step={0.05} value={rate} onChange={e => setRate(+e.target.value)} />
              <div className="ig-loan-scale"><span>7%</span><span>12%</span></div>
            </div>
            <div className="ig-loan-field">
              <div className="ig-loan-field-top"><label>Tenure</label><strong>{tenure} yrs</strong></div>
              <input type="range" min={5} max={30} step={1} value={tenure} onChange={e => setTenure(+e.target.value)} />
              <div className="ig-loan-scale"><span>5 yrs</span><span>30 yrs</span></div>
            </div>
          </div>
          <div className="ig-loan-results">
            <div className="ig-loan-emi">
              <span>Monthly EMI</span>
              <h2>{inrFull(emi)}</h2>
            </div>
            <div className="ig-loan-split">
              <div className="ig-loan-split-bar">
                <span className="principal" style={{ width: `${principalPct}%` }} />
                <span className="interest" style={{ width: `${100 - principalPct}%` }} />
              </div>
              <div className="ig-loan-split-legend">
                <span><i className="dot principal" /> Principal {inrShort(loanAmount)}</span>
                <span><i className="dot interest" /> Interest {inrShort(totalInterest)}</span>
              </div>
            </div>
            <div className="ig-loan-stats">
              <div><span>Total Interest</span><strong>{inrShort(totalInterest)}</strong></div>
              <div><span>Total Payable</span><strong>{inrShort(totalPayable)}</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="ig-bwu-section">
        <div className="ig-bwu-section-head"><h2>How much can you borrow?</h2><span className="ig-bwu-section-count">FOIR estimate</span></div>
        <div className="ig-loan-calc">
          <div className="ig-loan-inputs">
            <div className="ig-loan-field">
              <div className="ig-loan-field-top"><label>Net Monthly Income</label><strong>{inrShort(income)}</strong></div>
              <input type="range" min={25000} max={1000000} step={5000} value={income} onChange={e => setIncome(+e.target.value)} />
              <div className="ig-loan-scale"><span>₹25 K</span><span>₹10 L</span></div>
            </div>
            <div className="ig-loan-field">
              <div className="ig-loan-field-top"><label>Existing EMIs</label><strong>{inrFull(existingEmi)}</strong></div>
              <input type="range" min={0} max={300000} step={1000} value={existingEmi} onChange={e => setExistingEmi(+e.target.value)} />
              <div className="ig-loan-scale"><span>₹0</span><span>₹3 L</span></div>
            </div>
            <p className="ig-loan-note">Based on a {rate.toFixed(2)}% rate over {tenure} years (adjust above). Assumes 50% FOIR &amp; 80% loan-to-value.</p>
          </div>
          <div className="ig-loan-results">
            <div className="ig-loan-emi green">
              <span>You&apos;re eligible for up to</span>
              <h2>{inrShort(eligibleLoan)}</h2>
            </div>
            <div className="ig-loan-stats">
              <div><span>Affordable Home Price</span><strong>{inrShort(maxHomePrice)}</strong></div>
              <div><span>Max EMI Capacity</span><strong>{inrFull(maxEmi)}/mo</strong></div>
            </div>
            <a className="ig-bwu-quote" href="#preapproval" onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}>Get Pre-Approved →</a>
          </div>
        </div>
      </section>

      {/* Lender comparison */}
      <section className="ig-bwu-section">
        <div className="ig-bwu-section-head"><h2>Compare Partner Banks</h2><span className="ig-bwu-section-count">EMI on {inrShort(loanAmount)} · {tenure} yrs</span></div>
        <div className="ig-loan-lenders">
          {[...LENDERS].sort((a, b) => a.rate - b.rate).map((l, i) => (
            <div key={l.name} className={`ig-loan-lender ${i === 0 ? 'best' : ''}`}>
              {i === 0 && <span className="ig-loan-best">Lowest Rate</span>}
              <div className="ig-loan-lender-head">
                <span className="ig-loan-logo">{l.logo}</span>
                <span className="ig-loan-lender-name">{l.name}</span>
              </div>
              <div className="ig-loan-rate">{l.rate.toFixed(2)}%<small> p.a.</small></div>
              <div className="ig-loan-emi-line">EMI <strong>{inrFull(calcEMI(loanAmount, l.rate, tenure))}</strong>/mo</div>
              <div className="ig-loan-lender-meta">
                <span>Processing {l.processing}</span>
                <span>Up to {l.maxTenure} yrs · {l.maxLoan}</span>
              </div>
              <button className="ig-loan-enquire" onClick={() => enquire(l)}>Enquire</button>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-approval lead form */}
      <section className="ig-bwu-section" id="preapproval" ref={formRef}>
        <div className="ig-bwu-section-head"><h2>Get Pre-Approved</h2><span className="ig-bwu-section-count">free · no obligation</span></div>
        {result ? (
          <div className="ig-loan-success">
            <span className="ig-loan-success-ico">✅</span>
            <h3>Request received!</h3>
            <p>Your reference is <strong>{result.ref}</strong>. Our loan desk will call you shortly with eligible offers.</p>
            <div className="ig-loan-success-actions">
              <a className="ig-bwu-quote" href={waFollowUp} target="_blank" rel="noopener noreferrer">Continue on WhatsApp</a>
              <button className="ig-loan-reset" onClick={() => { setResult(null); setForm({ name: '', phone: '', email: '', employment: 'Salaried', bank: '' }); }}>New request</button>
            </div>
          </div>
        ) : (
          <form className="ig-loan-form" onSubmit={submit}>
            <div className="ig-loan-form-grid">
              <div className="ig-loan-input">
                <label>Full Name *</label>
                <input type="text" placeholder="Arjun Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="ig-loan-input">
                <label>Phone *</label>
                <input type="tel" inputMode="numeric" placeholder="98xxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="ig-loan-input">
                <label>Email</label>
                <input type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="ig-loan-input">
                <label>Employment</label>
                <select value={form.employment} onChange={e => setForm(f => ({ ...f, employment: e.target.value }))}>
                  {EMPLOYMENT.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="ig-loan-input">
                <label>Preferred Bank</label>
                <select value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}>
                  <option value="">No preference</option>
                  {LENDERS.map(l => <option key={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div className="ig-loan-input">
                <label>Loan Required</label>
                <input type="text" readOnly value={`${inrShort(loanAmount)} · ${tenure} yrs`} />
              </div>
            </div>
            {error && <p className="ig-loan-error">{error}</p>}
            <div className="ig-loan-form-foot">
              <p className="ig-loan-disclaimer">Indicative figures only — not a loan offer. Submitting shares your details with our loan desk.</p>
              <button type="submit" className="ig-bwu-quote book">Request Pre-Approval</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
