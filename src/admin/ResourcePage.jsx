import { useState, useMemo } from 'react';
import { useCollection } from './useCollection';
import { Modal, Confirm, Field, inp } from './ui';

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Build a blank form object from a field config.
function emptyForm(fields) {
  const o = {};
  fields.forEach(f => {
    o[f.key] = f.default !== undefined ? f.default
      : f.type === 'checkbox' ? false
        : f.type === 'tags' ? [] : '';
  });
  return o;
}

function Cell({ col, row }) {
  if (col.pill) {
    const v = row[col.key];
    return <span className={`adm-pill ${String(v || '').toLowerCase().replace(/\s+/g, '')}`}>{v || '—'}</span>;
  }
  if (col.render) return col.render(row);
  const v = row[col.key];
  if (Array.isArray(v)) return v.slice(0, 3).join(', ');
  return v ?? '—';
}

export default function ResourcePage({ config }) {
  const { table, seed, localKey, orderBy = 'id', ascending = false, fields, columns, search = [], thumb, thumbRound, titleKey = 'title' } = config;
  const { rows, add, update, remove } = useCollection(table, seed, { localKey: localKey || `os_${table}`, orderBy, ascending });
  const [q, setQ] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyForm(fields));

  const filtered = useMemo(() => rows.filter(r =>
    !q || search.some(k => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()))), [rows, q, search]);

  const openAdd = () => { setEditing(null); setForm(emptyForm(fields)); setShowModal(true); };
  const openEdit = (r) => { setEditing(r.id); setForm({ ...emptyForm(fields), ...r }); setShowModal(true); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    const first = fields.find(f => f.required);
    if (first && !form[first.key]) return;
    const payload = {};
    fields.forEach(f => {
      let v = form[f.key];
      if (f.type === 'number') v = Number(v) || 0;
      if (f.type === 'checkbox') v = !!v;
      if (f.type === 'tags') v = Array.isArray(v) ? v : String(v).split(',').map(s => s.trim()).filter(Boolean);
      payload[f.key] = v;
    });
    editing ? update(editing, payload) : add(payload);
    setShowModal(false);
  };

  return (
    <div className="adm-page">
      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
        <span className="adm-count">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>
        <button className="adm-btn primary" onClick={openAdd}>+ Add</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr>{thumb && <th></th>}{columns.map(c => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                {thumb && <td><div className={`adm-thumb ${thumbRound ? 'round' : ''}`}>{thumb(r) ? <img src={thumb(r)} alt="" onError={e => { e.target.style.visibility = 'hidden'; }} /> : '📄'}</div></td>}
                {columns.map(c => <td key={c.key} className={c.muted ? 'adm-muted' : ''}><Cell col={c} row={r} /></td>)}
                <td><div className="adm-row-actions">
                  <button onClick={() => openEdit(r)} title="Edit">✏️</button>
                  <button onClick={() => setShowDelete(r)} title="Delete">🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="adm-empty">No items{q ? ' match your search' : ' yet'}.</p>}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit' : 'Add new'} onClose={() => setShowModal(false)} onSave={save} saveLabel={editing ? 'Save' : 'Add'}>
          {fields.map(f => (
            <Field key={f.key} label={f.label + (f.required ? ' *' : '')} cls={f.col2 || f.type === 'textarea' || f.type === 'tags' ? 'col2' : ''}>
              {f.type === 'textarea' ? (
                <textarea className={inp} rows={2} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
              ) : f.type === 'select' ? (
                <select className={inp} value={form[f.key]} onChange={e => set(f.key, e.target.value)}>{f.options.map(o => <option key={o}>{o}</option>)}</select>
              ) : f.type === 'checkbox' ? (
                <label className="adm-checks"><input type="checkbox" checked={!!form[f.key]} onChange={e => set(f.key, e.target.checked)} /> {f.hint || 'Yes'}</label>
              ) : f.type === 'tags' ? (
                <input className={inp} value={Array.isArray(form[f.key]) ? form[f.key].join(', ') : form[f.key]} placeholder="comma-separated" onChange={e => set(f.key, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
              ) : (
                <input className={inp} type={f.type === 'number' ? 'number' : 'text'} value={form[f.key] ?? ''} placeholder={f.placeholder} onChange={e => set(f.key, e.target.value)} />
              )}
            </Field>
          ))}
        </Modal>
      )}
      {showDelete && <Confirm title="Delete item?" sub={showDelete[titleKey]} onCancel={() => setShowDelete(null)} onConfirm={() => { remove(showDelete.id); setShowDelete(null); }} />}
    </div>
  );
}
