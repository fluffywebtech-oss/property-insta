import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getLeads } from '../utils/leads';
import { setSeo } from '../utils/seo';

const CHECKS_KEY = 'pi_journey';
const NOTES_KEY = 'pi_journey_notes';

const inrShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

// Phases & tasks. Items with `auto` are derived live from real activity (read-only);
// the rest are manual checkboxes the buyer ticks off (persisted to localStorage).
const PHASES = [
  {
    key: 'research', icon: '🔍', title: 'Research', items: [
      { id: 'budget', label: 'Set your budget & must-haves' },
      { id: 'shortlist', label: 'Shortlist 3+ homes you love', auto: (c) => c.saved >= 3, hint: 'Save properties from the feed' },
      { id: 'compare', label: 'Compare your shortlist side-by-side', auto: (c) => c.compared >= 2, hint: 'Add 2+ to Compare' },
      { id: 'locality', label: 'Research localities & connectivity' },
    ],
  },
  {
    key: 'finance', icon: '💰', title: 'Finance', items: [
      { id: 'emi', label: 'Calculate your monthly EMI' },
      { id: 'eligibility', label: 'Check your loan eligibility' },
      { id: 'preapproval', label: 'Get pre-approved for a loan', auto: (c) => c.loanLeads > 0, hint: 'Request pre-approval in Home Loans' },
      { id: 'downpayment', label: 'Arrange your down payment' },
    ],
  },
  {
    key: 'visit', icon: '🏠', title: 'Visit & Verify', items: [
      { id: 'enquire', label: 'Make your first enquiry', auto: (c) => c.leads > 0, hint: 'Enquire on any property' },
      { id: 'sitevisit', label: 'Book site visits' },
      { id: 'rera', label: 'Verify RERA ID & approvals' },
      { id: 'builder', label: "Check the builder's track record" },
    ],
  },
  {
    key: 'close', icon: '📝', title: 'Close the Deal', items: [
      { id: 'negotiate', label: 'Negotiate the final price' },
      { id: 'agreement', label: 'Review the sale agreement' },
      { id: 'registration', label: 'Complete registration' },
      { id: 'handover', label: 'Take possession 🎉' },
    ],
  },
];
const ALL_ITEMS = PHASES.flatMap(p => p.items);

export default function MyJourney() {
  const { savedIds, compareIds, recentlyViewed, allProperties, openProperty, setCurrentView, setActiveModal } = useApp();

  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHECKS_KEY) || '{}'); } catch { return {}; }
  });
  const [notes, setNotes] = useState(() => localStorage.getItem(NOTES_KEY) || '');

  useEffect(() => {
    setSeo({ title: 'My Journey — Your Home-Buying Workspace', description: 'Track your home-buying progress, manage your shortlist, enquiries and loan status, and tick off every step from research to possession.' });
  }, []);

  const leads = useMemo(() => { try { return getLeads(); } catch { return []; } }, []);
  const loanLeads = useMemo(() => leads.filter(l => /home loan|pre-approval/i.test(l.property_title || '')), [leads]);

  const ctx = {
    saved: savedIds?.length || 0,
    compared: compareIds?.length || 0,
    leads: leads.length,
    loanLeads: loanLeads.length,
  };

  const isDone = (item) => (item.auto ? item.auto(ctx) : !!checks[item.id]);
  const doneCount = ALL_ITEMS.filter(isDone).length;
  const overallPct = Math.round((doneCount / ALL_ITEMS.length) * 100);

  const toggle = (item) => {
    if (item.auto) return; // derived items aren't manually toggled
    setChecks(prev => {
      const next = { ...prev, [item.id]: !prev[item.id] };
      try { localStorage.setItem(CHECKS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const saveNotes = (val) => {
    setNotes(val);
    try { localStorage.setItem(NOTES_KEY, val); } catch { /* ignore */ }
  };

  const recentProps = useMemo(
    () => (recentlyViewed || []).map(id => allProperties.find(p => p.id === id)).filter(Boolean).slice(0, 4),
    [recentlyViewed, allProperties],
  );

  const STATS = [
    { icon: '🔖', label: 'Saved', value: ctx.saved, onClick: () => setCurrentView('saved') },
    { icon: '⚖️', label: 'In Compare', value: ctx.compared, onClick: () => setCurrentView('compare') },
    { icon: '📩', label: 'Enquiries', value: ctx.leads, onClick: null },
    { icon: '👀', label: 'Recently Viewed', value: (recentlyViewed || []).length, onClick: recentProps[0] ? () => openProperty(recentProps[0].id) : null },
  ];

  const TOOLS = [
    { icon: '🔍', label: 'Browse Homes', onClick: () => setCurrentView('feed') },
    { icon: '🧮', label: 'EMI Calculator', onClick: () => setCurrentView('home-loans') },
    { icon: '⚖️', label: 'Compare', onClick: () => setCurrentView('compare') },
    { icon: '🔖', label: 'Saved', onClick: () => setCurrentView('saved') },
    { icon: '🧱', label: 'Build With Us', onClick: () => setCurrentView('build-with-us') },
    { icon: '🗺️', label: 'Map View', onClick: () => setCurrentView('mapView') },
  ];

  const nextStep = ALL_ITEMS.find(i => !isDone(i));

  return (
    <div className="ig-bwu ig-journey">
      {/* Hero with overall progress */}
      <div className="ig-bwu-hero ig-journey-hero">
        <span className="ig-bwu-eyebrow">🎯 My Journey</span>
        <h1>Your home-buying workspace</h1>
        <p>Everything in one place — your shortlist, enquiries, loan progress and every step from first search to handing over the keys.</p>
        <div className="ig-journey-progress">
          <div className="ig-journey-progress-top">
            <span><strong>{overallPct}%</strong> complete · {doneCount}/{ALL_ITEMS.length} steps</span>
            {nextStep && <span className="ig-journey-next">Next: {nextStep.label}</span>}
          </div>
          <div className="ig-journey-bar"><span style={{ width: `${overallPct}%` }} /></div>
        </div>
      </div>

      {/* Snapshot stats */}
      <div className="ig-journey-stats">
        {STATS.map(s => (
          <button key={s.label} className={`ig-journey-stat ${s.onClick ? 'clickable' : ''}`} onClick={s.onClick || undefined} disabled={!s.onClick}>
            <span className="ig-journey-stat-ico">{s.icon}</span>
            <strong>{s.value}</strong>
            <span className="ig-journey-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Continue where you left off */}
      {recentProps.length > 0 && (
        <section className="ig-bwu-section">
          <div className="ig-bwu-section-head"><h2>Pick up where you left off</h2></div>
          <div className="ig-journey-recent">
            {recentProps.map(p => (
              <button key={p.id} className="ig-journey-recent-card" onClick={() => openProperty(p.id)}>
                <img src={(p.images && p.images[0]) || p.image} alt={p.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                <div className="ig-journey-recent-body">
                  <strong>{inrShort(p.price)}</strong>
                  <span className="ig-journey-recent-title">{p.title}</span>
                  <span className="ig-journey-recent-loc">📍 {p.location}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Checklist */}
      <section className="ig-bwu-section">
        <div className="ig-bwu-section-head"><h2>Your buying checklist</h2><span className="ig-bwu-section-count">{doneCount}/{ALL_ITEMS.length} done</span></div>
        <div className="ig-journey-phases">
          {PHASES.map(phase => {
            const pDone = phase.items.filter(isDone).length;
            return (
              <div key={phase.key} className="ig-journey-phase">
                <div className="ig-journey-phase-head">
                  <span className="ig-journey-phase-ico">{phase.icon}</span>
                  <h3>{phase.title}</h3>
                  <span className="ig-journey-phase-count">{pDone}/{phase.items.length}</span>
                </div>
                <ul className="ig-journey-tasks">
                  {phase.items.map(item => {
                    const done = isDone(item);
                    return (
                      <li key={item.id}>
                        <button
                          className={`ig-journey-task ${done ? 'done' : ''} ${item.auto ? 'auto' : ''}`}
                          onClick={() => toggle(item)}
                          title={item.auto ? 'Updates automatically from your activity' : 'Tap to mark done'}
                        >
                          <span className="ig-journey-check">{done ? '✓' : ''}</span>
                          <span className="ig-journey-task-label">{item.label}</span>
                          {item.auto && <span className="ig-journey-auto-pill">{done ? 'auto ✓' : 'auto'}</span>}
                        </button>
                        {item.auto && !done && item.hint && <span className="ig-journey-hint">{item.hint}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick tools */}
      <section className="ig-bwu-section">
        <div className="ig-bwu-section-head"><h2>Quick tools</h2></div>
        <div className="ig-journey-tools">
          {TOOLS.map(t => (
            <button key={t.label} className="ig-journey-tool" onClick={t.onClick}>
              <span className="ig-journey-tool-ico">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="ig-bwu-section">
        <div className="ig-bwu-section-head"><h2>My notes</h2><span className="ig-bwu-section-count">saved on this device</span></div>
        <textarea
          className="ig-journey-notes"
          placeholder="Jot down questions for the builder, must-have amenities, budget reminders…"
          value={notes}
          onChange={e => saveNotes(e.target.value)}
          rows={5}
        />
      </section>
    </div>
  );
}
