import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useRole, ROLES } from '../context/RoleContext';

// Primary tabs stay visible; the rest collapse into a "More ▾" dropdown.
const PRIMARY_TABS = [
  { id: 'feed', icon: 'home', label: 'Discover' },
  { id: 'reels', icon: 'play', label: 'Reels' },
  { id: 'mapView', icon: 'map', label: 'Map' },
  { id: 'saved', icon: 'bookmark', label: 'Saved' },
  { id: 'build-with-us', icon: 'build', label: 'Build With Us' },
];
const MORE_TABS = [
  { id: 'post-property', icon: 'post', label: 'Post Property' },
  { id: 'home-loans', icon: 'loan', label: 'Home Loans' },
  { id: 'localities', icon: 'locality', label: 'Localities' },
  { id: 'content-hub', icon: 'library', label: 'Content' },
  { id: 'blog', icon: 'blog', label: 'Blog' },
  { id: 'my-journey', icon: 'journey', label: 'My Journey' },
];
// Union — used by the mobile drawer (shows every destination).
const CORE_TABS = [...PRIMARY_TABS, ...MORE_TABS];

const OS_MODULES_BY_ROLE = {
  buyer: [
    { id: 'crm', icon: '📥', label: 'Leads / CRM' },
    { id: 'trust', icon: '🛡️', label: 'Trust Layer' },
    { id: 'passport', icon: '📋', label: 'Property Passport' },
    { id: 'financing', icon: '🏦', label: 'Financing' },
    { id: 'legal', icon: '⚖️', label: 'Legal' },
    { id: 'infra', icon: '🚇', label: 'Infra Intel' },
    { id: 'copilot', icon: '🤖', label: 'AI Copilot' },
    { id: 'transaction', icon: '🤝', label: 'Transactions' },
    { id: 'investment', icon: '📈', label: 'Invest' },
  ],
  broker: [
    { id: 'crm', icon: '📊', label: 'CRM' },
    { id: 'channelpartner', icon: '🌐', label: 'Channel Partners' },
    { id: 'trust', icon: '🛡️', label: 'Trust Layer' },
    { id: 'transaction', icon: '🤝', label: 'Transactions' },
    { id: 'financing', icon: '🏦', label: 'Financing' },
    { id: 'legal', icon: '⚖️', label: 'Legal' },
    { id: 'datacloud', icon: '☁️', label: 'Data Cloud' },
    { id: 'copilot', icon: '🤖', label: 'AI Copilot' },
  ],
};

const TIER1_CITIES = ['All India', 'Gurgaon', 'Delhi', 'Mumbai', 'Navi Mumbai', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Kolkata', 'Chandigarh', 'Lucknow', 'Ludhiana', 'Indore', 'Vrindavan', 'Faridabad', 'Greater Noida', 'Noida', 'Ghaziabad'];

// Shared SVG inner-paths for the core nav icons (used by the desktop tabs and the mobile drawer)
function NavIcon({ icon }) {
  return (
    <svg className="ig-nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icon === 'home' && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
      {icon === 'play' && <polygon points="5 3 19 12 5 21 5 3" />}
      {icon === 'map' && <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>}
      {icon === 'bookmark' && <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />}
      {icon === 'library' && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2" /></>}
      {icon === 'blog' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></>}
      {icon === 'build' && <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>}
      {icon === 'loan' && <><line x1="3" y1="21" x2="21" y2="21" /><path d="M3 10l9-6 9 6" /><line x1="5" y1="10" x2="5" y2="21" /><line x1="9.5" y1="10" x2="9.5" y2="21" /><line x1="14.5" y1="10" x2="14.5" y2="21" /><line x1="19" y1="10" x2="19" y2="21" /></>}
      {icon === 'journey' && <><circle cx="12" cy="12" r="9" /><polyline points="8.5 12 11 14.5 15.5 9.5" /></>}
      {icon === 'locality' && <><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>}
      {icon === 'post' && <><rect x="3" y="3" width="18" height="18" rx="3" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>}
    </svg>
  );
}

export default function Header() {
  const {
    currentView, setCurrentView,
    darkMode, toggleDarkMode,
    notifications, unreadCount, markNotifRead,
    filters, setFilters,
    sidebarOpen, toggleSidebar,
    setActiveModal,
  } = useApp();
  const { role, switchRole, ROLE_LABELS, ROLE_COLORS } = useRole();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [cityOpen, setCityOpen] = useState(false);
  const [osMenuOpen, setOsMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const cityRef = useRef(null);
  const osRef = useRef(null);
  const roleRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false);
      if (osRef.current && !osRef.current.contains(e.target)) setOsMenuOpen(false);
      if (roleRef.current && !roleRef.current.contains(e.target)) setRoleMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const closeAll = () => { setSearchOpen(false); setNotifOpen(false); setCityOpen(false); setOsMenuOpen(false); setRoleMenuOpen(false); setMoreOpen(false); };
  const isMoreActive = MORE_TABS.some(t => t.id === currentView);
  const navTo = (view) => { setCurrentView(view); setDrawerOpen(false); };
  const handleSearchChange = (val) => { setSearchQuery(val); setFilters(prev => ({ ...prev, search: val })); };

  const isOsActive = !['feed', 'reels', 'mapView', 'localities', 'saved', 'blog', 'content-hub', 'build-with-us', 'home-loans', 'my-journey', 'post-property'].includes(currentView);
  const roleColor = ROLE_COLORS[role];
  const osModules = OS_MODULES_BY_ROLE[role] || OS_MODULES_BY_ROLE.buyer;

  return (
    <>
    <header className="ig-header" id="igHeader">
      <div className="ig-header-inner">
        {/* Mobile hamburger — opens the all-options drawer */}
        <button className="ig-hamburger-btn" onClick={() => setDrawerOpen(true)} title="Menu" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <a className="ig-logo" onClick={() => setCurrentView('feed')}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-label="PropertyInsta">
            <rect width="34" height="34" rx="9.5" fill="url(#logoGrad)" />
            <rect width="34" height="34" rx="9.5" fill="url(#logoGloss)" />
            {/* House */}
            <path d="M17 8.2l8 6.6c.32.27.5.66.5 1.08V25.2A1.8 1.8 0 0 1 23.7 27H10.3A1.8 1.8 0 0 1 8.5 25.2v-9.34c0-.42.18-.81.5-1.08L17 8.2z" fill="#fff" />
            {/* Orange play badge — Look · Visit · Book */}
            <circle cx="17" cy="18.6" r="4.6" fill="url(#logoAccent)" />
            <path d="M15.5 16.3l3.2 2.3-3.2 2.3z" fill="#fff" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="34" y2="34">
                <stop stopColor="#1b4db1" />
                <stop offset="1" stopColor="#2e6fe0" />
              </linearGradient>
              <linearGradient id="logoGloss" x1="17" y1="0" x2="17" y2="34">
                <stop stopColor="#fff" stopOpacity="0.28" />
                <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="logoAccent" x1="12" y1="14" x2="22" y2="23">
                <stop stopColor="#fb8c3a" />
                <stop offset="1" stopColor="#ea6a0c" />
              </linearGradient>
            </defs>
          </svg>
          <span className="ig-logo-text">PropertyInsta</span>
        </a>

        {/* Core Nav Tabs */}
        <nav className="ig-nav-tabs">
          {PRIMARY_TABS.map(tab => (
            <button
              key={tab.id}
              className={`ig-nav-tab ${currentView === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentView(tab.id)}
            >
              <NavIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}

          {/* More dropdown — secondary destinations */}
          <div className="ig-more-dropdown" ref={moreRef}>
            <button
              className={`ig-nav-tab ig-more-btn ${isMoreActive ? 'active' : ''}`}
              onClick={() => { closeAll(); setMoreOpen(v => !v); }}
            >
              <span>More</span>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 2 }}>
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {moreOpen && (
              <div className="ig-more-menu">
                {MORE_TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`ig-more-item ${currentView === tab.id ? 'active' : ''}`}
                    onClick={() => { setCurrentView(tab.id); setMoreOpen(false); }}
                  >
                    <NavIcon icon={tab.icon} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform OS Mega Menu */}
          <div className="ig-os-dropdown" ref={osRef}>
            <button
              className={`ig-nav-tab os-platform-btn ${isOsActive ? 'active' : ''}`}
              onClick={() => { setOsMenuOpen(!osMenuOpen); closeAll(); setOsMenuOpen(v => !v); }}
            >
              <span className="os-grid-icon">⊞</span>
              <span>Platform</span>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 2 }}>
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {osMenuOpen && (
              <div className="os-mega-menu">
                <div className="os-mega-header">
                  <button className="os-mega-all-btn" onClick={() => { setCurrentView('os'); setOsMenuOpen(false); }}>
                    ⊞ View All Modules →
                  </button>
                </div>
                <div className="os-mega-grid">
                  {osModules.map(m => (
                    <button
                      key={m.id}
                      className={`os-mega-item ${currentView === m.id ? 'active' : ''}`}
                      onClick={() => { setCurrentView(m.id); setOsMenuOpen(false); }}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Header Actions */}
        <div className="ig-header-actions">
          {/* Role Switcher — only shown when more than one role exists */}
          {Object.keys(ROLES).length > 1 && (
            <div className="role-switcher" ref={roleRef}>
              <button
                className="role-switcher-btn"
                style={{ '--role-color': roleColor }}
                onClick={() => { setRoleMenuOpen(!roleMenuOpen); setOsMenuOpen(false); }}
              >
                <span className="role-dot" style={{ background: roleColor }} />
                <span>{ROLE_LABELS[role]}</span>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {roleMenuOpen && (
                <div className="role-menu">
                  <div className="role-menu-title">Switch Role</div>
                  {Object.values(ROLES).map(r => (
                    <button
                      key={r}
                      className={`role-menu-item ${role === r ? 'active' : ''}`}
                      onClick={() => { switchRole(r); setRoleMenuOpen(false); }}
                      style={{ '--rc': ROLE_COLORS[r] }}
                    >
                      <span className="role-dot" style={{ background: ROLE_COLORS[r] }} />
                      {ROLE_LABELS[r]}
                      {role === r && <span className="role-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* City Dropdown */}
          <div className="ig-city-dropdown" ref={cityRef}>
            <button className="ig-city-btn" onClick={() => { setCityOpen(!cityOpen); closeAll(); setCityOpen(v => !v); }} title="Select city">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{filters.city || 'All India'}</span>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" /></svg>
            </button>
            {cityOpen && (
              <div className="ig-city-list">
                {TIER1_CITIES.map(city => (
                  <button key={city}
                    className={`ig-city-option ${(filters.city === city || (!filters.city && city === 'All India')) ? 'active' : ''}`}
                    onClick={() => { setFilters(prev => ({ ...prev, city: city === 'All India' ? '' : city })); setCityOpen(false); }}
                  >
                    {city}
                    {((filters.city === city) || (!filters.city && city === 'All India')) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle — prominent labeled button */}
          {['feed', 'mapView', 'saved'].includes(currentView) && (
            <button className={`ig-filter-toggle-btn ${sidebarOpen ? 'active' : ''}`} onClick={toggleSidebar} title="Filters">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
            </button>
          )}

          {/* Search */}
          <button className="ig-icon-btn" onClick={() => { setSearchOpen(!searchOpen); closeAll(); setSearchOpen(v => !v); }} title="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Notifications */}
          <button className="ig-icon-btn" id="notifBell" onClick={() => { setNotifOpen(!notifOpen); closeAll(); setNotifOpen(v => !v); }} title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="ig-badge">{unreadCount}</span>}
          </button>

          {/* Dark Mode */}
          <button className="ig-icon-btn" onClick={toggleDarkMode} title="Toggle theme">
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Avatar */}
          <button className="ig-avatar-btn" title="Account">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face" alt="User avatar" width="32" height="32" />
          </button>
        </div>
      </div>

      {/* Search Panel */}
      <div ref={searchRef} className={`ig-search-panel ${searchOpen ? '' : 'hidden'}`}>
        <div className="ig-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <form onSubmit={e => { e.preventDefault(); setFilters(prev => ({ ...prev, search: searchQuery })); }}>
            <input type="text" placeholder="Search by city, locality, project, or agent..." value={searchQuery} onChange={e => handleSearchChange(e.target.value)} autoFocus />
          </form>
        </div>
      </div>

      {/* Notifications Panel */}
      <div ref={notifRef} className={`ig-notif-panel ${notifOpen ? '' : 'hidden'}`}>
        <div className="notif-panel-header">
          <h4>Notifications</h4>
          {unreadCount > 0 && (
            <button className="notif-mark-read" onClick={() => notifications.forEach(n => markNotifRead(n.id))}>Mark all read</button>
          )}
        </div>
        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => markNotifRead(n.id)}>
                <div className="notif-icon">
                  {n.icon === 'fa-tag' && '💰'}{n.icon === 'fa-home' && '🏠'}{n.icon === 'fa-calendar-check' && '📅'}
                  {n.icon === 'fa-user-check' && '👤'}{n.icon === 'fa-balance-scale' && '⚖️'}
                </div>
                <div className="notif-content">
                  <p className="notif-text">{n.text}</p>
                  <span className="notif-time">{n.time}</span>
                </div>
                {!n.read && <span className="notif-dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </header>

    {/* Mobile All-Options Drawer — sibling of <header> so its position:fixed
        resolves against the viewport, not the backdrop-filtered header */}
      <div className={`ig-drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`ig-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        {/* Brand header */}
        <div className="ig-drawer-head">
          <a className="ig-drawer-brand" onClick={() => navTo('feed')}>
            <svg width="30" height="30" viewBox="0 0 34 34" fill="none" aria-hidden="true">
              <rect width="34" height="34" rx="9.5" fill="url(#dwGrad)" />
              <path d="M17 8.2l8 6.6c.32.27.5.66.5 1.08V25.2A1.8 1.8 0 0 1 23.7 27H10.3A1.8 1.8 0 0 1 8.5 25.2v-9.34c0-.42.18-.81.5-1.08L17 8.2z" fill="#fff" />
              <circle cx="17" cy="18.6" r="4.6" fill="url(#dwAccent)" />
              <path d="M15.5 16.3l3.2 2.3-3.2 2.3z" fill="#fff" />
              <defs>
                <linearGradient id="dwGrad" x1="0" y1="0" x2="34" y2="34"><stop stopColor="#1b4db1" /><stop offset="1" stopColor="#2e6fe0" /></linearGradient>
                <linearGradient id="dwAccent" x1="12" y1="14" x2="22" y2="23"><stop stopColor="#fb8c3a" /><stop offset="1" stopColor="#ea6a0c" /></linearGradient>
              </defs>
            </svg>
            <span className="ig-drawer-brand-text">Property<b>Insta</b></span>
          </a>
          <button className="ig-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Profile card */}
        <div className="ig-drawer-profile">
          <img className="ig-drawer-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face" alt="" width="44" height="44" />
          <div className="ig-drawer-profile-info">
            <strong>Welcome back</strong>
            <span className="ig-drawer-role-badge" style={{ '--rc': roleColor }}>
              <span className="role-dot" style={{ background: roleColor }} />
              {ROLE_LABELS[role]}
            </span>
          </div>
          <span className="ig-drawer-chip">{filters.city || 'All India'}</span>
        </div>

        <div className="ig-drawer-body">
          {/* Role switcher */}
          {Object.keys(ROLES).length > 1 && (
            <div className="ig-drawer-section">
              <span className="ig-drawer-label">Switch role</span>
              <div className="ig-drawer-roles">
                {Object.values(ROLES).map(r => (
                  <button
                    key={r}
                    className={`ig-drawer-role ${role === r ? 'active' : ''}`}
                    onClick={() => switchRole(r)}
                    style={{ '--rc': ROLE_COLORS[r] }}
                  >
                    <span className="role-dot" style={{ background: ROLE_COLORS[r] }} />
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Browse */}
          <div className="ig-drawer-section">
            <span className="ig-drawer-label">Browse</span>
            <div className="ig-drawer-links">
              {CORE_TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  className={`ig-drawer-link ${currentView === tab.id ? 'active' : ''}`}
                  style={{ '--i': i }}
                  onClick={() => navTo(tab.id)}
                >
                  <span className="ig-drawer-ico"><NavIcon icon={tab.icon} /></span>
                  <span className="ig-drawer-link-label">{tab.label}</span>
                  <svg className="ig-drawer-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          </div>

          {/* Platform modules */}
          <div className="ig-drawer-section">
            <span className="ig-drawer-label">Platform</span>
            <div className="ig-drawer-links">
              <button
                className={`ig-drawer-link ${currentView === 'os' ? 'active' : ''}`}
                style={{ '--i': 0 }}
                onClick={() => navTo('os')}
              >
                <span className="ig-drawer-ico ig-drawer-ico-emoji">⊞</span>
                <span className="ig-drawer-link-label">All Modules</span>
                <svg className="ig-drawer-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {osModules.map((m, i) => (
                <button
                  key={m.id}
                  className={`ig-drawer-link ${currentView === m.id ? 'active' : ''}`}
                  style={{ '--i': i + 1 }}
                  onClick={() => navTo(m.id)}
                >
                  <span className="ig-drawer-ico ig-drawer-ico-emoji">{m.icon}</span>
                  <span className="ig-drawer-link-label">{m.label}</span>
                  <svg className="ig-drawer-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: theme switch + admin + version */}
        <div className="ig-drawer-foot">
          <button className="ig-drawer-theme" onClick={toggleDarkMode} aria-pressed={darkMode}>
            <span className="ig-drawer-theme-ico">{darkMode ? '☀️' : '🌙'}</span>
            <span className="ig-drawer-theme-label">{darkMode ? 'Light mode' : 'Dark mode'}</span>
            <span className={`ig-drawer-switch ${darkMode ? 'on' : ''}`}><i /></span>
          </button>
          <button className="ig-drawer-admin" onClick={() => { setDrawerOpen(false); setActiveModal({ type: 'admin' }); }}>
            <span className="ig-drawer-theme-ico">🛠️</span>
            <span className="ig-drawer-theme-label">Admin panel</span>
            <span className="ig-drawer-admin-arrow">→</span>
          </button>
          <span className="ig-drawer-version">PropertyInsta · India's Real-Estate OS</span>
        </div>
      </aside>
    </>
  );
}
