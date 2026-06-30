import { useState, useEffect, useMemo } from 'react';
import { buildMaterials, buildServices, buildDesigns, buildDesigners } from '../data';
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
const DESIGN_SCOPES = [
  { key: 'Interior', icon: '🛋️' },
  { key: 'Exterior', icon: '🏡' },
];
const typesOf = (item) => item.types || CATEGORY_TYPES[item.category] || [];
const matchesType = (item, type) => type === 'all' || typesOf(item).includes(type);
const CATEGORY_ORDER = Object.keys(CATEGORY_TYPES);
const BENEFITS = [
  { icon: '🏷️', title: 'Best Market Rates', text: 'Bulk pricing direct from suppliers.' },
  { icon: '✅', title: 'Verified Suppliers', text: 'Quality-checked, trusted brands.' },
  { icon: '🚚', title: 'Doorstep Delivery', text: 'On-site delivery across Gurgaon NCR.' },
  { icon: '🛠️', title: 'End-to-End Support', text: 'From foundation to finishing.' },
];

export default function BuildWithUs() {
  const [items, setItems] = useState(buildMaterials);
  const [services, setServices] = useState(buildServices);
  const [designs, setDesigns] = useState(buildDesigns);
  const [designers, setDesigners] = useState(buildDesigners);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [projectType, setProjectType] = useState('all');
  const [mode, setMode] = useState('materials'); // 'materials' | 'services' | 'design'
  const [serviceType, setServiceType] = useState('all');
  const [designScope, setDesignScope] = useState('all'); // 'all' | 'Interior' | 'Exterior'
  const [designZone, setDesignZone] = useState('all');
  const [designView, setDesignView] = useState('ideas'); // 'ideas' | 'designers'

  // Live catalogs from Supabase (admin-managed) override the static seeds when present.
  // Each table is optional — if it's missing we silently keep the bundled catalog.
  useEffect(() => {
    let cancelled = false;
    const load = async (table, setter) => {
      try {
        const { data, error } = await supabase.from(table).select('*').order('id');
        if (!cancelled && !error && Array.isArray(data) && data.length) setter(data);
      } catch { /* table missing — keep static catalog */ }
    };
    load('build_materials', setItems);
    load('build_services', setServices);
    load('build_designs', setDesigns);
    load('build_designers', setDesigners);
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

  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach(i => { (m[i.category] = m[i.category] || []).push(i); });
    return m;
  }, [filtered]);
  const groupedView = category === 'all';

  const renderCard = (item) => (
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
        <div className="ig-bwu-tags">
          {typesOf(item).map(t => <span key={t} className={`ig-bwu-tag t-${t.toLowerCase()}`}>{t}</span>)}
        </div>
        <div className="ig-bwu-card-foot">
          <div className="ig-bwu-price"><strong>{inr(item.price)}</strong><span> / {item.unit}</span></div>
          <a className="ig-bwu-quote" href={quote(item)} target="_blank" rel="noopener noreferrer">Get Quote</a>
        </div>
      </div>
    </div>
  );

  // ── Contractors & Services ──
  const professions = ['all', ...Array.from(new Set(services.map(s => s.profession)))];
  const filteredServices = services.filter(s => {
    if (serviceType !== 'all' && s.profession !== serviceType) return false;
    if (search && !`${s.name} ${s.profession} ${s.specialization} ${(s.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const hireLink = (s) =>
    whatsappLink(DESK_PHONE, `Hi, I'd like to hire ${s.name} (${s.profession}) via PropertyInsta — Build With Us.`);

  const renderService = (s) => (
    <div key={s.id} className="ig-bwu-svc">
      <div className="ig-bwu-svc-top">
        <img src={s.avatar} alt={s.name} className="ig-bwu-svc-avatar" loading="lazy" />
        <div className="ig-bwu-svc-id">
          <h3>{s.name}{s.verified && <span className="ig-bwu-svc-verified" title="Verified">✓</span>}</h3>
          <span className="ig-bwu-svc-role">{s.profession}</span>
        </div>
      </div>
      <p className="ig-bwu-svc-spec">{s.specialization}</p>
      <div className="ig-bwu-svc-stats">
        <span>⭐ {s.rating}</span><span>·</span><span>{s.projects} projects</span><span>·</span><span>{s.experience}</span>
      </div>
      <p className="ig-bwu-svc-loc">📍 {s.location}</p>
      <div className="ig-bwu-svc-tags">{(s.tags || []).map(t => <span key={t} className="ig-bwu-svc-tag">{t}</span>)}</div>
      <div className="ig-bwu-card-foot">
        <div className="ig-bwu-price"><span>from </span><strong>{s.price}</strong><span> {s.priceUnit}</span></div>
        <a className="ig-bwu-quote hire" href={hireLink(s)} target="_blank" rel="noopener noreferrer">Hire / Enquire</a>
      </div>
    </div>
  );

  // ── Interior & Exterior Design ──
  const designsByScope = designs.filter(d => designScope === 'all' || d.scope === designScope);
  const designZones = ['all', ...Array.from(new Set(designsByScope.map(d => d.zone)))];
  const filteredDesigns = designsByScope.filter(d => {
    if (designZone !== 'all' && d.zone !== designZone) return false;
    if (search && !`${d.title} ${d.style} ${d.zone} ${d.designer} ${(d.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const scopeIcon = (scope) => (DESIGN_SCOPES.find(s => s.key === scope)?.icon || '🎨');
  const bookLink = (d) =>
    whatsappLink(DESK_PHONE, `Hi, I'm interested in the "${d.title}" (${d.style} ${d.zone}) design via PropertyInsta — Build With Us.`);

  const renderDesign = (d) => (
    <div key={d.id} className="ig-bwu-card ig-bwu-design">
      <div className="ig-bwu-card-img">
        <img src={d.image} alt={d.title} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
        <span className={`ig-bwu-design-scope ${d.scope.toLowerCase()}`}>{scopeIcon(d.scope)} {d.scope}</span>
        <span className="ig-bwu-design-style">{d.style}</span>
      </div>
      <div className="ig-bwu-card-body">
        <span className="ig-bwu-cat">{d.zone}</span>
        <h3>{d.title}</h3>
        <p className="ig-bwu-supplier">🎨 {d.designer} · ⭐ {d.rating}</p>
        <p className="ig-bwu-desc">{d.description}</p>
        <div className="ig-bwu-tags">
          {(d.tags || []).map(t => <span key={t} className="ig-bwu-svc-tag">{t}</span>)}
          <span className="ig-bwu-svc-tag time">⏱ {d.timeline}</span>
        </div>
        <div className="ig-bwu-card-foot">
          <div className="ig-bwu-price"><span>from </span><strong>{inr(d.priceFrom)}</strong><span> {d.priceUnit}</span></div>
          <a className="ig-bwu-quote book" href={bookLink(d)} target="_blank" rel="noopener noreferrer">Book a Designer</a>
        </div>
      </div>
    </div>
  );

  // ── Hire a Designer directory ──
  const filteredDesigners = designers.filter(d => {
    if (designScope !== 'all' && !d.scope.includes(designScope)) return false;
    if (search && !`${d.name} ${d.role} ${d.bio} ${(d.styles || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const consultLink = (d) =>
    whatsappLink(DESK_PHONE, `Hi, I'd like to book a design consultation with ${d.name} (${d.role}) via PropertyInsta — Build With Us.`);

  const renderDesigner = (d) => (
    <div key={d.id} className="ig-bwu-svc ig-bwu-designer">
      <div className="ig-bwu-svc-top">
        <img src={d.avatar} alt={d.name} className="ig-bwu-svc-avatar" loading="lazy" />
        <div className="ig-bwu-svc-id">
          <h3>{d.name}{d.verified && <span className="ig-bwu-svc-verified" title="Verified">✓</span>}</h3>
          <span className="ig-bwu-svc-role">{d.role}</span>
        </div>
        <div className="ig-bwu-designer-scopes">
          {d.scope.map(s => <span key={s} className={`ig-bwu-design-scope ${s.toLowerCase()} sm`}>{scopeIcon(s)} {s}</span>)}
        </div>
      </div>
      <p className="ig-bwu-svc-spec">{d.bio}</p>
      <div className="ig-bwu-designer-portfolio">
        {(d.portfolio || []).slice(0, 3).map((src, i) => (
          <img key={i} src={src} alt={`${d.name} work ${i + 1}`} loading="lazy" onError={e => { e.target.style.visibility = 'hidden'; }} />
        ))}
      </div>
      <div className="ig-bwu-svc-stats">
        <span>⭐ {d.rating}</span><span>·</span><span>{d.projects} projects</span><span>·</span><span>{d.experience}</span>
      </div>
      <p className="ig-bwu-svc-loc">📍 {d.location}</p>
      <div className="ig-bwu-svc-tags">{(d.styles || []).map(s => <span key={s} className="ig-bwu-svc-tag">{s}</span>)}</div>
      <div className="ig-bwu-card-foot">
        <div className="ig-bwu-price"><span>from </span><strong>{d.price}</strong><span> {d.priceUnit}</span></div>
        <a className="ig-bwu-quote book" href={consultLink(d)} target="_blank" rel="noopener noreferrer">Book Consultation</a>
      </div>
    </div>
  );

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

      {/* Why Build With Us — benefits */}
      <div className="ig-bwu-benefits">
        {BENEFITS.map(b => (
          <div key={b.title} className="ig-bwu-benefit">
            <span className="ig-bwu-benefit-icon">{b.icon}</span>
            <div><strong>{b.title}</strong><span>{b.text}</span></div>
          </div>
        ))}
      </div>

      {/* Mode toggle — Materials vs Contractors & Services */}
      <div className="ig-bwu-modes">
        <button className={`ig-bwu-mode ${mode === 'materials' ? 'active' : ''}`} onClick={() => setMode('materials')}>
          🧱 Materials &amp; Hardware
        </button>
        <button className={`ig-bwu-mode ${mode === 'services' ? 'active' : ''}`} onClick={() => setMode('services')}>
          👷 Contractors &amp; Services
        </button>
        <button className={`ig-bwu-mode ${mode === 'design' ? 'active' : ''}`} onClick={() => setMode('design')}>
          🎨 Interior &amp; Exterior Design
        </button>
      </div>

      {mode === 'materials' ? (
        <>
          <div className="ig-bwu-toolbar-label">What are you building?</div>
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

          {/* Catalog — divided into category sections when browsing all */}
          {filtered.length === 0 ? (
            <div className="ig-bwu-empty">No materials match your search.</div>
          ) : groupedView ? (
            CATEGORY_ORDER.filter(c => grouped[c]?.length).map(c => (
              <section key={c} className="ig-bwu-section">
                <div className="ig-bwu-section-head">
                  <h2>{c}</h2>
                  <span className="ig-bwu-section-count">{grouped[c].length} item{grouped[c].length === 1 ? '' : 's'}</span>
                </div>
                <div className="ig-bwu-grid">{grouped[c].map(renderCard)}</div>
              </section>
            ))
          ) : (
            <div className="ig-bwu-grid">{filtered.map(renderCard)}</div>
          )}
        </>
      ) : mode === 'services' ? (
        <>
          <div className="ig-bwu-toolbar-label">Hire verified building professionals</div>
          <div className="ig-bwu-filters">
            {professions.map(p => (
              <button key={p} className={`ig-bwu-chip ${serviceType === p ? 'active' : ''}`} onClick={() => setServiceType(p)}>
                {p === 'all' ? `All Pros (${services.length})` : p}
              </button>
            ))}
          </div>
          {filteredServices.length === 0 ? (
            <div className="ig-bwu-empty">No professionals match your search.</div>
          ) : (
            <div className="ig-bwu-grid">{filteredServices.map(renderService)}</div>
          )}
        </>
      ) : (
        <>
          {/* Sub-tabs: Design Ideas vs Hire a Designer */}
          <div className="ig-bwu-subtabs">
            <button className={`ig-bwu-subtab ${designView === 'ideas' ? 'active' : ''}`} onClick={() => setDesignView('ideas')}>💡 Design Ideas</button>
            <button className={`ig-bwu-subtab ${designView === 'designers' ? 'active' : ''}`} onClick={() => setDesignView('designers')}>👩‍🎨 Hire a Designer</button>
          </div>
          {/* Interior vs Exterior (shared) */}
          <div className="ig-bwu-segments">
            <button className={`ig-bwu-seg ${designScope === 'all' ? 'active' : ''}`} onClick={() => { setDesignScope('all'); setDesignZone('all'); }}>
              <span className="ig-bwu-seg-icon">🎨</span><span>All</span>
            </button>
            {DESIGN_SCOPES.map(s => (
              <button key={s.key} className={`ig-bwu-seg ${designScope === s.key ? 'active' : ''}`} onClick={() => { setDesignScope(s.key); setDesignZone('all'); }}>
                <span className="ig-bwu-seg-icon">{s.icon}</span><span>{s.key}</span>
              </button>
            ))}
          </div>

          {designView === 'ideas' ? (
            <>
              {/* Zone filters */}
              <div className="ig-bwu-filters">
                {designZones.map(z => (
                  <button key={z} className={`ig-bwu-chip ${designZone === z ? 'active' : ''}`} onClick={() => setDesignZone(z)}>
                    {z === 'all' ? `All (${designsByScope.length})` : z}
                  </button>
                ))}
              </div>
              {filteredDesigns.length === 0 ? (
                <div className="ig-bwu-empty">No design ideas match your search.</div>
              ) : (
                <div className="ig-bwu-grid">{filteredDesigns.map(renderDesign)}</div>
              )}
            </>
          ) : (
            <>
              <div className="ig-bwu-toolbar-label">Book a verified interior &amp; exterior designer</div>
              {filteredDesigners.length === 0 ? (
                <div className="ig-bwu-empty">No designers match your search.</div>
              ) : (
                <div className="ig-bwu-grid">{filteredDesigners.map(renderDesigner)}</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
