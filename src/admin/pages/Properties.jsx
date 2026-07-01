import { useState } from 'react';
import { allProperties as STATIC_PROPS } from '../../data';
import { useCollection } from '../useCollection';
import { Modal, Confirm, Field, inp } from '../ui';

const TYPES = ['apartment', 'villa', 'penthouse', 'builder floor', 'plot', 'commercial'];
const STATUSES = ['sale', 'rent'];
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const EMPTY = { title: '', location: '', price: '', beds: 3, baths: 2, sqft: '', type: 'apartment', status: 'sale', builder: '', featured: false, hot: false, description: '', images: [] };

export default function AdminProperties() {
  const { rows, add, update, remove } = useCollection('properties', STATIC_PROPS, { orderBy: 'id', ascending: false });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const filtered = rows.filter(r =>
    !search || `${r.title} ${r.location} ${r.builder}`.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (r) => {
    setEditing(r.id);
    setForm({ ...EMPTY, ...r, beds: r.beds ?? r.bedrooms ?? 3, baths: r.baths ?? r.bathrooms ?? 2, sqft: r.sqft ?? r.area ?? '', images: r.images || [] });
    setShowModal(true);
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.title) return;
    const payload = {
      title: form.title, location: form.location, price: Number(form.price) || 0,
      beds: Number(form.beds) || 0, baths: Number(form.baths) || 0, sqft: Number(form.sqft) || 0,
      type: form.type, status: form.status, builder: form.builder,
      featured: !!form.featured, hot: !!form.hot, description: form.description,
      images: Array.isArray(form.images) ? form.images : String(form.images).split(',').map(s => s.trim()).filter(Boolean),
    };
    editing ? update(editing, payload) : add(payload);
    setShowModal(false);
  };

  return (
    <div className="adm-page">
      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Search title, location or builder…" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="adm-count">{filtered.length} listings</span>
        <button className="adm-btn primary" onClick={openAdd}>+ Add listing</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th></th><th>Title</th><th>Location</th><th>Price</th><th>Config</th><th>Type</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td><div className="adm-thumb">{(r.images && r.images[0]) ? <img src={r.images[0]} alt="" onError={e => { e.target.style.visibility = 'hidden'; }} /> : '🏠'}</div></td>
                <td><strong>{r.title}</strong>{r.featured && <span className="adm-tag">Featured</span>}</td>
                <td className="adm-muted">{r.location}</td>
                <td>{inr(r.price)}</td>
                <td className="adm-muted">{(r.beds ?? r.bedrooms)} bed · {(r.baths ?? r.bathrooms)} bath · {(r.sqft ?? r.area)} sqft</td>
                <td className="adm-muted" style={{ textTransform: 'capitalize' }}>{r.type}</td>
                <td><span className={`adm-pill ${/rent/i.test(r.status) ? 'rent' : 'sale'}`}>{/rent/i.test(r.status) ? 'Rent' : 'Sale'}</span></td>
                <td>
                  <div className="adm-row-actions">
                    <button onClick={() => openEdit(r)} title="Edit">✏️</button>
                    <button onClick={() => setShowDelete(r)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="adm-empty">No listings match your search.</p>}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit listing' : 'New listing'} onClose={() => setShowModal(false)} onSave={save} saveLabel={editing ? 'Save' : 'Add listing'}>
          <Field label="Title *" cls="col2"><input className={inp} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
          <Field label="Location" cls="col2"><input className={inp} value={form.location} onChange={e => set('location', e.target.value)} /></Field>
          <Field label="Price (₹)"><input className={inp} type="number" value={form.price} onChange={e => set('price', e.target.value)} /></Field>
          <Field label="Builder"><input className={inp} value={form.builder} onChange={e => set('builder', e.target.value)} /></Field>
          <Field label="Bedrooms"><input className={inp} type="number" value={form.beds} onChange={e => set('beds', e.target.value)} /></Field>
          <Field label="Bathrooms"><input className={inp} type="number" value={form.baths} onChange={e => set('baths', e.target.value)} /></Field>
          <Field label="Area (sqft)"><input className={inp} type="number" value={form.sqft} onChange={e => set('sqft', e.target.value)} /></Field>
          <Field label="Type"><select className={inp} value={form.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Status"><select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s} value={s}>{s === 'sale' ? 'For Sale' : 'For Rent'}</option>)}</select></Field>
          <Field label="Image URLs (comma-separated)" cls="col2"><input className={inp} value={Array.isArray(form.images) ? form.images.join(', ') : form.images} onChange={e => set('images', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} /></Field>
          <Field label="Description" cls="col2"><textarea className={inp} rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
          <Field label="Flags" cls="col2">
            <div className="adm-checks">
              <label><input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} /> Featured</label>
              <label><input type="checkbox" checked={!!form.hot} onChange={e => set('hot', e.target.checked)} /> Hot deal</label>
            </div>
          </Field>
        </Modal>
      )}
      {showDelete && <Confirm title="Delete listing?" sub={showDelete.title} onCancel={() => setShowDelete(null)} onConfirm={() => { remove(showDelete.id); setShowDelete(null); }} />}
    </div>
  );
}
