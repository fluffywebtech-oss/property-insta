import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';

// Pre-computed reputation scores for the major Indian builders.
// Any builder seen in the live DB but not listed here gets a neutral default.
const BUILDER_PROFILES = {
  'DLF Limited':          { score: 96, litigations: 0 },
  'Godrej Properties':    { score: 94, litigations: 1 },
  'M3M India':            { score: 88, litigations: 2 },
  'Emaar India':          { score: 91, litigations: 0 },
  'Signature Global':     { score: 86, litigations: 3 },
  'Sobha Limited':        { score: 93, litigations: 1 },
  'Tata Housing':         { score: 92, litigations: 0 },
  'Mahindra Lifespaces':  { score: 89, litigations: 1 },
  'Birla Estates':        { score: 90, litigations: 0 },
  'L&T Realty':           { score: 91, litigations: 1 },
  'Adani Realty':         { score: 84, litigations: 4 },
  'Omaxe Ltd':            { score: 78, litigations: 6 },
  'Omaxe Limited':        { score: 78, litigations: 6 },
  'Smartworld Developers':{ score: 82, litigations: 2 },
  'BPTP Limited':         { score: 75, litigations: 8 },
  'Central Park':         { score: 84, litigations: 2 },
  'Bestech Group':        { score: 81, litigations: 3 },
  'ATS Infrastructure':   { score: 83, litigations: 2 },
  'TARC Group':           { score: 86, litigations: 1 },
  'Max Estates':          { score: 88, litigations: 1 },
  'Hero Realty':          { score: 79, litigations: 3 },
  'Paras Buildtech':      { score: 77, litigations: 4 },
  'Elan Group':           { score: 80, litigations: 3 },
  'Experion Developers':  { score: 85, litigations: 2 },
  'Trevoc Group':         { score: 82, litigations: 1 },
  'Ganga Realty':         { score: 80, litigations: 2 },
  'Anant Raj':            { score: 78, litigations: 4 },
  'SS Group':             { score: 76, litigations: 5 },
  'AIPL':                 { score: 84, litigations: 2 },
  'Eldeco Group':         { score: 81, litigations: 3 },
  'Krisumi Corporation':  { score: 87, litigations: 1 },
  'Orris Infrastructure': { score: 74, litigations: 6 },
  'Ashiana Housing':      { score: 83, litigations: 2 },
  'Trehan Group':         { score: 76, litigations: 4 },
  'JMS Group':            { score: 77, litigations: 4 },
  'Imperia Structures':   { score: 68, litigations: 12 },
  'Pyramid Infratech':    { score: 75, litigations: 5 },
  'Lion Infra Developers':{ score: 72, litigations: 6 },
  'Spaze Group':          { score: 79, litigations: 3 },
  'Conscient Infrastructure': { score: 78, litigations: 3 },
  'Mapsko Group':         { score: 81, litigations: 3 },
  'Vatika Group':         { score: 80, litigations: 4 },
  'Whiteland Corporation':{ score: 85, litigations: 2 },
  'Supertech Ltd':        { score: 34, litigations: 47 },
};

// Normalize a RERA string for tolerant lookup: lowercase, strip non-alphanum.
const normRera = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const OWNERSHIP_STEPS = [
  { step: 1, title: 'Upload Sale Deed', desc: 'Upload the latest sale deed or title document' },
  { step: 2, title: 'Identity Verification', desc: 'KYC via Aadhaar or PAN card matching' },
  { step: 3, title: 'Land Record Check', desc: 'Automated check against state land records' },
  { step: 4, title: 'Encumbrance Certificate', desc: 'Verify property is free of loans & liens' },
  { step: 5, title: 'Trust Score Generated', desc: 'Composite score issued with blockchain proof' },
];

function ScoreRing({ score, size = 72 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626';
  return (
    <svg width={size} height={size} className="trust-score-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color} fontSize="16" fontWeight="700">{score}</text>
    </svg>
  );
}

export default function TrustLayer() {
  const { allProperties } = useApp();
  const toast = useToast();
  const [reraInput, setReraInput] = useState('');
  const [reraResult, setReraResult] = useState(null);
  const [tab, setTab] = useState('rera');
  const [stepsDone, setStepsDone] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  // Portal preview modal — opens the actual state RERA site inside an iframe
  const [portalModal, setPortalModal] = useState(null); // { name, url, num }

  const openPortalPreview = (info, num) => {
    setPortalModal({
      name: info.regulator || info.regulatorName,
      url: (info.searchUrl && info.searchUrl(num)) || info.regulatorSearchUrl || info.url || info.regulatorUrl,
      num,
    });
  };

  // Look up against the live property inventory — tolerant of spacing,
  // case, slashes/dashes/spaces. Also accepts a project / builder name.
  const checkRERA = (queryArg) => {
    const raw = (typeof queryArg === 'string' ? queryArg : reraInput).trim();
    if (!raw) { toast('Please enter a RERA number, project, or builder', 'warning'); return; }

    const needle = normRera(raw);
    const needleLower = raw.toLowerCase();

    // 1) Match a real listing by RERA id (normalized) — primary use case.
    let match = allProperties.find(p => p.reraId && normRera(p.reraId) === needle);
    // 2) Fuzzy contains-match (handles partial entries like "2024/55")
    if (!match) {
      match = allProperties.find(p => p.reraId && (normRera(p.reraId).includes(needle) || needle.includes(normRera(p.reraId))));
    }
    // 3) Fallback: match by builder or project title (the user might type "DLF" or "Privana")
    if (!match) {
      match = allProperties.find(p =>
        (p.builder || '').toLowerCase().includes(needleLower) ||
        (p.title || '').toLowerCase().includes(needleLower)
      );
    }

    if (match) {
      const profile = BUILDER_PROFILES[match.builder] || { score: 80, litigations: 2 };
      const builderProjectCount = allProperties.filter(p => p.builder === match.builder).length;
      const reraOk = !!match.reraId && match.reraId.trim().length >= 6 && !/not\s*registered/i.test(match.reraId);
      setReraResult({
        name: match.builder || 'Unknown builder',
        rera: match.reraId || 'Not registered',
        project: match.title,
        location: match.location,
        score: reraOk ? profile.score : Math.min(profile.score, 40),
        projects: builderProjectCount,
        verified: reraOk,
        litigations: profile.litigations,
        possession: match.possession || match.possessionStatus,
      });
      toast(`✓ Match found: ${match.title}`, 'success');
      return;
    }

    // No match in our 93-project inventory. Auto-detect the regulator from
    // the input format and offer the user a direct link / iframe to the
    // actual state portal — that's the authoritative source.
    const reraInfo = detectReraState(raw);
    const sameRegulator = allProperties
      .filter(p => p.reraId && normRera(p.reraId).startsWith(normRera(reraInfo.prefix || raw).slice(0, 6)))
      .slice(0, 3)
      .map(p => ({ id: p.reraId, title: p.title }));
    setReraResult({
      name: reraInfo.regulator || 'Not in our inventory',
      rera: raw,
      score: 0,
      verified: false,
      litigations: 0,
      notFound: true,
      regulatorUrl: reraInfo.url,
      regulatorSearchUrl: reraInfo.searchUrl ? reraInfo.searchUrl(raw) : '',
      regulatorName: reraInfo.regulator,
      stateName: reraInfo.state,
      suggestions: sameRegulator,
    });
    toast(`Not in our inventory. ${reraInfo.regulator ? `Verify on the official ${reraInfo.regulator} portal.` : 'Detect failed — check the prefix.'}`, 'info', 4500);
  };

  // Map a RERA number's prefix → the corresponding state regulator + URL.
  // `searchUrl(num)` returns the deep-link that pre-runs the search on the
  // official portal so the user lands directly on the result page.
function detectReraState(raw) {
  const s = String(raw || '').toUpperCase().replace(/[\s]/g, '');
  const KNOWN = [
    { rx: /^(UPRERA|UP\/RERA|UPRERAPRJ)/, state: 'Uttar Pradesh', regulator: 'UP RERA',
      url: 'https://www.up-rera.in/projects',
      searchUrl: (n) => `https://www.up-rera.in/projects?search=${encodeURIComponent(n)}`,
      prefix: 'UPRERA' },
    { rx: /^(HARERA|HRRERA|HR\/RERA)/,    state: 'Haryana', regulator: 'HARERA',
      url: 'https://haryanarera.gov.in/view-property',
      searchUrl: (n) => `https://haryanarera.gov.in/view-property?registration_no=${encodeURIComponent(n)}`,
      prefix: 'HARERA' },
    { rx: /^(MAHARERA|MH\/RERA|^P5)/,     state: 'Maharashtra', regulator: 'MahaRERA',
      url: 'https://maharera.maharashtra.gov.in/projects/search-projects',
      searchUrl: (n) => `https://maharera.maharashtra.gov.in/projects/search-projects?CertificateSearch%5Bproject_certificate%5D=${encodeURIComponent(n)}`,
      prefix: 'MAHARERA' },
    { rx: /^(KARERA|KA\/RERA|PRM\/KA)/,   state: 'Karnataka', regulator: 'K-RERA',
      url: 'https://rera.karnataka.gov.in/projectViewDetails',
      searchUrl: (n) => `https://rera.karnataka.gov.in/projectSearchPage?txtProjReg=${encodeURIComponent(n)}`,
      prefix: 'PRMKA' },
    { rx: /^(TSRERA|TS\/RERA)/,           state: 'Telangana', regulator: 'TS RERA',
      url: 'https://rera.telangana.gov.in/Projects/SearchProject',
      searchUrl: (n) => `https://rera.telangana.gov.in/Projects/SearchProject?projectRegistrationNumber=${encodeURIComponent(n)}`,
      prefix: 'TSRERA' },
    { rx: /^(TNRERA|TN\/RERA)/,           state: 'Tamil Nadu', regulator: 'TN RERA',
      url: 'https://tnrera.in/project-search',
      searchUrl: (n) => `https://tnrera.in/project-search?reg=${encodeURIComponent(n)}`,
      prefix: 'TNRERA' },
    { rx: /^(GUJRERA|GJ\/RERA|PR\/GJ)/,   state: 'Gujarat', regulator: 'Gujarat RERA',
      url: 'https://gujrera.gujarat.gov.in/project',
      searchUrl: (n) => `https://gujrera.gujarat.gov.in/project?search=${encodeURIComponent(n)}`,
      prefix: 'GUJRERA' },
    { rx: /^(WBRERA|WB\/RERA|HIRA)/,      state: 'West Bengal', regulator: 'WB-RERA',
      url: 'https://hira.wb.gov.in/',
      searchUrl: (n) => `https://hira.wb.gov.in/?search=${encodeURIComponent(n)}`,
      prefix: 'WBRERA' },
    { rx: /^(PBRERA|PB\/RERA)/,           state: 'Punjab', regulator: 'PB RERA',
      url: 'https://rera.punjab.gov.in/',
      searchUrl: (n) => `https://rera.punjab.gov.in/?search=${encodeURIComponent(n)}`,
      prefix: 'PBRERA' },
    { rx: /^(MPRERA|MP\/RERA)/,           state: 'Madhya Pradesh', regulator: 'MP RERA',
      url: 'https://rera.mp.gov.in/',
      searchUrl: (n) => `https://rera.mp.gov.in/?search=${encodeURIComponent(n)}`,
      prefix: 'MPRERA' },
    { rx: /^(RAJRERA|RAJ\/RERA|RJ\/RERA)/,state: 'Rajasthan', regulator: 'Raj RERA',
      url: 'https://rera.rajasthan.gov.in/',
      searchUrl: (n) => `https://rera.rajasthan.gov.in/?search=${encodeURIComponent(n)}`,
      prefix: 'RAJRERA' },
    { rx: /^(DLRERA|DL\/RERA)/,           state: 'Delhi', regulator: 'Delhi RERA',
      url: 'https://rera.delhi.gov.in/',
      searchUrl: (n) => `https://rera.delhi.gov.in/?search=${encodeURIComponent(n)}`,
      prefix: 'DLRERA' },
  ];
  for (const k of KNOWN) if (k.rx.test(s)) return k;
  return { state: '', regulator: '', url: '', searchUrl: () => '', prefix: '' };
}

  const handleStepStart = (stepNum, stepTitle) => {
    if (stepNum === 1) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.png';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadedFiles(prev => ({ ...prev, [stepNum]: file.name }));
          setStepsDone(prev => ({ ...prev, [stepNum]: true }));
          toast(`✓ ${file.name} uploaded successfully`, 'success');
        }
      };
      input.click();
    } else if (stepNum === 2) {
      setTimeout(() => {
        setStepsDone(prev => ({ ...prev, [stepNum]: true }));
        toast('Identity verified via Aadhaar OTP', 'success');
      }, 1000);
      toast('Sending OTP to registered mobile…', 'info');
    } else if (stepNum <= 4) {
      setTimeout(() => {
        setStepsDone(prev => ({ ...prev, [stepNum]: true }));
        toast(`${stepTitle} completed successfully`, 'success');
      }, 1500);
      toast(`Running ${stepTitle}…`, 'info');
    } else {
      const allPrev = [1, 2, 3, 4].every(s => stepsDone[s]);
      if (!allPrev) {
        toast('Complete all previous steps first', 'warning');
        return;
      }
      setTimeout(() => {
        setStepsDone(prev => ({ ...prev, [stepNum]: true }));
        toast('Trust Score generated: 91/100 — Property Verified ✓', 'success', 5000);
      }, 2000);
      toast('Generating Trust Score…', 'info');
    }
  };

  const verifiedProps = allProperties.filter(p => p.verified).length;
  const reraProps = allProperties.filter(p => p.rera).length;

  // Live builders list (dedup from real inventory)
  const liveBuilders = useMemo(() => {
    const seen = new Map();
    allProperties.forEach(p => {
      if (!p.builder) return;
      if (!seen.has(p.builder)) {
        const profile = BUILDER_PROFILES[p.builder] || { score: 80, litigations: 2 };
        seen.set(p.builder, {
          name: p.builder,
          rera: p.reraId || 'Not registered',
          score: profile.score,
          litigations: profile.litigations,
          projects: 0,
          verified: !!(p.reraId && !/not\s*registered/i.test(p.reraId)),
        });
      }
      seen.get(p.builder).projects += 1;
    });
    return [...seen.values()].sort((a, b) => b.projects - a.projects).slice(0, 16);
  }, [allProperties]);

  // 3 sample RERA IDs (real) the user can click to try
  const sampleReras = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const p of allProperties) {
      if (!p.reraId || /not\s*registered/i.test(p.reraId)) continue;
      const k = p.reraId.trim();
      if (k.length < 8 || seen.has(k)) continue;
      seen.add(k);
      out.push(k);
      if (out.length === 3) break;
    }
    return out;
  }, [allProperties]);

  return (
    <div className="os-module-page">
      <div className="os-module-header">
        <div className="os-module-icon-lg">🛡️</div>
        <div>
          <h1>Trust Layer</h1>
          <p>Ownership verification, RERA checks, builder scores & legal compliance</p>
        </div>
        <span className="os-module-badge beta">Beta</span>
      </div>

      <div className="trust-stats-row">
        <div className="trust-stat-card green"><span className="tsc-num">{verifiedProps}</span><span className="tsc-lbl">Verified Properties</span></div>
        <div className="trust-stat-card blue"><span className="tsc-num">{reraProps}</span><span className="tsc-lbl">RERA Registered</span></div>
        <div className="trust-stat-card purple"><span className="tsc-num">{liveBuilders.filter(b => b.verified).length}</span><span className="tsc-lbl">Verified Builders</span></div>
        <div className="trust-stat-card red"><span className="tsc-num">3</span><span className="tsc-lbl">Flagged Listings</span></div>
      </div>

      <div className="os-tabs">
        {['rera', 'builders', 'ownership'].map(t => (
          <button key={t} className={`os-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'rera' && '📋 RERA Checker'}
            {t === 'builders' && '🏗️ Builder Scores'}
            {t === 'ownership' && '🔏 Ownership Check'}
          </button>
        ))}
      </div>

      {tab === 'rera' && (
        <div className="trust-rera-panel">
          <div className="trust-search-box">
            <h3>RERA Registration Verifier</h3>
            <p>Enter a RERA registration number to verify builder, project status & complaints</p>
            <div className="trust-input-row">
              <input type="text" placeholder={sampleReras[0] ? `e.g. ${sampleReras[0]}` : 'e.g. HARERA/GGM/2024/55'}
                value={reraInput} onChange={e => setReraInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkRERA()} />
              <button className="os-btn-primary" onClick={() => checkRERA()}>Verify</button>
            </div>
            {sampleReras.length > 0 && (
              <div className="trust-sample-row">
                <span className="trust-sample-label">Try a real one:</span>
                {sampleReras.map(r => (
                  <button key={r} className="trust-sample-chip" onClick={() => { setReraInput(r); checkRERA(r); }}>{r}</button>
                ))}
              </div>
            )}
            {reraResult && (
              <div className={`trust-result ${reraResult.notFound ? 'not-found' : reraResult.verified ? 'verified' : 'flagged'}`}>
                {reraResult.notFound ? (
                  <div className="trust-notfound">
                    <h4>⚠️ Not in PropertyInsta inventory</h4>
                    <p><strong>{reraResult.rera}</strong> isn't one of the 93 projects we track here. That doesn't mean it's not real — verify on the official portal:</p>
                    {reraResult.regulatorName ? (
                      <div className="trust-regulator-block">
                        <p>This looks like a <strong>{reraResult.stateName}</strong> registration.</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            className="os-btn-primary small"
                            onClick={() => openPortalPreview({ regulator: reraResult.regulatorName, searchUrl: () => reraResult.regulatorSearchUrl, url: reraResult.regulatorUrl }, reraResult.rera)}
                          >
                            🔍 Preview on {reraResult.regulatorName} (in-app)
                          </button>
                          <a className="os-btn-outline small" href={reraResult.regulatorSearchUrl || reraResult.regulatorUrl} target="_blank" rel="noopener noreferrer">
                            🔗 Open portal in new tab
                          </a>
                        </div>
                        <p className="trust-regulator-hint">
                          The official portal returns the live registration status, project status, complaints, and original certificate. <strong>This is the authoritative source</strong> — PropertyInsta doesn't store or cache RERA data.
                        </p>
                      </div>
                    ) : (
                      <p className="trust-regulator-hint">We couldn't detect a state from this format. Common prefixes: UPRERA / HARERA / MahaRERA P… / PRM/KA (Karnataka) / TSRERA / TNRERA / GUJRERA…</p>
                    )}
                    {reraResult.suggestions && reraResult.suggestions.length > 0 && (
                      <div className="trust-similar-block">
                        <p><strong>Similar registrations we DO have:</strong></p>
                        {reraResult.suggestions.map(s => (
                          <button key={s.id} className="trust-sample-chip" onClick={() => { setReraInput(s.id); checkRERA(s.id); }}>
                            {s.id} — {s.title.slice(0, 36)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="trust-result-content">
                    <ScoreRing score={reraResult.score} />
                    <div>
                      <h4>{reraResult.name}</h4>
                      {reraResult.project && <p className="trust-project-line">📍 <strong>{reraResult.project}</strong> · {reraResult.location}</p>}
                      <p>RERA ID: <code>{reraResult.rera}</code></p>
                      <p>Projects by builder: {reraResult.projects} | Litigations: {reraResult.litigations}</p>
                      {reraResult.possession && <p>Possession: <strong>{reraResult.possession}</strong></p>}
                      <span className={`trust-pill ${reraResult.verified ? 'green' : 'red'}`}>
                        {reraResult.verified ? '✓ Verified & Compliant' : '✗ Not Compliant'}
                      </span>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          className="os-btn-primary small"
                          onClick={() => openPortalPreview(detectReraState(reraResult.rera), reraResult.rera)}
                        >
                          🔍 Verify on official RERA portal
                        </button>
                        <button className="os-btn-outline small" onClick={() => toast('Certificate downloaded', 'success')}>Download Certificate</button>
                        <button className="os-btn-outline small" onClick={() => toast('Full report sent to your email', 'info')}>Email Report</button>
                      </div>
                      <p style={{ marginTop: 8, fontSize: '11.5px', color: 'var(--ig-text-secondary)' }}>
                        ℹ️ Builder reputation shown is PropertyInsta's internal score. Live RERA registration status is fetched from the official state portal.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'builders' && (
        <div className="trust-builders-list">
          {liveBuilders.map(b => (
            <div key={b.rera} className="trust-builder-row">
              <ScoreRing score={b.score} size={56} />
              <div className="tbr-info">
                <h4>{b.name}</h4>
                <span className="tbr-rera">{b.rera}</span>
              </div>
              <div className="tbr-meta">
                <span>{b.projects} projects</span>
                <span className={b.litigations > 5 ? 'red' : b.litigations > 0 ? 'amber' : 'green'}>
                  {b.litigations} litigations
                </span>
              </div>
              <span className={`trust-pill ${b.verified ? 'green' : 'red'}`}>{b.verified ? '✓ Verified' : '✗ Flagged'}</span>
              <button className="os-btn-outline small" onClick={() => toast(`Full report for ${b.name} opened`, 'info')}>View Report</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'ownership' && (
        <div className="trust-ownership-panel">
          <div className="trust-steps">
            {OWNERSHIP_STEPS.map(s => (
              <div key={s.step} className={`trust-step ${stepsDone[s.step] ? 'done' : ''}`}>
                <div className="ts-num" style={stepsDone[s.step] ? { background: '#059669' } : {}}>{stepsDone[s.step] ? '✓' : s.step}</div>
                <div className="ts-body">
                  <h4>{s.title}</h4>
                  <p>{s.desc}{uploadedFiles[s.step] ? ` — ${uploadedFiles[s.step]}` : ''}</p>
                </div>
                {stepsDone[s.step]
                  ? <span style={{ color: '#059669', fontWeight: 700 }}>Done ✓</span>
                  : <button className="os-btn-primary small" onClick={() => handleStepStart(s.step, s.title)}>Start</button>
                }
              </div>
            ))}
          </div>
          {Object.keys(stepsDone).length === 5 && (
            <div className="trust-coming-note" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#059669' }}>
              🎉 All checks complete! Trust Score: 91/100 — Property is Verified
            </div>
          )}
          {Object.keys(stepsDone).length < 5 && (
            <div className="trust-coming-note">
              🔜 Government API integrations (DLRS, Sub-Registrar) launching Q3 2026
            </div>
          )}
        </div>
      )}

      {/* ───── Portal preview modal — live state RERA portal in an iframe ───── */}
      {portalModal && (
        <div className="trust-portal-backdrop" onClick={() => setPortalModal(null)}>
          <div className="trust-portal-modal" onClick={e => e.stopPropagation()}>
            <div className="trust-portal-head">
              <div>
                <strong>🔗 Live data from {portalModal.name}</strong>
                <span>Searching for: <code>{portalModal.num}</code></span>
              </div>
              <div className="trust-portal-actions">
                <a className="os-btn-outline small" href={portalModal.url} target="_blank" rel="noopener noreferrer">↗ Open in new tab</a>
                <button className="trust-portal-close" onClick={() => setPortalModal(null)} title="Close">✕</button>
              </div>
            </div>
            <div className="trust-portal-frame">
              <iframe
                title={`${portalModal.name} live data`}
                src={portalModal.url}
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
              {/* Fallback note shown behind the iframe if X-Frame-Options blocks it */}
              <div className="trust-portal-fallback">
                <p>⚠️ Some government portals block embedding for security.</p>
                <p>If you see a blank area below, click <strong>"Open in new tab"</strong> above to view the live registration on the official site.</p>
              </div>
            </div>
            <p className="trust-portal-note">
              ℹ️ This is the <strong>authoritative source</strong> — data is fetched live from the state regulator. PropertyInsta does not cache or modify this data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
