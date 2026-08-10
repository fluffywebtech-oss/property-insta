import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useRole } from '../../context/RoleContext';

const RECENTLY_USED_KEY = 'pi.os.recently_used';
function readRecentlyUsed() {
  try { return JSON.parse(localStorage.getItem(RECENTLY_USED_KEY) || '[]'); }
  catch { return []; }
}
function writeRecentlyUsed(id) {
  try {
    const arr = readRecentlyUsed().filter(x => x !== id);
    arr.unshift(id);
    localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(arr.slice(0, 6)));
  } catch {}
}

// =============================================================================
// Property Ally OS — flagship platform hub (Salesforce / AWS Console style)
// =============================================================================

const ALL_MODULES = [
  { id: 'feed', name: 'Property Discovery', desc: 'AI-powered search across Sale, Rent, PG, Commercial, Land & Warehouses', icon: '🔍', status: 'live', category: 'discovery', roles: ['buyer', 'broker'] },
  { id: 'reels', name: 'Property Reels', desc: 'Instagram-style video tours of top listings', icon: '🎬', status: 'live', category: 'discovery', roles: ['buyer', 'broker'] },
  { id: 'mapView', name: 'Map Explorer', desc: 'Geo-search properties with infrastructure overlay', icon: '🗺️', status: 'live', category: 'discovery', roles: ['buyer', 'broker'] },
  { id: 'trust', name: 'Trust Layer', desc: 'Ownership verification, RERA checks, builder scores & legal status', icon: '🛡️', status: 'beta', category: 'trust', roles: ['buyer', 'broker'] },
  { id: 'passport', name: 'Property Passport', desc: 'Digital twin with ownership history, valuation & registry documents', icon: '📋', status: 'beta', category: 'trust', roles: ['buyer', 'broker'] },
  { id: 'transaction', name: 'Transaction Layer', desc: 'Digital deal room, offers, negotiations & documentation', icon: '🤝', status: 'beta', category: 'transaction', roles: ['buyer', 'broker'] },
  { id: 'crm', name: 'Property CRM', desc: 'Website enquiries inbox, lead pipeline, call logs & WhatsApp follow-ups', icon: '📊', status: 'live', category: 'crm', roles: ['buyer', 'broker'] },
  { id: 'channelpartner', name: 'Channel Partner Network', desc: 'Inventory marketplace, lead sharing & commission tracking', icon: '🌐', status: 'beta', category: 'crm', roles: ['broker'] },
  { id: 'copilot', name: 'AI Copilot', desc: 'AI assistant for buyers, sellers, builders and investors', icon: '🤖', status: 'beta', category: 'ai', roles: ['buyer', 'broker'] },
  { id: 'aiexchange', name: 'AI Exchange', desc: 'AI-powered match-making between buyers and properties', icon: '✨', status: 'beta', category: 'ai', roles: ['buyer', 'broker'] },
  { id: 'financing', name: 'Financing & Mortgage', desc: 'Home loans, EMI calculator, instant pre-approval', icon: '🏦', status: 'beta', category: 'finance', roles: ['buyer', 'broker'] },
  { id: 'investment', name: 'Investment Marketplace', desc: 'Fractional ownership, REITs & yield-focused investments', icon: '📈', status: 'beta', category: 'finance', roles: ['buyer', 'broker'] },
  { id: 'legal', name: 'Legal Concierge', desc: 'Document review, agreement drafting & legal advisory', icon: '⚖️', status: 'beta', category: 'trust', roles: ['buyer', 'broker'] },
  { id: 'rental', name: 'Rental Manager', desc: 'Tenant screening, rent collection & maintenance', icon: '🏘️', status: 'beta', category: 'manage', roles: ['buyer', 'broker'] },
  { id: 'commerce', name: 'Local Commerce', desc: 'Movers, interior designers, repairs & services marketplace', icon: '🛠️', status: 'beta', category: 'commerce', roles: ['buyer', 'broker'] },
  { id: 'social', name: 'Community & Forums', desc: 'Owner forums, neighborhood reviews & expert Q&A', icon: '💬', status: 'beta', category: 'community', roles: ['buyer', 'broker'] },
  { id: 'govint', name: 'Government Integration', desc: 'Stamp duty, registration, property tax & utility setup', icon: '🏛️', status: 'beta', category: 'trust', roles: ['buyer', 'broker'] },
  { id: 'datacloud', name: 'Data Cloud', desc: 'Market analytics, price trends, demand heatmaps', icon: '☁️', status: 'beta', category: 'data', roles: ['broker'] },
  { id: 'infra', name: 'Infrastructure Watch', desc: 'Track upcoming metro, highway, airport & SEZ projects', icon: '🛣️', status: 'beta', category: 'data', roles: ['buyer', 'broker'] },
  { id: 'blog', name: 'Blog & Insights', desc: 'Editorial coverage of markets, policies and projects', icon: '📰', status: 'live', category: 'community', roles: ['buyer', 'broker'] },
];

const CATEGORIES = {
  discovery:   { label: 'Discovery',           color: '#1F56C4', icon: '🔍' },
  trust:       { label: 'Trust & Legal',       color: '#059669', icon: '🛡️' },
  transaction: { label: 'Transaction',         color: '#D97706', icon: '🤝' },
  crm:         { label: 'CRM & Partners',      color: '#7C3AED', icon: '📊' },
  ai:          { label: 'AI Intelligence',     color: '#DC2626', icon: '🤖' },
  finance:     { label: 'Finance & Investment',color: '#0891B2', icon: '🏦' },
  manage:      { label: 'Property Management', color: '#65A30D', icon: '🏘️' },
  builder:     { label: 'Builder Tools',       color: '#EA580C', icon: '🏗️' },
  commerce:    { label: 'Local Commerce',      color: '#DB2777', icon: '🛠️' },
  data:        { label: 'Data & Analytics',    color: '#6366F1', icon: '☁️' },
  community:   { label: 'Community',           color: '#14B8A6', icon: '💬' },
};

const STATUS_BADGE = {
  live:   { label: 'Live', cls: 'live' },
  beta:   { label: 'Beta', cls: 'beta' },
  coming: { label: 'Soon', cls: 'coming' },
};

// Live ticker of recent platform activity (faked — would be from analytics)
const ACTIVITY_TICKER = [
  '🛡️ Trust Layer verified DLF Privana ownership',
  '📊 14 new CRM leads from Sector 65 today',
  '🤖 AI Copilot matched 8 buyers to penthouses this hour',
  '✨ New listings: 23 in Gurgaon, 11 in Bangalore',
  '🤝 ₹4.2 Cr transaction closed via Deal Room',
  '🏦 7 home loans pre-approved in the last 30 min',
];

export default function OSDashboard() {
  const { setCurrentView } = useApp();
  const { role } = useRole();
  const [filter, setFilter] = useState('all'); // all | live | beta
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [recentIds, setRecentIds] = useState(readRecentlyUsed());
  const searchRef = useRef(null);

  // Track module opens for "Recently used"
  const openModule = (id) => {
    writeRecentlyUsed(id);
    setRecentIds(readRecentlyUsed());
    setCurrentView(id);
  };

  // ⌘K / Ctrl-K focuses the search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setSearch('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleModules = useMemo(
    () => ALL_MODULES.filter(m => m.roles.includes(role)),
    [role]
  );

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = visibleModules;
    if (filter !== 'all') result = result.filter(m => m.status === filter);
    if (q) {
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [visibleModules, filter, search]);

  const recentModules = useMemo(
    () => recentIds.map(id => visibleModules.find(m => m.id === id)).filter(Boolean),
    [recentIds, visibleModules]
  );

  const stats = useMemo(() => ({
    total: visibleModules.length,
    live: visibleModules.filter(m => m.status === 'live').length,
    beta: visibleModules.filter(m => m.status === 'beta').length,
    categories: new Set(visibleModules.map(m => m.category)).size,
  }), [visibleModules]);

  const liveModules = visibleModules.filter(m => m.status === 'live');

  // Categories that actually have modules for this role
  const activeCats = useMemo(() => {
    const map = {};
    filteredModules.forEach(m => {
      if (!map[m.category]) map[m.category] = [];
      map[m.category].push(m);
    });
    return Object.entries(map);
  }, [filteredModules]);

  return (
    <div className="pi-os-page">
      {/* ─────────── Hero — flagship enterprise headline ─────────── */}
      <section className="pi-os-hero">
        <div className="pi-os-hero-glow" />
        <div className="pi-os-hero-grid" />
        <div className="pi-os-hero-inner">
          <div className="pi-os-hero-left">
            <span className="pi-os-eyebrow">
              <span className="pi-os-eyebrow-dot" />
              PropertyInsta Platform
              <span className="pi-os-eyebrow-sep">·</span>
              <span className="pi-os-eyebrow-accent">v1.0</span>
            </span>
            <h1 className="pi-os-hero-title">
              The complete <span>real estate</span><br />
              operating system for India.
            </h1>
            <p className="pi-os-hero-sub">
              {stats.total} integrated modules connecting buyers, brokers, builders, lenders &amp; legal —
              under one platform. Discover, verify, transact &amp; manage, end-to-end.
            </p>
            <div className="pi-os-hero-actions">
              <button className="pi-os-cta primary" onClick={() => setCurrentView('feed')}>
                <span>🚀 Start exploring</span>
              </button>
              <button className="pi-os-cta ghost" onClick={() => document.getElementById('os-modules-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                View all {stats.total} modules ↓
              </button>
            </div>
          </div>

          <div className="pi-os-hero-right">
            <div className="pi-os-stat-grid">
              <div className="pi-os-stat">
                <span className="pi-os-stat-num">{stats.total}</span>
                <span className="pi-os-stat-lbl">Modules</span>
              </div>
              <div className="pi-os-stat">
                <span className="pi-os-stat-num live">{stats.live}</span>
                <span className="pi-os-stat-lbl">Live now</span>
              </div>
              <div className="pi-os-stat">
                <span className="pi-os-stat-num beta">{stats.beta}</span>
                <span className="pi-os-stat-lbl">In beta</span>
              </div>
              <div className="pi-os-stat">
                <span className="pi-os-stat-num">{stats.categories}</span>
                <span className="pi-os-stat-lbl">Categories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live activity ticker */}
        <div className="pi-os-ticker">
          <span className="pi-os-ticker-label">⚡ Live</span>
          <div className="pi-os-ticker-track">
            <div className="pi-os-ticker-content">
              {[...ACTIVITY_TICKER, ...ACTIVITY_TICKER].map((item, i) => (
                <span key={i} className="pi-os-ticker-item">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Recently used (from localStorage) ─────────── */}
      {recentModules.length > 0 && (
        <section className="pi-os-quicklaunch">
          <div className="pi-os-section-head">
            <h2>🕐 Recently used</h2>
            <span>last {recentModules.length}</span>
          </div>
          <div className="pi-os-quicklaunch-row">
            {recentModules.map(m => (
              <button
                key={`recent-${m.id}`}
                className="pi-os-quicklaunch-tile"
                style={{ '--cat-color': CATEGORIES[m.category]?.color }}
                onClick={() => openModule(m.id)}
              >
                <span className="pi-os-ql-icon">{m.icon}</span>
                <span className="pi-os-ql-name">{m.name}</span>
                <span className="pi-os-ql-cta">Open →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── Quick-launch live modules (most-used row) ─────────── */}
      {liveModules.length > 0 && (
        <section className="pi-os-quicklaunch">
          <div className="pi-os-section-head">
            <h2>⚡ Live modules — ready to use</h2>
            <span>{liveModules.length} available now</span>
          </div>
          <div className="pi-os-quicklaunch-row">
            {liveModules.map(m => (
              <button
                key={m.id}
                className="pi-os-quicklaunch-tile"
                style={{ '--cat-color': CATEGORIES[m.category]?.color }}
                onClick={() => openModule(m.id)}
              >
                <span className="pi-os-ql-icon">{m.icon}</span>
                <span className="pi-os-ql-name">{m.name}</span>
                <span className="pi-os-ql-cta">Open →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── Full modules grid with filter chips ─────────── */}
      <section id="os-modules-grid" className="pi-os-modules">
        <div className="pi-os-section-head pi-os-modules-head">
          <div>
            <h2>All modules</h2>
            <p className="pi-os-section-sub">Every capability of the platform, in one place.</p>
          </div>
          <div className="pi-os-toolbar">
            <div className="pi-os-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules…"
              />
              {search ? (
                <button className="pi-os-search-clear" onClick={() => setSearch('')} title="Clear">✕</button>
              ) : (
                <kbd className="pi-os-kbd">⌘ K</kbd>
              )}
            </div>
            <div className="pi-os-filter-chips">
              {[
                { id: 'all',  label: `All (${visibleModules.length})` },
                { id: 'live', label: `Live (${stats.live})` },
                { id: 'beta', label: `Beta (${stats.beta})` },
              ].map(f => (
                <button
                  key={f.id}
                  className={`pi-os-chip ${filter === f.id ? 'active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="pi-os-viewtoggle">
              <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </button>
              <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Empty search state */}
        {filteredModules.length === 0 && (
          <div className="pi-os-empty">
            <span>🔍</span>
            <h3>No modules match “{search}”</h3>
            <p>Try a different keyword, category, or clear the filters.</p>
            <button className="pi-os-cta ghost" onClick={() => { setSearch(''); setFilter('all'); }}>Reset</button>
          </div>
        )}

        {activeCats.map(([cat, modules]) => {
          const meta = CATEGORIES[cat];
          return (
            <div key={cat} className="pi-os-cat">
              <div className="pi-os-cat-head">
                <span className="pi-os-cat-icon" style={{ background: meta?.color }}>{meta?.icon}</span>
                <h3>{meta?.label}</h3>
                <span className="pi-os-cat-count">{modules.length}</span>
              </div>
              <div className={`pi-os-card-grid view-${viewMode}`}>
                {modules.map(m => {
                  const isClickable = m.status !== 'coming';
                  return (
                    <button
                      key={m.id}
                      className={`pi-os-card status-${m.status}`}
                      style={{ '--cat-color': meta?.color }}
                      onClick={() => isClickable && openModule(m.id)}
                      disabled={!isClickable}
                    >
                      <span className="pi-os-card-icon">{m.icon}</span>
                      <div className="pi-os-card-body">
                        <div className="pi-os-card-top">
                          <h4>{m.name}</h4>
                          <span className={`pi-os-status ${STATUS_BADGE[m.status].cls}`}>{STATUS_BADGE[m.status].label}</span>
                        </div>
                        <p>{m.desc}</p>
                      </div>
                      {isClickable && <span className="pi-os-card-arrow">→</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* ─────────── Footer CTA ─────────── */}
      <section className="pi-os-foot">
        <h2>Built for everyone in real estate.</h2>
        <p>Buyers, brokers, builders, lenders, lawyers — one platform, many roles.</p>
        <div className="pi-os-foot-roles">
          {['🏠 Buyers', '🤝 Brokers', '🏗️ Builders', '🏦 Lenders', '⚖️ Legal', '📊 Investors'].map(r => (
            <span key={r} className="pi-os-role-chip">{r}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

export { ALL_MODULES };
