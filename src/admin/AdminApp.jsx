import { useState } from 'react';
import { useApp } from '../context/AppContext';
import AdminDashboard from './pages/Dashboard';
import AdminProperties from './pages/Properties';
import AdminLeads from './pages/Leads';

const NAV = [
  {
    label: 'Content', items: [
      ['dashboard', 'Dashboard', '📊'],
      ['assistant', 'AI Assistant', '✨'],
      ['enquiries', 'Enquiries', '📥'],
      ['meetings', 'Meetings', '📅'],
      ['properties', 'Properties', '🏠'],
      ['reels', 'Property Reels', '🎬'],
      ['stories', 'Stories', '▶️'],
      ['blogs', 'Blog Posts', '📝'],
      ['podcasts', 'Podcasts', '🎙️'],
      ['videos', 'Product Videos', '📹'],
      ['agents', 'Agents', '👥'],
    ],
  },
  {
    label: 'Operations & Management', items: [
      ['transactions', 'Transactions', '🤝'],
      ['investments', 'Investments', '📈'],
      ['builder-erp', 'Builder ERP', '🏗️'],
      ['channel-partners', 'Channel Partners', '🔗'],
      ['society-os', 'Society OS', '🛡️'],
      ['property-mgmt', 'Property Mgmt', '🔑'],
    ],
  },
  {
    label: 'Build With Us', items: [
      ['materials', 'Materials & Hardware', '🔨'],
      ['contractors', 'Contractors & Services', '👷'],
      ['designs', 'Design Ideas', '🎨'],
      ['designers', 'Designers', '✏️'],
    ],
  },
  {
    label: 'Platform', items: [
      ['site-config', 'Site Config', '🌐'],
      ['notifications', 'Notifications', '🔔'],
      ['reviews', 'Reviews', '⭐'],
      ['quiz', 'Quiz', '❓'],
      ['team', 'Team & Access', '🛡️'],
      ['reports', 'Reports & Export', '📤'],
      ['settings', 'Settings', '⚙️'],
    ],
  },
];

const LABELS = Object.fromEntries(NAV.flatMap(s => s.items).map(([id, label]) => [id, label]));

// Pages implemented so far; the rest render a placeholder (built in later stages).
const PAGES = {
  dashboard: AdminDashboard,
  properties: AdminProperties,
  enquiries: AdminLeads,
};

function Placeholder({ id }) {
  return (
    <div className="adm-placeholder">
      <div className="adm-placeholder-ico">🚧</div>
      <h2>{LABELS[id]}</h2>
      <p>This module is being brought into the in-app admin. It’s fully available in the standalone admin panel, and lands here in an upcoming stage.</p>
      <span className="adm-badge">Coming soon</span>
    </div>
  );
}

export default function AdminApp() {
  const { setCurrentView, toggleDarkMode, darkMode } = useApp();
  const [section, setSection] = useState('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  const Page = PAGES[section];

  return (
    <div className="adm-root">
      {/* Sidebar */}
      <aside className={`adm-sidebar ${navOpen ? 'open' : ''}`}>
        <div className="adm-brand">
          <span className="adm-brand-mark">PI</span>
          <div><strong>PropertyInsta</strong><span>Admin Console</span></div>
        </div>
        <nav className="adm-nav">
          {NAV.map(sec => (
            <div key={sec.label} className="adm-nav-section">
              <div className="adm-nav-label">{sec.label}</div>
              {sec.items.map(([id, label, icon]) => (
                <button
                  key={id}
                  className={`adm-nav-item ${section === id ? 'active' : ''}`}
                  onClick={() => { setSection(id); setNavOpen(false); }}
                >
                  <span className="adm-nav-ico">{icon}</span>
                  <span>{label}</span>
                  {!PAGES[id] && <span className="adm-soon-dot" title="Coming soon" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-burger" onClick={() => setNavOpen(v => !v)} aria-label="Toggle menu">☰</button>
          <h1>{LABELS[section]}</h1>
          <div className="adm-topbar-actions">
            <button className="adm-icon-btn" onClick={toggleDarkMode} title="Toggle theme">{darkMode ? '☀️' : '🌙'}</button>
            <button className="adm-back-btn" onClick={() => setCurrentView('feed')}>↩ Back to site</button>
          </div>
        </header>
        <div className="adm-content">
          {Page ? <Page /> : <Placeholder id={section} />}
        </div>
      </div>

      {navOpen && <div className="adm-scrim" onClick={() => setNavOpen(false)} />}
    </div>
  );
}
