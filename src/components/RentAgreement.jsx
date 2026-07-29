import { useState, useEffect, useMemo } from 'react';
import { setSeo, origin } from '../utils/seo';

const inr = (n) => `₹${Math.round(Math.abs(n || 0)).toLocaleString('en-IN')}`;

// Amount in words, Indian grouping (crore / lakh / thousand).
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`);
const three = (n) => `${n >= 100 ? ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : ''}${n % 100 ? two(n % 100) : ''}`;
const inrWords = (num) => {
  let n = Math.round(Math.abs(num || 0));
  if (!n) return 'Zero';
  const parts = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thou = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(three(crore) + ' Crore');
  if (lakh) parts.push(two(lakh) + ' Lakh');
  if (thou) parts.push(two(thou) + ' Thousand');
  if (n) parts.push(three(n));
  return parts.join(' ');
};

// Parse 'YYYY-MM' / 'YYYY-MM-DD' as local time — new Date(string) treats them
// as UTC, which shifts the date back a day in negative-offset timezones.
const parseYMD = (s) => { const [y, m, d = 1] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDate = (d) => d ? (d instanceof Date ? d : parseYMD(d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '____________';
const addMonths = (dateStr, months) => {
  const d = parseYMD(dateStr);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return d;
};
const monthLabel = (ym) => parseYMD(ym).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const monthsBetween = (from, to) => {
  if (!from || !to) return [];
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out = [];
  for (let i = fy * 12 + fm; i <= ty * 12 + tm && out.length < 24; i++) {
    const y = Math.floor((i - 1) / 12), m = ((i - 1) % 12) + 1;
    out.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  return out;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

function Field({ label, children }) {
  return (
    <label className="ig-agr-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

const Blank = ({ v, w }) => v ? <strong>{v}</strong> : <strong className="ig-agr-blank" style={w ? { minWidth: w } : undefined} />;

export default function RentAgreement() {
  const [tab, setTab] = useState('agreement');

  // Agreement form
  const [a, setA] = useState({
    landlord: '', landlordAddr: '', tenant: '', tenantAddr: '', propertyAddr: '',
    rent: 25000, deposit: 100000, start: todayISO(), term: 11, lockin: 3, notice: 1,
    dueDay: 5, escalation: 5, maintenance: 'excluded', city: '',
  });
  // Receipts form
  const [r, setR] = useState({
    tenant: '', landlord: '', pan: '', propertyAddr: '', rent: 25000,
    from: thisMonth(), to: thisMonth(), mode: 'Bank transfer / UPI',
  });

  useEffect(() => {
    setSeo({
      title: 'Free Rental Agreement & Rent Receipt Generator | PropertyInsta',
      description: 'Generate a print-ready 11-month rental agreement and monthly rent receipts for HRA claims in minutes — free, no sign-up.',
      canonical: origin() + '/rent-agreement',
    });
  }, []);

  const setAg = (k) => (e) => setA(prev => ({ ...prev, [k]: e.target ? e.target.value : e }));
  const setRc = (k) => (e) => setR(prev => ({ ...prev, [k]: e.target ? e.target.value : e }));

  const endDate = useMemo(() => a.start ? addMonths(a.start, +a.term || 11) : null, [a.start, a.term]);
  const receiptMonths = useMemo(() => monthsBetween(r.from, r.to), [r.from, r.to]);
  const annualRent = (+r.rent || 0) * 12;

  return (
    <div className="ig-bwu ig-agr">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">📝 Rent Paperwork</span>
        <h1>Rental agreement &amp; rent receipts, done in minutes.</h1>
        <p>Fill in the details, preview a properly-drafted 11-month agreement or HRA-ready monthly receipts, then print or save as PDF. Free, no sign-up.</p>
      </div>

      <div className="ig-bwu-modes ig-agr-tabs">
        <button className={`ig-bwu-mode ${tab === 'agreement' ? 'active' : ''}`} onClick={() => setTab('agreement')}>📄 Rental Agreement</button>
        <button className={`ig-bwu-mode ${tab === 'receipts' ? 'active' : ''}`} onClick={() => setTab('receipts')}>🧾 Rent Receipts (HRA)</button>
      </div>

      {tab === 'agreement' ? (
        <div className="ig-agr-grid">
          <div className="ig-agr-form">
            <h3>Parties</h3>
            <Field label="Landlord (Lessor) full name"><input value={a.landlord} onChange={setAg('landlord')} placeholder="e.g. Ramesh Kumar" /></Field>
            <Field label="Landlord address"><input value={a.landlordAddr} onChange={setAg('landlordAddr')} placeholder="House no, street, city, state, PIN" /></Field>
            <Field label="Tenant (Lessee) full name"><input value={a.tenant} onChange={setAg('tenant')} placeholder="e.g. Priya Sharma" /></Field>
            <Field label="Tenant permanent address"><input value={a.tenantAddr} onChange={setAg('tenantAddr')} placeholder="House no, street, city, state, PIN" /></Field>

            <h3>Premises &amp; money</h3>
            <Field label="Rented property address"><input value={a.propertyAddr} onChange={setAg('propertyAddr')} placeholder="Flat no, building, locality, city, PIN" /></Field>
            <div className="ig-agr-row2">
              <Field label="Monthly rent (₹)"><input type="number" min="0" value={a.rent} onChange={setAg('rent')} /></Field>
              <Field label="Security deposit (₹)"><input type="number" min="0" value={a.deposit} onChange={setAg('deposit')} /></Field>
            </div>
            <div className="ig-agr-row2">
              <Field label="Rent due by day of month"><input type="number" min="1" max="28" value={a.dueDay} onChange={setAg('dueDay')} /></Field>
              <Field label="Maintenance charges">
                <select value={a.maintenance} onChange={setAg('maintenance')}>
                  <option value="excluded">Paid separately by tenant</option>
                  <option value="included">Included in rent</option>
                </select>
              </Field>
            </div>

            <h3>Term</h3>
            <div className="ig-agr-row2">
              <Field label="Start date"><input type="date" value={a.start} onChange={setAg('start')} /></Field>
              <Field label="Term (months)"><input type="number" min="1" max="60" value={a.term} onChange={setAg('term')} /></Field>
            </div>
            <div className="ig-agr-row2">
              <Field label="Lock-in period (months)"><input type="number" min="0" max="12" value={a.lockin} onChange={setAg('lockin')} /></Field>
              <Field label="Notice period (months)"><input type="number" min="0" max="6" value={a.notice} onChange={setAg('notice')} /></Field>
            </div>
            <div className="ig-agr-row2">
              <Field label="Rent escalation on renewal (%)"><input type="number" min="0" max="25" value={a.escalation} onChange={setAg('escalation')} /></Field>
              <Field label="City of execution"><input value={a.city} onChange={setAg('city')} placeholder="e.g. Gurgaon" /></Field>
            </div>
            {+a.term > 11 && (
              <p className="ig-agr-hint">⚠️ Agreements longer than 11 months must be registered and attract stamp duty as per your state — most Indian rentals use an 11-month term for this reason.</p>
            )}
          </div>

          <div className="ig-agr-side">
            <button className="ig-agr-print" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
            <div className="ig-agr-paper">
              <h2>RENTAL AGREEMENT</h2>
              <p>This Rental Agreement is made at <Blank v={a.city} w="90px" /> on <strong>{fmtDate(a.start)}</strong>,</p>
              <p><em>BETWEEN</em> <Blank v={a.landlord} w="160px" />, residing at <Blank v={a.landlordAddr} w="220px" />, hereinafter referred to as the <strong>“LESSOR”</strong> (which expression shall include their heirs, successors and assigns) of the ONE PART;</p>
              <p><em>AND</em> <Blank v={a.tenant} w="160px" />, residing at <Blank v={a.tenantAddr} w="220px" />, hereinafter referred to as the <strong>“LESSEE”</strong> of the OTHER PART.</p>
              <p>WHEREAS the Lessor is the lawful owner of the premises situated at <Blank v={a.propertyAddr} w="240px" /> (hereinafter “the Premises”) and has agreed to let out the Premises to the Lessee on the following terms and conditions:</p>
              <ol>
                <li><strong>Term.</strong> The tenancy shall be for a period of <strong>{a.term || '11'} months</strong>, commencing on <strong>{fmtDate(a.start)}</strong> and ending on <strong>{endDate ? fmtDate(endDate) : '____________'}</strong>, renewable thereafter by mutual written consent.</li>
                <li><strong>Rent.</strong> The Lessee shall pay a monthly rent of <strong>{inr(a.rent)}</strong> (Rupees {inrWords(a.rent)} only), payable in advance on or before the <strong>{a.dueDay || 5}th</strong> day of each English calendar month.</li>
                <li><strong>Security deposit.</strong> The Lessee has paid an interest-free, refundable security deposit of <strong>{inr(a.deposit)}</strong> (Rupees {inrWords(a.deposit)} only), to be refunded on peaceful vacation of the Premises, subject to deductions for unpaid dues or damage beyond normal wear and tear.</li>
                <li><strong>Escalation.</strong> On renewal, the monthly rent shall stand enhanced by <strong>{a.escalation || 0}%</strong>.</li>
                <li><strong>Maintenance.</strong> Society/maintenance charges shall be {a.maintenance === 'included' ? <strong>included in the rent and borne by the Lessor</strong> : <strong>paid separately by the Lessee</strong>}.</li>
                <li><strong>Utilities.</strong> Electricity, water, gas, internet and similar consumables shall be paid by the Lessee as per actual bills/meter readings.</li>
                <li><strong>Lock-in.</strong> Neither party shall terminate this agreement during the initial lock-in period of <strong>{a.lockin || 0} month{+a.lockin === 1 ? '' : 's'}</strong>.</li>
                <li><strong>Notice.</strong> After the lock-in period, either party may terminate this agreement by giving <strong>{a.notice || 1} month{+a.notice === 1 ? '' : 's'}</strong> written notice.</li>
                <li><strong>Use.</strong> The Premises shall be used for residential purposes only. The Lessee shall not sublet, assign or part with possession without prior written consent of the Lessor, nor carry out any unlawful activity therein.</li>
                <li><strong>Repairs.</strong> Day-to-day minor repairs shall be borne by the Lessee; structural and major repairs shall be borne by the Lessor.</li>
                <li><strong>Inspection.</strong> The Lessor may inspect the Premises at reasonable hours with at least 24 hours' prior intimation.</li>
                <li><strong>Registration.</strong> If the term exceeds eleven months, this agreement shall be registered and stamp duty paid as per the law applicable in the state where the Premises is situated.</li>
              </ol>
              <p>IN WITNESS WHEREOF the parties have set their hands on the day, month and year first above written.</p>
              <div className="ig-agr-signs">
                <div><span className="ig-agr-sigline" /><strong>LESSOR</strong><em>{a.landlord || ' '}</em></div>
                <div><span className="ig-agr-sigline" /><strong>LESSEE</strong><em>{a.tenant || ' '}</em></div>
                <div><span className="ig-agr-sigline" /><strong>WITNESS 1</strong><em> </em></div>
                <div><span className="ig-agr-sigline" /><strong>WITNESS 2</strong><em> </em></div>
              </div>
            </div>
            <p className="ig-loan-disclaimer">Standard template for convenience — stamp duty, registration and clause requirements vary by state. Have a lawyer review before signing. Not legal advice.</p>
          </div>
        </div>
      ) : (
        <div className="ig-agr-grid">
          <div className="ig-agr-form">
            <h3>Receipt details</h3>
            <Field label="Tenant name"><input value={r.tenant} onChange={setRc('tenant')} placeholder="e.g. Priya Sharma" /></Field>
            <Field label="Landlord name"><input value={r.landlord} onChange={setRc('landlord')} placeholder="e.g. Ramesh Kumar" /></Field>
            <Field label="Landlord PAN (for HRA if annual rent > ₹1,00,000)"><input value={r.pan} onChange={setRc('pan')} placeholder="ABCDE1234F" maxLength={10} /></Field>
            <Field label="Rented property address"><input value={r.propertyAddr} onChange={setRc('propertyAddr')} placeholder="Flat no, building, locality, city, PIN" /></Field>
            <div className="ig-agr-row2">
              <Field label="Monthly rent (₹)"><input type="number" min="0" value={r.rent} onChange={setRc('rent')} /></Field>
              <Field label="Payment mode">
                <select value={r.mode} onChange={setRc('mode')}>
                  <option>Bank transfer / UPI</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                </select>
              </Field>
            </div>
            <div className="ig-agr-row2">
              <Field label="From month"><input type="month" value={r.from} onChange={setRc('from')} /></Field>
              <Field label="To month"><input type="month" value={r.to} onChange={setRc('to')} /></Field>
            </div>
            {annualRent > 100000 && !r.pan && (
              <p className="ig-agr-hint">💡 Annual rent is {inr(annualRent)} — your employer will need the landlord's PAN to allow the HRA exemption.</p>
            )}
            {r.mode === 'Cash' && +r.rent > 5000 && (
              <p className="ig-agr-hint">💡 Cash receipts above ₹5,000 should carry a ₹1 revenue stamp across which the landlord signs.</p>
            )}
          </div>

          <div className="ig-agr-side">
            <button className="ig-agr-print" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
            <div className="ig-agr-paper ig-agr-receipts">
              {receiptMonths.length === 0 ? (
                <p className="ig-agr-noreceipts">Pick a valid month range to generate receipts.</p>
              ) : receiptMonths.map((m, i) => (
                <div key={m} className="ig-agr-receipt">
                  <div className="ig-agr-receipt-head">
                    <strong>RENT RECEIPT</strong>
                    <span>No. {String(i + 1).padStart(3, '0')} · {monthLabel(m)}</span>
                  </div>
                  <p>
                    Received with thanks from <Blank v={r.tenant} w="140px" /> the sum of <strong>{inr(r.rent)}</strong> (Rupees {inrWords(r.rent)} only)
                    by {r.mode.toLowerCase()} toward rent for the month of <strong>{monthLabel(m)}</strong> for the premises at <Blank v={r.propertyAddr} w="200px" />.
                  </p>
                  <div className="ig-agr-receipt-foot">
                    <span>Landlord: <Blank v={r.landlord} w="120px" />{r.pan ? <> · PAN: <strong>{r.pan.toUpperCase()}</strong></> : null}</span>
                    <span className="ig-agr-receipt-sig">Signature{r.mode === 'Cash' && +r.rent > 5000 ? ' (over revenue stamp)' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="ig-loan-disclaimer">Receipts are generated for HRA/tax convenience; keep proof of actual payment (bank statement/UPI) alongside. Not tax advice.</p>
          </div>
        </div>
      )}
    </div>
  );
}
