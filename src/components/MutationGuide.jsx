import { useState, useMemo, useEffect } from 'react';
import { setSeo, origin } from '../utils/seo';

// State-wise property mutation / khata transfer. The local term varies a lot,
// so each card carries the regional name + the official land-records portal.
const STATES = [
  {
    id: 'ka', name: 'Karnataka', cities: 'Bengaluru · Mysuru', term: 'Khata Transfer (A / B Khata)',
    portal: 'BBMP e-Aasthi / Sakala', url: 'https://bbmp.gov.in', time: '30–45 days',
    steps: [
      'Apply for Khata transfer on BBMP e-Aasthi (or at the ward office) with the sale deed.',
      'Attach the latest tax-paid receipt, EC and the previous Khata certificate.',
      'Pay the Khata transfer fee (typically ~2% of stamp duty).',
      'Collect the new Khata Certificate & Khata Extract in your name.',
    ],
  },
  {
    id: 'mh', name: 'Maharashtra', cities: 'Mumbai · Pune', term: 'Namantaran (Ferfar / 7-12)',
    portal: 'Mahabhulekh e-Mutation', url: 'https://bhulekh.mahabhumi.gov.in', time: '30–45 days',
    steps: [
      'File the mutation (Ferfar) request via e-Mutation or the Talathi / society office.',
      'Submit the registered sale deed, index-II and society NOC (for flats).',
      'The change is notified; objections are invited for ~15 days.',
      'Get the updated 7/12 extract or Property Card in your name.',
    ],
  },
  {
    id: 'dl', name: 'Delhi', cities: 'Delhi NCR', term: 'Dakhil Kharij (Mutation)',
    portal: 'MCD Online', url: 'https://mcdonline.nic.in', time: '15–30 days',
    steps: [
      'Apply for mutation on the MCD portal (or DDA, for DDA properties).',
      'Upload the sale deed, latest house-tax receipt, and an indemnity bond/affidavit.',
      'Pay the nominal mutation fee.',
      'Download the mutation letter once approved.',
    ],
  },
  {
    id: 'hr', name: 'Haryana', cities: 'Gurgaon · Faridabad', term: 'Intkaal (Mutation)',
    portal: 'Jamabandi Haryana', url: 'https://jamabandi.nic.in', time: '15–30 days',
    steps: [
      'Mutation is auto-initiated after registry; track it on the Jamabandi portal.',
      'Visit the Patwari / Tehsil for verification if prompted.',
      'The Halqa Patwari updates the record; objections are heard.',
      'Collect the sanctioned mutation (Intkaal) and updated Jamabandi.',
    ],
  },
  {
    id: 'up', name: 'Uttar Pradesh', cities: 'Noida · Lucknow', term: 'Dakhil Kharij / Namantaran',
    portal: 'UP Bhulekh / IGRSUP', url: 'https://upbhulekh.gov.in', time: '30–45 days',
    steps: [
      'File the Dakhil Kharij application at the Tehsil (or online where enabled).',
      'Attach the registered sale deed, ID proof and latest tax receipt.',
      'The Lekhpal verifies and objections are invited.',
      'Get the updated Khatauni record in your name.',
    ],
  },
  {
    id: 'tn', name: 'Tamil Nadu', cities: 'Chennai · Coimbatore', term: 'Patta Transfer (Name Transfer)',
    portal: 'TN eServices — Patta Chitta', url: 'https://eservices.tn.gov.in', time: '30 days',
    steps: [
      'Apply for Patta name-transfer on the TN eServices portal.',
      'Upload the sale deed, EC and the existing Patta.',
      'The Tahsildar verifies and processes the transfer.',
      'Download the updated Patta in your name.',
    ],
  },
  {
    id: 'ts', name: 'Telangana', cities: 'Hyderabad', term: 'Mutation (auto)',
    portal: 'Dharani portal', url: 'https://dharani.telangana.gov.in', time: '~15 days',
    steps: [
      'For most properties mutation is auto-triggered on registration via Dharani.',
      'Verify the record and pay the mutation fee if prompted.',
      'For GHMC properties, apply separately on the GHMC portal.',
      'Download the updated record / passbook.',
    ],
  },
  {
    id: 'wb', name: 'West Bengal', cities: 'Kolkata', term: 'Mutation (Dakhil Kharij)',
    portal: 'Banglarbhumi', url: 'https://banglarbhumi.gov.in', time: '30–45 days',
    steps: [
      'Apply for mutation on the Banglarbhumi portal.',
      'Upload the deed, tax receipt and ID; pay the fee online.',
      'BLLRO verifies the application.',
      'Download the mutation certificate and updated record of rights.',
    ],
  },
  {
    id: 'gj', name: 'Gujarat', cities: 'Ahmedabad · Surat', term: 'Mutation (Hakk Patrak / e-Dhara)',
    portal: 'AnyROR Gujarat', url: 'https://anyror.gujarat.gov.in', time: '30 days',
    steps: [
      'Mutation is entered via the e-Dhara centre after registration.',
      'Submit the deed and required forms; a notice is issued.',
      'Objections are heard, then the entry is certified.',
      'Get the updated 7/12 or City Survey record on AnyROR.',
    ],
  },
  {
    id: 'rj', name: 'Rajasthan', cities: 'Jaipur · Jodhpur', term: 'Namantaran',
    portal: 'Apna Khata (e-Dharti)', url: 'https://apnakhata.rajasthan.gov.in', time: '30 days',
    steps: [
      'Request Namantaran at the Tehsil or via the e-Mitra / Apna Khata portal.',
      'Submit the sale deed and ID proof.',
      'The Patwari/Tehsildar verifies and updates the Jamabandi.',
      'Download the updated Jamabandi / Girdawari.',
    ],
  },
  {
    id: 'other', name: 'Other states', cities: 'Everywhere else', term: 'Mutation / Namantaran',
    portal: 'Local municipal / revenue office', url: null, time: 'varies',
    steps: [
      'Apply for mutation at your local municipal or revenue (Tehsil) office.',
      'Submit the registered sale deed, latest tax receipt and ID proof.',
      'The record is updated after verification and an objection window.',
      'Collect the mutation certificate / updated record of rights.',
    ],
  },
];

const TYPES = [
  { id: 'sale', label: '🤝 Purchase / Sale', extra: [] },
  { id: 'inherit', label: '🕯️ Inheritance', extra: ['Death certificate of the previous owner', 'Legal heir / succession certificate', 'Affidavit of all legal heirs (with NOC)'] },
  { id: 'gift', label: '🎁 Gift', extra: ['Registered gift deed'] },
  { id: 'will', label: '📜 Will', extra: ['Registered / probated Will', 'Death certificate of the testator'] },
];

const BASE_DOCS = [
  'Registered sale deed (copy)',
  'Chain of previous title deeds',
  'Latest property-tax receipt (fully paid)',
  'Encumbrance Certificate (EC)',
  'Mutation / Khata application form',
  'Aadhaar / ID proof of the new owner',
  'Society or builder NOC (for flats)',
  'Indemnity bond / affidavit (as required)',
];

export default function MutationGuide() {
  const [stateId, setStateId] = useState('ka');
  const [type, setType] = useState('sale');
  const [done, setDone] = useState({});

  useEffect(() => {
    setSeo({
      title: 'Khata / Mutation Transfer Guide — Property Name Change | PropertyInsta',
      description: 'Transfer a property into your name after buying — state-wise mutation / khata process, portals, documents and a checklist. Covers sale, inheritance, gift & will.',
      canonical: origin() + '/mutation',
    });
  }, []);

  const st = STATES.find(s => s.id === stateId) || STATES[0];
  const docs = useMemo(() => {
    const extra = TYPES.find(t => t.id === type)?.extra || [];
    return [...BASE_DOCS, ...extra];
  }, [type]);
  const doneCount = docs.filter((_, i) => done[i]).length;

  return (
    <div className="ig-bwu ig-agr ig-pv ig-mut">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">📋 Khata / Mutation</span>
        <h1>Get the property into your name.</h1>
        <p>Registration proves you bought it — but <strong>mutation</strong> (khata / namantaran) updates the government &amp; tax records to your name. Here’s your state’s exact process, documents and a checklist.</p>
      </div>

      <div className="ig-pv-law">
        ℹ️ Mutation isn’t the same as your sale deed — but skipping it means property-tax bills stay in the seller’s name, and it can block future resale, loans and utility transfers. Do it soon after registration.
      </div>

      <div className="ig-bwu-benefits ig-mut-benefits">
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🧾</span><div><strong>Tax in your name</strong><span>Property-tax liability updated.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">📜</span><div><strong>Ownership on record</strong><span>Recognised in govt records.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🔌</span><div><strong>Utility &amp; loan transfers</strong><span>Needed for connections/loans.</span></div></div>
        <div className="ig-bwu-benefit"><span className="ig-bwu-benefit-icon">🏷️</span><div><strong>Smooth resale</strong><span>Clean records = faster sale.</span></div></div>
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
              <span className="ig-pv-app">🗂️ {st.term}</span>
            </div>
            <div className="ig-pv-statemeta">
              <span className="ig-pv-time">⏱ Typically {st.time}</span>
              {st.url && <a className="ig-pv-link" href={st.url} target="_blank" rel="noopener noreferrer">Open portal ↗</a>}
            </div>
          </div>
          <ol className="ig-pv-steps">
            {st.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <p className="ig-pv-linknote">Portals &amp; local terms change — if the link doesn’t work, search “<em>{st.name} property mutation / {st.term.split(' ')[0]} online</em>”.</p>
        </div>
      </div>

      <div className="ig-agr-form">
        <h3>2 · What triggered the transfer?</h3>
        <div className="ig-bwu-filters ig-mut-types">
          {TYPES.map(t => (
            <button key={t.id} className={`ig-bwu-chip ${type === t.id ? 'active' : ''}`} onClick={() => setType(t.id)}>{t.label}</button>
          ))}
        </div>

        <h3>3 · Documents to collect <span className="ig-pv-progress">{doneCount}/{docs.length} ready</span></h3>
        <div className="ig-pv-doclist">
          {docs.map((d, i) => (
            <button key={d} className={`ig-pv-doc ${done[i] ? 'done' : ''}`} onClick={() => setDone(p => ({ ...p, [i]: !p[i] }))}>
              <span className="ig-pv-box">{done[i] ? '✓' : ''}</span>
              <span className="ig-pv-doc-label">{d}</span>
            </button>
          ))}
        </div>
        <p className="ig-loan-disclaimer">General guidance — the exact process, fees and forms vary by state, city and property type; your local municipal/revenue office prevails. Not legal advice.</p>
      </div>
    </div>
  );
}
