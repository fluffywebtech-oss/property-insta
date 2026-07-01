import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getLeads } from '../../utils/leads';
import { Stat } from '../ui';

const inrShort = (n) => {
  n = Math.round(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export default function AdminDashboard() {
  const { allProperties } = useApp();
  const leads = useMemo(() => { try { return getLeads(); } catch { return []; } }, []);

  const featured = allProperties.filter(p => p.featured).length;
  const newLeads = leads.filter(l => (l.status || 'New') === 'New').length;
  const listingLeads = leads.filter(l => /listing/i.test(l.property_title || '')).length;
  const loanLeads = leads.filter(l => /home loan|pre-approval/i.test(l.property_title || '')).length;
  const avg = allProperties.length ? allProperties.reduce((a, p) => a + (p.price || 0), 0) / allProperties.length : 0;

  return (
    <div className="adm-page">
      <div className="adm-stats-grid">
        <Stat icon="🏠" n={allProperties.length} label="Total listings" />
        <Stat icon="📥" n={leads.length} label="Total leads" tone="link" />
        <Stat icon="🆕" n={newLeads} label="New leads" tone="green" />
        <Stat icon="⭐" n={featured} label="Featured" />
        <Stat icon="🏷️" n={listingLeads} label="Seller submissions" />
        <Stat icon="🏦" n={loanLeads} label="Loan enquiries" />
      </div>

      <div className="adm-cols">
        <section className="adm-card">
          <div className="adm-card-head"><h3>Recent leads</h3><span>{leads.length} total</span></div>
          {leads.length === 0 ? (
            <p className="adm-empty">No leads yet. Enquiries from the site (contact, site visits, home-loan pre-approvals & seller listings) appear here.</p>
          ) : (
            <table className="adm-table compact">
              <thead><tr><th>Name</th><th>Interest</th><th>Phone</th><th>Status</th></tr></thead>
              <tbody>
                {leads.slice(0, 8).map(l => (
                  <tr key={l.ref}>
                    <td>{l.name || '—'}</td>
                    <td className="adm-muted">{l.property_title || l.intent}</td>
                    <td className="adm-muted">{l.phone || '—'}</td>
                    <td><span className={`adm-pill ${(l.status || 'New').toLowerCase().replace(/\s/g, '')}`}>{l.status || 'New'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="adm-card">
          <div className="adm-card-head"><h3>Portfolio snapshot</h3></div>
          <ul className="adm-kv">
            <li><span>Average price</span><strong>{inrShort(avg)}</strong></li>
            <li><span>Featured listings</span><strong>{featured}</strong></li>
            <li><span>For sale</span><strong>{allProperties.filter(p => /sale/i.test(p.status || '')).length}</strong></li>
            <li><span>For rent</span><strong>{allProperties.filter(p => /rent/i.test(p.status || '')).length}</strong></li>
            <li><span>New leads</span><strong className="green">{newLeads}</strong></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
