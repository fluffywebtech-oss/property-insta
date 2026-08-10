import { useState, useEffect } from 'react';
import { getLeads, updateLead, deleteLead } from '../../utils/leads';
import { Confirm } from '../ui';

const STATUSES = ['New', 'Contacted', 'Visit Booked', 'Closed'];
const INTENT_LABEL = { contact: 'Contact', visit: 'Site visit', callback: 'Callback' };
const EMP_LS_KEY = 'os_employees';

function typeOf(l) {
  const t = (l.property_title || '').toLowerCase();
  if (t.includes('listing')) return 'Seller listing';
  if (t.includes('home loan') || t.includes('pre-approval')) return 'Home loan';
  return INTENT_LABEL[l.intent] || 'Enquiry';
}

export default function AdminLeads() {
  const [leads, setLeads] = useState(() => { try { return getLeads(); } catch { return []; } });
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    try { const s = localStorage.getItem(EMP_LS_KEY); if (s) setEmployees(JSON.parse(s)); } catch {}
  }, []);

  const filtered = leads.filter(l => filter === 'all' || (l.status || 'New') === filter);

  const setStatus = (ref, status) => {
    updateLead(ref, { status });
    setLeads(ls => ls.map(l => l.ref === ref ? { ...l, status } : l));
  };
  const doDelete = (ref) => {
    deleteLead(ref);
    setLeads(ls => ls.filter(l => l.ref !== ref));
    setShowDelete(null);
  };
  const assignLead = (ref, empId) => {
    const val = empId || null;
    updateLead(ref, { assigned_to: val });
    setLeads(ls => ls.map(l => l.ref === ref ? { ...l, assigned_to: val } : l));
  };

  const exportCsv = () => {
    const cols = ['ref', 'name', 'phone', 'email', 'type', 'status', 'assigned_to_name', 'property_title', 'visit_date', 'visit_time', 'created_at', 'message'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(l => {
      const empName = (employees.find(e => String(e.id) === String(l.assigned_to)) || {}).name || '';
      return [l.ref, l.name, l.phone, l.email, typeOf(l), l.status || 'New', empName, l.property_title, l.visit_date, l.visit_time, l.created_at, l.message].map(esc).join(',');
    });
    const csv = [cols.join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'propertyinsta-leads.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const counts = STATUSES.reduce((m, s) => ({ ...m, [s]: leads.filter(l => (l.status || 'New') === s).length }), {});

  return (
    <div className="adm-page">
      <div className="adm-toolbar">
        <div className="adm-chips">
          <button className={`adm-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({leads.length})</button>
          {STATUSES.map(s => <button key={s} className={`adm-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s} ({counts[s]})</button>)}
        </div>
        <button className="adm-btn ghost" onClick={exportCsv} disabled={!filtered.length}>⭳ Export CSV</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Ref</th><th>Name</th><th>Type</th><th>Interest</th><th>Contact</th><th>Assigned To</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.ref}>
                <td className="adm-muted mono">{l.ref}</td>
                <td><strong>{l.name || '—'}</strong></td>
                <td><span className="adm-tag">{typeOf(l)}</span></td>
                <td className="adm-muted ellip" title={l.property_title}>{l.property_title || '—'}{l.visit_date ? ` · ${l.visit_date} ${l.visit_time || ''}` : ''}</td>
                <td className="adm-muted">{l.phone || l.email || '—'}</td>
                <td>
                  <select className="adm-assign-select" value={l.assigned_to || ''} onChange={e => assignLead(l.ref, e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </td>
                <td>
                  <select className={`adm-status ${(l.status || 'New').toLowerCase().replace(/\s/g, '')}`} value={l.status || 'New'} onChange={e => setStatus(l.ref, e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <div className="adm-row-actions">
                    <button onClick={() => setView(l)} title="View">👁️</button>
                    <button onClick={() => setShowDelete(l)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="adm-empty">No leads{filter !== 'all' ? ` with status “${filter}”` : ' yet'}.</p>}
      </div>

      {view && (
        <div className="adm-modal-backdrop" onClick={() => setView(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head"><h3>Lead {view.ref}</h3><button onClick={() => setView(null)}>✕</button></div>
            <div className="adm-modal-body">
              <ul className="adm-kv">
                <li><span>Name</span><strong>{view.name || '—'}</strong></li>
                <li><span>Phone</span><strong>{view.phone || '—'}</strong></li>
                <li><span>Email</span><strong>{view.email || '—'}</strong></li>
                <li><span>Type</span><strong>{typeOf(view)}</strong></li>
                <li><span>Interest</span><strong>{view.property_title || '—'}</strong></li>
                {view.visit_date && <li><span>Visit</span><strong>{view.visit_date} {view.visit_time}</strong></li>}
                <li><span>Assigned To</span><strong>{(employees.find(e => String(e.id) === String(view.assigned_to)) || {}).name || 'Unassigned'}</strong></li>
                <li><span>Received</span><strong>{view.created_at ? new Date(view.created_at).toLocaleString() : '—'}</strong></li>
              </ul>
              {view.message && <p className="adm-msg">{view.message}</p>}
            </div>
            <div className="adm-modal-foot">
              {view.phone && <a className="adm-btn ghost" href={`tel:+${String(view.phone).replace(/\D/g, '')}`}>📞 Call</a>}
              <button className="adm-btn primary" onClick={() => setView(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
      {showDelete && <Confirm title="Delete lead?" sub={`${showDelete.name || ''} · ${showDelete.ref}`} onCancel={() => setShowDelete(null)} onConfirm={() => doDelete(showDelete.ref)} />}
    </div>
  );
}
