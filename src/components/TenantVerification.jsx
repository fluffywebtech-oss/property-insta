import { useState, useEffect } from 'react';
import { setSeo, origin } from '../utils/seo';

// State-wise tenant police-verification routes. Portals move around, so every
// card also carries the "search <state> police tenant verification" fallback.
const STATES = [
  {
    id: 'dl', name: 'Delhi', cities: 'Delhi NCR',
    portal: 'Delhi Police — Citizen Services', url: 'https://delhipolice.gov.in',
    time: '7–14 days',
    steps: [
      'Get the Tenant Registration form from the Delhi Police citizen-services section (or print the form below).',
      'Attach the tenant\'s photo, government ID copy and permanent-address proof.',
      'Submit at the police station covering the rented property.',
      'Collect the stamped acknowledgment and staple it to the rent agreement.',
    ],
  },
  {
    id: 'hr', name: 'Haryana', cities: 'Gurgaon · Faridabad',
    portal: 'HarSamay — Haryana Police portal', url: 'https://haryanapoliceonline.gov.in',
    time: '7–15 days',
    steps: [
      'Register on the HarSamay citizen portal and open Citizen Services → Tenant Registration.',
      'Fill landlord + tenant details and upload the tenant\'s photo and ID.',
      'Submit online and note the application number.',
      'Track status on the portal and download the acknowledgment.',
    ],
  },
  {
    id: 'up', name: 'Uttar Pradesh', cities: 'Noida · Ghaziabad · Lucknow',
    portal: 'UP Police', url: 'https://uppolice.gov.in', app: 'UPCOP app (Android/iOS)',
    time: '5–10 days',
    steps: [
      'Install the UPCOP app and open Citizen Services → Tenant/PG Verification.',
      'Fill tenant + landlord details and upload ID proof and a photo.',
      'Submit — the request is routed to your local police station automatically.',
      'Save the digital acknowledgment from the app.',
    ],
  },
  {
    id: 'mh', name: 'Maharashtra', cities: 'Mumbai · Pune · Nagpur',
    portal: 'Maharashtra Police citizen portal', url: 'https://citizen.mahapolice.gov.in',
    time: '7–15 days',
    steps: [
      'Create an account on the citizen portal and choose "Tenant Information".',
      'Enter landlord, tenant and property details.',
      'Upload the tenant\'s photo and ID copy, then submit online.',
      'Keep the reference number — some stations may call to confirm.',
    ],
  },
  {
    id: 'ka', name: 'Karnataka', cities: 'Bengaluru · Mysuru',
    portal: 'Karnataka State Police', url: 'https://ksp.karnataka.gov.in',
    time: '7–15 days',
    steps: [
      'Print and fill the tenant information form below.',
      'Attach tenant ID, photo and the rent agreement copy.',
      'Submit at your jurisdictional police station (some accept email — call ahead).',
      'Collect the acknowledgment slip.',
    ],
  },
  {
    id: 'ts', name: 'Telangana', cities: 'Hyderabad',
    portal: 'TS Police citizen services', url: 'https://www.tspolice.gov.in',
    time: '7–14 days',
    steps: [
      'Open the TS Police citizen services section (or visit your local PS).',
      'Fill the tenant verification form with both parties\' details.',
      'Attach tenant photo + ID and submit.',
      'Keep the acknowledgment with your agreement.',
    ],
  },
  {
    id: 'pb', name: 'Punjab & Chandigarh', cities: 'Ludhiana · Chandigarh · Mohali',
    portal: 'SAANJH portal / Saanjh Kendra', url: 'https://saanjh.punjabpolice.gov.in',
    time: '7–15 days',
    steps: [
      'Visit the SAANJH portal or your nearest Saanjh Kendra counter.',
      'Submit the tenant verification request with the documents below.',
      'The area beat officer verifies the tenant\'s antecedents.',
      'Collect the verification report / acknowledgment.',
    ],
  },
  {
    id: 'rj', name: 'Rajasthan', cities: 'Jaipur · Jodhpur',
    portal: 'Rajasthan Police', url: 'https://police.rajasthan.gov.in', app: 'RajCop Citizen app',
    time: '7–15 days',
    steps: [
      'Use the RajCop Citizen app → Tenant Verification, or visit your local PS.',
      'Fill in tenant + landlord details and upload documents.',
      'Submit and note the request number.',
      'Download the acknowledgment once processed.',
    ],
  },
  {
    id: 'wb', name: 'West Bengal', cities: 'Kolkata',
    portal: 'Kolkata Police', url: 'https://kolkatapolice.gov.in',
    time: '10–15 days',
    steps: [
      'Print and fill the tenant information form below.',
      'Attach the tenant\'s photo, ID copy and previous-address proof.',
      'Submit at the police station of the area where the property is located.',
      'Collect the stamped receiving copy.',
    ],
  },
  {
    id: 'gj', name: 'Gujarat', cities: 'Ahmedabad · Surat',
    portal: 'Citizen First portal / app', url: 'https://gujhome.gujarat.gov.in',
    time: '7–14 days',
    steps: [
      'Open the Citizen First portal or app and choose Tenant Registration.',
      'Fill in the details of the landlord, tenant and property.',
      'Upload the documents and submit online.',
      'Save the acknowledgment PDF.',
    ],
  },
  {
    id: 'other', name: 'Other states', cities: 'Everywhere else',
    portal: 'Local police station', url: null,
    time: 'varies',
    steps: [
      'Print the tenant information form below and fill it in.',
      'Attach the tenant\'s photograph and government ID copy.',
      'Submit at the police station covering the rented property.',
      'Keep the stamped copy safely with the rent agreement.',
    ],
  },
];

const DOCS = [
  { id: 'photo', label: 'Tenant passport-size photographs (2)' },
  { id: 'id', label: 'Tenant government ID copy (Aadhaar / Passport / DL / Voter ID)' },
  { id: 'perm', label: 'Tenant permanent-address proof' },
  { id: 'work', label: 'Employer / college name and address' },
  { id: 'prev', label: 'Previous residential address' },
  { id: 'agreement', label: 'Rent agreement copy' },
  { id: 'llid', label: 'Landlord ID copy' },
  { id: 'form', label: 'Filled tenant information form (print below)' },
];

const ID_TYPES = ['Aadhaar', 'Passport', 'Driving Licence', 'Voter ID'];
const OCCUPATIONS = ['Salaried', 'Self-employed', 'Student', 'Other'];

const Blank = ({ v }) => v ? <strong>{v}</strong> : <strong className="ig-agr-blank" />;

function Row({ label, value }) {
  return (
    <div className="ig-pv-row">
      <span>{label}</span>
      <Blank v={value} />
    </div>
  );
}

export default function TenantVerification() {
  const [stateId, setStateId] = useState('hr');
  const [done, setDone] = useState({});
  const [f, setF] = useState({
    llName: '', llPhone: '', propAddr: '', startDate: '',
    tName: '', tPhone: '', idType: 'Aadhaar', idNum: '', permAddr: '',
    occupation: 'Salaried', orgName: '', famCount: '', prevAddr: '',
    refName: '', refPhone: '',
  });

  useEffect(() => {
    setSeo({
      title: 'Tenant Police Verification Guide & Form | PropertyInsta',
      description: 'State-wise tenant police verification process for landlords — portals, apps, documents, and a printable tenant information form. Stay on the right side of the law.',
      canonical: origin() + '/tenant-verification',
    });
  }, []);

  const st = STATES.find(s => s.id === stateId);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const toggleDoc = (id) => setDone(prev => ({ ...prev, [id]: !prev[id] }));
  const doneCount = DOCS.filter(d => done[d.id]).length;

  return (
    <div className="ig-bwu ig-agr ig-pv">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🛡️ Tenant Verification</span>
        <h1>Police verification, minus the confusion.</h1>
        <p>Renting out your place? Tenant police verification is a legal must in most states — here's your state's exact process, the documents needed, and a ready-to-print form.</p>
      </div>

      <div className="ig-pv-law">
        ⚖️ Skipping tenant verification can attract penalties under <strong>Section 188 IPC (now S.223, BNS 2023)</strong> — and it's your single best protection against renting to someone with a criminal history.
      </div>

      <div className="ig-agr-form ig-pv-states">
        <h3>1 · How it works in your state</h3>
        <div className="ig-pv-chipgrid">
          {STATES.map(s => (
            <button key={s.id} className={`ig-pv-chip ${stateId === s.id ? 'active' : ''}`} onClick={() => setStateId(s.id)}>
              <strong>{s.name}</strong><em>{s.cities}</em>
            </button>
          ))}
        </div>
        <div className="ig-pv-statecard">
          <div className="ig-pv-statehead">
            <div>
              <strong>{st.portal}</strong>
              {st.app && <span className="ig-pv-app">📱 {st.app}</span>}
            </div>
            <div className="ig-pv-statemeta">
              <span className="ig-pv-time">⏱ Typically {st.time}</span>
              {st.url && <a className="ig-pv-link" href={st.url} target="_blank" rel="noopener noreferrer">Open portal ↗</a>}
            </div>
          </div>
          <ol className="ig-pv-steps">
            {st.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <p className="ig-pv-linknote">Portals change from time to time — if the link doesn't work, search "<em>{st.name} police tenant verification</em>".</p>
        </div>
      </div>

      <div className="ig-agr-grid">
        <div className="ig-agr-form">
          <h3>2 · Documents to collect <span className="ig-pv-progress">{doneCount}/{DOCS.length} ready</span></h3>
          <div className="ig-pv-doclist">
            {DOCS.map(d => (
              <button key={d.id} className={`ig-pv-doc ${done[d.id] ? 'done' : ''}`} onClick={() => toggleDoc(d.id)}>
                <span className="ig-pv-box">{done[d.id] ? '✓' : ''}</span>
                <span className="ig-pv-doc-label">{d.label}</span>
              </button>
            ))}
          </div>

          <h3>3 · Fill the tenant form</h3>
          <div className="ig-agr-row2">
            <label className="ig-agr-field"><span>Landlord name</span><input value={f.llName} onChange={set('llName')} placeholder="e.g. Ramesh Kumar" /></label>
            <label className="ig-agr-field"><span>Landlord phone</span><input value={f.llPhone} onChange={set('llPhone')} placeholder="+91-…" /></label>
          </div>
          <label className="ig-agr-field"><span>Rented property address</span><input value={f.propAddr} onChange={set('propAddr')} placeholder="Flat no, building, locality, city, PIN" /></label>
          <div className="ig-agr-row2">
            <label className="ig-agr-field"><span>Tenancy start date</span><input type="date" value={f.startDate} onChange={set('startDate')} /></label>
            <label className="ig-agr-field"><span>Family members moving in</span><input type="number" min="0" max="20" value={f.famCount} onChange={set('famCount')} placeholder="e.g. 3" /></label>
          </div>
          <div className="ig-agr-row2">
            <label className="ig-agr-field"><span>Tenant name</span><input value={f.tName} onChange={set('tName')} placeholder="e.g. Priya Sharma" /></label>
            <label className="ig-agr-field"><span>Tenant phone</span><input value={f.tPhone} onChange={set('tPhone')} placeholder="+91-…" /></label>
          </div>
          <div className="ig-agr-row2">
            <label className="ig-agr-field"><span>ID type</span>
              <select value={f.idType} onChange={set('idType')}>{ID_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            </label>
            <label className="ig-agr-field"><span>ID number</span><input value={f.idNum} onChange={set('idNum')} placeholder="XXXX-XXXX-XXXX" /></label>
          </div>
          <label className="ig-agr-field"><span>Tenant permanent address</span><input value={f.permAddr} onChange={set('permAddr')} placeholder="House no, street, city, state, PIN" /></label>
          <label className="ig-agr-field"><span>Previous residential address</span><input value={f.prevAddr} onChange={set('prevAddr')} placeholder="Where the tenant lived before" /></label>
          <div className="ig-agr-row2">
            <label className="ig-agr-field"><span>Occupation</span>
              <select value={f.occupation} onChange={set('occupation')}>{OCCUPATIONS.map(o => <option key={o}>{o}</option>)}</select>
            </label>
            <label className="ig-agr-field"><span>Employer / college & address</span><input value={f.orgName} onChange={set('orgName')} placeholder="Company or institute, city" /></label>
          </div>
          <div className="ig-agr-row2">
            <label className="ig-agr-field"><span>Reference name (optional)</span><input value={f.refName} onChange={set('refName')} placeholder="Known person of the tenant" /></label>
            <label className="ig-agr-field"><span>Reference phone</span><input value={f.refPhone} onChange={set('refPhone')} placeholder="+91-…" /></label>
          </div>
        </div>

        <div className="ig-agr-side">
          <button className="ig-agr-print" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
          <div className="ig-agr-paper ig-pv-paper">
            <div className="ig-pv-photo">Affix tenant photograph</div>
            <h2>TENANT INFORMATION FORM</h2>
            <p className="ig-pv-sub">(For submission to the police station along with the tenant verification application)</p>
            <p>To,<br />The Station House Officer,<br />Police Station: <Blank v="" /></p>

            <h4>Landlord / Owner</h4>
            <Row label="Full name" value={f.llName} />
            <Row label="Phone" value={f.llPhone} />
            <Row label="Rented property address" value={f.propAddr} />
            <Row label="Tenancy start date" value={f.startDate ? new Date(f.startDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} />

            <h4>Tenant</h4>
            <Row label="Full name" value={f.tName} />
            <Row label="Phone" value={f.tPhone} />
            <Row label={`ID (${f.idType})`} value={f.idNum} />
            <Row label="Permanent address" value={f.permAddr} />
            <Row label="Previous address" value={f.prevAddr} />
            <Row label="Occupation" value={f.occupation} />
            <Row label="Employer / college" value={f.orgName} />
            <Row label="Family members moving in" value={f.famCount} />
            <Row label="Reference" value={[f.refName, f.refPhone].filter(Boolean).join(' · ')} />

            <p className="ig-pv-decl">We declare that the particulars furnished above are true to the best of our knowledge. The tenant's ID proof and photograph are enclosed. We request the concerned police station to kindly conduct the tenant's antecedent verification.</p>

            <div className="ig-agr-signs">
              <div><span className="ig-agr-sigline" /><strong>LANDLORD</strong><em>{f.llName || ' '}</em></div>
              <div><span className="ig-agr-sigline" /><strong>TENANT</strong><em>{f.tName || ' '}</em></div>
            </div>
            <div className="ig-pv-dateplace">
              <span>Date: ____________</span>
              <span>Place: ____________</span>
            </div>
          </div>
          <p className="ig-loan-disclaimer">General guidance and a convenience form — formats and rules vary by state and station; your local police station's format prevails. Not legal advice.</p>
        </div>
      </div>
    </div>
  );
}
