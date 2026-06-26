import { useState, useEffect, useMemo } from 'react';
import { buildMaterials } from '../data';
import { supabase } from '../lib/supabase';
import { whatsappLink } from '../utils/leads';
import { setSeo, setJsonLd, origin } from '../utils/seo';

const STOCK_CLASS = { 'In Stock': 'in', 'Low Stock': 'low', 'Out of Stock': 'out' };
const DESK_PHONE = '+91-98100 00000';
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// What are you building? — each project type maps to the relevant material categories
const PROJECT_TYPES = [
  { key: 'Residential', icon: '🏠' },
  { key: 'Commercial', icon: '🏢' },
  { key: 'Industrial', icon: '🏭' },
  { key: 'Renovation', icon: '🔧' },
  { key: 'Interiors', icon: '🛋️' },
];
const CATEGORY_TYPES = {
  'Cement': ['Residential', 'Commercial', 'Industrial', 'Renovation'],
  'Steel & TMT': ['Residential', 'Commercial', 'Industrial'],
  'Bricks & Blocks': ['Residential', 'Commercial', 'Industrial', 'Renovation'],
  'Tiles & Flooring': ['Residential', 'Commercial', 'Renovation', 'Interiors'],
  'Paints': ['Residential', 'Commercial', 'Renovation', 'Interiors'],
  'Plumbing': ['Residential', 'Commercial', 'Industrial', 'Renovation'],
  'Electrical': ['Residential', 'Commercial', 'Industrial', 'Renovation'],
  'Sanitaryware': ['Residential', 'Commercial', 'Renovation', 'Interiors'],
  'Wood & Ply': ['Residential', 'Renovation', 'Interiors'],
  'Glass & Aluminium': ['Residential', 'Commercial', 'Interiors'],
  'Hardware & Fittings': ['Residential', 'Commercial', 'Renovation', 'Interiors'],
};
const matchesType = (item, type) => type === 'all' || (CATEGORY_TYPES[item.category] || []).includes(type);

export default function BuildWithUs() {
  const [items, setItems] = useState(buildMaterials);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [projectType, setProjectType] = useState('all');

  // Live catalog from Supabase (admin-managed) overrides the static seed when present
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('build_materials').select('*').order('id');
        if (!cancelled && !error && Array.isArray(data) && data.length) setItems(data);
      } catch { /* table missing — keep static catalog */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSeo({
      title: 'Build With Us — Materials & Hardware',
      description: 'Source cement, TMT steel, tiles, paints, plumbing, electrical & hardware from trusted suppliers. Build or renovate your home with PropertyInsta.',
      canonical: origin() + '/build-with-us',
      keywords: 'building materials, hardware, cement, TMT steel, tiles, paint, plumbing, Gurgaon',
    });
    setJsonLd('ld-bwu', {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: 'PropertyInsta Build With Us', url: origin() + '/build-with-us',
    });
  }, []);

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map(i => i.category)))], [items]);
  const filtered = items.filter(i => {
    if (!matchesType(i, projectType)) return false;
    if (category !== 'all' && i.category !== category) return false;
    if (search && !`${i.name} ${i.brand} ${i.supplier}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const quote = (item) =>
    whatsappLink(DESK_PHONE, `Hi, I'd like a quote for "${item.name}" (${item.brand}) on PropertyInsta — Build With Us.`);

  return (
    <div className="ig-bwu">
      {/* Hero */}
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🔨 Build With Us</span>
        <h1>Source materials &amp; hardware for your dream home</h1>
        <p>Cement, steel, tiles, paints, plumbing, electrical &amp; more — from trusted suppliers, at the best rates.</p>
        <div className="ig-bwu-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search material, brand or supplier…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* What are you building? — project type */}
      <div className="ig-bwu-segments">
        <button className={`ig-bwu-seg ${projectType === 'all' ? 'active' : ''}`} onClick={() => setProjectType('all')}>
          <span className="ig-bwu-seg-icon">🧱</span><span>All Projects</span>
        </button>
        {PROJECT_TYPES.map(t => (
          <button key={t.key} className={`ig-bwu-seg ${projectType === t.key ? 'active' : ''}`} onClick={() => setProjectType(t.key)}>
            <span className="ig-bwu-seg-icon">{t.icon}</span><span>{t.key}</span>
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div className="ig-bwu-filters">
        {categories.map(c => (
          <button key={c} className={`ig-bwu-chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c === 'all' ? `All (${items.length})` : c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="ig-bwu-empty">No materials match your search.</div>
      ) : (
        <div className="ig-bwu-grid">
          {filtered.map(item => (
            <div key={item.id} className="ig-bwu-card">
              <div className="ig-bwu-card-img">
                <img src={item.image} alt={item.name} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
                <span className={`ig-bwu-stock ${STOCK_CLASS[item.stock] || ''}`}>{item.stock}</span>
              </div>
              <div className="ig-bwu-card-body">
                <span className="ig-bwu-cat">{item.category}</span>
                <h3>{item.name}</h3>
                <p className="ig-bwu-supplier">🚚 {item.supplier} · {item.brand}</p>
                <p className="ig-bwu-desc">{item.description}</p>
                <div className="ig-bwu-card-foot">
                  <div className="ig-bwu-price"><strong>{inr(item.price)}</strong><span> / {item.unit}</span></div>
                  <a className="ig-bwu-quote" href={quote(item)} target="_blank" rel="noopener noreferrer">Get Quote</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
