import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp, deriveCity } from '../context/AppContext';
import { formatPriceIndian } from '../data';

// =============================================================================
// PropertyInsta Map page — full-bleed 3D-first showcase (Zillow-style)
// Single MapLibre map. Real 3D buildings extruded from OpenFreeMap vector tiles
// (free, no API key). 2D and Satellite are alternate styles via the same map.
// =============================================================================

// City centers — fallback for listings with missing/garbage coords.
const CITY_CENTERS = {
  Gurgaon: [28.4595, 77.0266], Delhi: [28.6139, 77.2090], Noida: [28.5355, 77.3910],
  'Greater Noida': [28.4744, 77.5040], Ghaziabad: [28.6692, 77.4538], Faridabad: [28.4089, 77.3178],
  Mumbai: [19.0760, 72.8777], 'Navi Mumbai': [19.0330, 73.0297], Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.3850, 78.4867], Pune: [18.5204, 73.8567], Ahmedabad: [23.0225, 72.5714],
  Kolkata: [22.5726, 88.3639], Chandigarh: [30.7333, 76.7794], Lucknow: [26.8467, 80.9462],
  Ludhiana: [30.9010, 75.8573], Indore: [22.7196, 75.8577], Vrindavan: [27.5650, 77.6593],
};

// Geocoded localities (OpenStreetMap Nominatim) — keyed by listing `location`.
const LOCALITY_COORDS = {
  "Bagalur, North Bangalore": [13.00799, 77.61847], "Bandra Kurla Complex, Mumbai": [19.06066, 72.85468],
  "Bannerghatta Road, Bangalore": [12.94304, 77.60290], "Beta II, Greater Noida": [28.48487, 77.51346],
  "Budigere Cross, East Bangalore": [13.04621, 77.75041], "Connaught Place, New Delhi": [28.63140, 77.21938],
  "Hazratganj, Lucknow": [26.84753, 80.94320], "Jagatpur, Ahmedabad": [23.09916, 72.55170],
  "Mahalaxmi, Mumbai": [19.10522, 72.82816], "Mattewara, Ludhiana": [30.98025, 75.97610],
  "Matunga, Mumbai": [19.03148, 72.84685], "New Chandigarh": [30.73525, 76.79061],
  "Nipania, Indore": [22.75576, 75.92887], "Okhla, New Delhi": [28.62506, 77.21728],
  "Pakhowal Road, Ludhiana": [30.87485, 75.81573], "Panvel, Navi Mumbai": [19.06916, 72.99239],
  "Rajendra Nagar, Hyderabad": [17.32003, 78.40201],
  "Sector 102, Dwarka Expressway": [28.47549, 76.97117], "Sector 104, Dwarka Expressway": [28.47953, 76.99372],
  "Sector 106, Dwarka Expressway": [28.50608, 76.99678], "Sector 106, Dwarka Expressway, Gurgaon": [28.50608, 76.99678],
  "Sector 108, Dwarka Expressway": [28.51290, 76.98236], "Sector 109, Dwarka Expressway": [28.51092, 77.00660],
  "Sector 111, Dwarka Expressway": [28.52228, 77.03362], "Sector 112, Dwarka Expressway": [28.52034, 77.01886],
  "Sector 113, Dwarka Expressway": [28.52866, 77.02503], "Sector 19B, Dwarka, New Delhi": [28.57187, 77.04986],
  "Sector 36A, Dwarka Expressway": [28.42023, 76.97200], "Sector 37C, Dwarka Expressway": [28.44891, 76.98805],
  "Sector 37D, Dwarka Expressway": [28.44800, 76.96977], "Sector 42, Golf Course Road": [28.45590, 77.10848],
  "Sector 43, Gurgaon": [28.45487, 77.08589], "Sector 47, Sohna Road": [28.42516, 77.04751],
  "Sector 48, Southern Peripheral Road": [28.41049, 77.03946],
  "Sector 49, Golf Course Extension / SPR": [28.41289, 77.04984], "Sector 49, Southern Peripheral Road": [28.41289, 77.04984],
  "Sector 54, Golf Course Road": [28.44161, 77.11187], "Sector 54, Golf Course Road, Gurgaon": [28.44161, 77.11187],
  "Sector 59, Golf Course Extension Road": [28.40302, 77.10667], "Sector 60, Golf Course Extension Road": [28.39856, 77.09783],
  "Sector 63, Golf Course Extension Road": [28.39645, 77.08650], "Sector 63A, Golf Course Extension Road": [28.40823, 76.96302],
  "Sector 65, Golf Course Extension Road": [28.40466, 77.06905], "Sector 66, Golf Course Extension Road": [28.39743, 77.05388],
  "Sector 68, Golf Course Extension Road": [28.38890, 77.04599], "Sector 71, Southern Peripheral Road": [28.40646, 77.02331],
  "Sector 72, Southern Peripheral Road": [28.41593, 77.02908], "Sector 76 & 77, SPR / New Gurgaon": [28.39101, 76.99002],
  "Sector 76, Southern Peripheral Road": [28.39101, 76.99002], "Sector 77, Southern Peripheral Road": [28.38323, 76.98256],
  "Sector 79, Faridabad": [28.38087, 77.35739], "Sector 79, New Gurgaon": [28.43427, 76.99929],
  "Sector 80, New Gurgaon": [28.37022, 76.96112], "Sector 81, New Gurgaon": [28.38736, 76.94758],
  "Sector 82 Gurgaon": [28.39311, 76.95888], "Sector 82, New Gurgaon": [28.39311, 76.95888],
  "Sector 85, New Gurgaon": [28.40365, 76.95314], "Sector 86, Faridabad": [28.40682, 77.34253],
  "Sector 86, New Gurgaon": [28.39812, 76.94113], "Sector 88, New Gurgaon": [28.42196, 76.95681],
  "Sector 88A, New Gurgaon": [28.43379, 76.95394], "Sector 89, Gurgaon": [28.41845, 76.94576],
  "Sector 89A, New Gurgaon": [28.50608, 76.99678], "Sector 92, New Gurgaon": [28.40890, 76.91552],
  "Sodepur, Kolkata": [22.69993, 88.37994], "Sultanpur Road, Lucknow": [26.77386, 81.07687],
  "Vrindavan, Mathura": [27.57537, 77.69380], "Whitefield, Bangalore": [12.99574, 77.75795],
};

const inIndia = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) &&
  lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98;

function coordsFor(p) {
  const loc = (p.location || '').trim();
  if (LOCALITY_COORDS[loc]) return LOCALITY_COORDS[loc];
  const lat = Number(p.lat), lng = Number(p.lng);
  if (inIndia(lat, lng)) return [lat, lng];
  return CITY_CENTERS[p.city || deriveCity(p.location || '')] || null;
}

// MapLibre GL + OpenFreeMap (3D, free, no API key)
const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
const MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const STYLES = {
  '3d':       'https://tiles.openfreemap.org/styles/liberty',
  map:        'https://tiles.openfreemap.org/styles/positron',
  satellite:  'https://tiles.openfreemap.org/styles/liberty', // fallback; we overlay raster
};
const SAT_RASTER = {
  type: 'raster',
  tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
  tileSize: 256,
  attribution: 'Tiles © Esri',
};

function loadMapLibre() {
  return new Promise((resolve, reject) => {
    if (window.maplibregl) return resolve(window.maplibregl);
    if (!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = MAPLIBRE_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${MAPLIBRE_JS}"]`);
    if (existing) { existing.addEventListener('load', () => resolve(window.maplibregl)); if (window.maplibregl) resolve(window.maplibregl); return; }
    const s = document.createElement('script'); s.src = MAPLIBRE_JS; s.async = true;
    s.onload = () => resolve(window.maplibregl); s.onerror = reject;
    document.body.appendChild(s);
  });
}

function priceShort(price) {
  if (!price) return '₹—';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(price >= 100000000 ? 0 : 1)}Cr`;
  if (price >= 100000) return `₹${Math.round(price / 100000)}L`;
  return `₹${price}`;
}
function priceTier(price) {
  if (!price) return 'mid';
  if (price < 5000000) return 'budget';
  if (price < 20000000) return 'mid';
  if (price < 50000000) return 'premium';
  return 'luxury';
}

const PRICE_LEGEND = [
  { tier: 'budget', label: 'Under ₹50L' },
  { tier: 'mid', label: '₹50L–2Cr' },
  { tier: 'premium', label: '₹2–5Cr' },
  { tier: 'luxury', label: '₹5Cr+' },
];

// ============================================================================
export default function MapView() {
  const { allProperties, addRecentView, openProperty, savedIds, toggleSave } = useApp();

  // ---- View state ----
  const [styleKey, setStyleKey] = useState('3d');        // '3d' | 'map' | 'satellite'
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');   // all | luxury | affordable | Apartment | Villa | Commercial
  const [sortBy, setSortBy] = useState('relevance');
  const [selected, setSelected] = useState(null);
  const [areaBounds, setAreaBounds] = useState(null);
  const [mapMoved, setMapMoved] = useState(false);

  // ---- Map refs ----
  const mapEl = useRef(null);
  const mapObj = useRef(null);
  const markers = useRef({});
  const styleReady = useRef(false);
  const allBoundsRef = useRef(null);
  const areaRef = useRef(null); areaRef.current = areaBounds;

  // ---- Filtered + sorted list ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = allProperties.filter(p => {
      if (typeFilter === 'luxury' && !(p.price >= 10000000)) return false;
      if (typeFilter === 'affordable' && !(p.price < 5000000)) return false;
      if (['Apartment', 'Villa', 'Commercial'].includes(typeFilter) && p.type !== typeFilter) return false;
      if (q) {
        const hay = `${p.title || ''} ${p.location || ''} ${p.city || ''} ${p.builder || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (areaBounds) {
        const ll = coordsFor(p);
        if (!ll || ll[0] < areaBounds.s || ll[0] > areaBounds.n || ll[1] < areaBounds.w || ll[1] > areaBounds.e) return false;
      }
      return true;
    });
    if (sortBy === 'price_asc') r = [...r].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price_desc') r = [...r].sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'area_desc') r = [...r].sort((a, b) => (b.area || 0) - (a.area || 0));
    return r;
  }, [allProperties, typeFilter, search, areaBounds, sortBy]);

  const withCoords = useMemo(
    () => filtered.map(p => ({ p, ll: coordsFor(p) })).filter(x => x.ll),
    [filtered]
  );

  const select = useCallback((p) => { setSelected(p); addRecentView(p.id); }, [addRecentView]);

  // ---- 3D buildings layer helper ----
  const addBuildingsLayer = useCallback(() => {
    const map = mapObj.current;
    if (!map) return;
    if (map.getLayer('3d-buildings')) return;
    if (!map.getSource('openmaptiles')) return; // satellite has no vector source
    const layers = map.getStyle().layers || [];
    const labelId = layers.find(l => l.type === 'symbol' && l.layout?.['text-field'])?.id;
    map.addLayer({
      id: '3d-buildings',
      source: 'openmaptiles',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8],
          0, '#dde4ee', 30, '#aebac9', 80, '#7b8aa3', 200, '#3d4d6b'],
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'],
          13, 0, 13.5, ['coalesce', ['get', 'render_height'], 6]],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.94,
      },
    }, labelId);
  }, []);

  // ---- Render price markers ----
  const renderMarkers = useCallback((maplibregl) => {
    const map = mapObj.current;
    if (!map || !maplibregl) return;
    Object.values(markers.current).forEach(m => m.remove());
    markers.current = {};
    const seen = {};
    const bounds = new maplibregl.LngLatBounds();
    let any = false;
    withCoords.forEach(({ p, ll }) => {
      let [lat, lng] = ll;
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      const n = seen[key] || 0; seen[key] = n + 1;
      if (n > 0) {
        const ring = Math.ceil(n / 6);
        const ang = (n % 6) * (Math.PI / 3) + ring;
        lat += ring * 0.0035 * Math.cos(ang);
        lng += ring * 0.0035 * Math.sin(ang);
      }
      const el = document.createElement('div');
      el.className = `pi-pin tier-${priceTier(p.price)}`;
      el.dataset.id = String(p.id);
      el.innerHTML = `<span class="pi-pin-label">${priceShort(p.price)}</span>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); select(p); });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat]).addTo(map);
      markers.current[p.id] = marker;
      bounds.extend([lng, lat]); any = true;
    });
    allBoundsRef.current = any ? bounds : null;
    if (any && !areaRef.current && !selected) {
      map.fitBounds(bounds, { padding: { top: 80, bottom: 80, left: 80, right: 440 }, maxZoom: 12, duration: 600 });
    }
  }, [withCoords, select, selected]);

  // ---- Map init (runs once) ----
  useEffect(() => {
    let cancelled = false;
    loadMapLibre().then((maplibregl) => {
      if (cancelled || !mapEl.current || mapObj.current) return;
      const map = new maplibregl.Map({
        container: mapEl.current,
        style: STYLES['3d'],
        center: [78.6, 22.9],
        zoom: 4.4,
        pitch: 0,        // start flat so markers project correctly across the canvas
        bearing: 0,
        antialias: true,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.on('load', () => {
        styleReady.current = true;
        map.resize();
        addBuildingsLayer();
        renderMarkers(maplibregl);
      });
      // Belt-and-braces: resize again after the parent layout settles, then
      // re-fit to all markers so they sit inside the now-correct canvas
      // (otherwise MapLibre's stale projection leaves them off-screen).
      setTimeout(() => {
        try {
          map.resize();
          renderMarkers(maplibregl);
          if (allBoundsRef.current) {
            map.fitBounds(allBoundsRef.current, { padding: { top: 100, bottom: 80, left: 80, right: 440 }, maxZoom: 11, duration: 0 });
          }
        } catch {}
      }, 200);
      setTimeout(() => { try { map.resize(); } catch {} }, 700);
      map.on('moveend', () => setMapMoved(true));
      map.on('click', () => setSelected(null));
      mapObj.current = map;
    });
    return () => {
      cancelled = true;
      if (mapObj.current) { try { mapObj.current.remove(); } catch {} mapObj.current = null; markers.current = {}; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Re-render markers when filter changes ----
  useEffect(() => {
    if (window.maplibregl && mapObj.current && styleReady.current) renderMarkers(window.maplibregl);
  }, [renderMarkers]);

  // ---- Style switch (3D / Map / Satellite) ----
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    styleReady.current = false;
    if (styleKey === 'satellite') {
      // Build a minimal satellite style on the fly
      map.setStyle({ version: 8, sources: { sat: SAT_RASTER }, layers: [{ id: 'sat', type: 'raster', source: 'sat' }] });
    } else {
      map.setStyle(STYLES[styleKey]);
    }
    map.once('style.load', () => {
      styleReady.current = true;
      if (styleKey === '3d') addBuildingsLayer();
      // tilt: 3D = 55°, others flat
      map.easeTo({ pitch: styleKey === '3d' ? 55 : 0, bearing: styleKey === '3d' ? -14 : 0, duration: 600 });
      if (window.maplibregl) renderMarkers(window.maplibregl);
    });
  }, [styleKey, addBuildingsLayer, renderMarkers]);

  // ---- Fly to selection + highlight matching marker ----
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    Object.entries(markers.current).forEach(([id, m]) => {
      const el = m.getElement && m.getElement();
      if (el) el.classList.toggle('active', String(id) === String(selected?.id));
    });
    if (!selected) return;
    const mk = markers.current[selected.id];
    const target = mk ? mk.getLngLat() : null;
    const center = target ? [target.lng, target.lat] : (() => { const ll = coordsFor(selected); return ll ? [ll[1], ll[0]] : null; })();
    if (center) map.flyTo({ center, zoom: 16.5, pitch: styleKey === '3d' ? 60 : 0, bearing: styleKey === '3d' ? -17 : 0, duration: 1200 });
  }, [selected, styleKey]);

  // ---- Hover sync list ↔ marker ----
  const hoverMarker = useCallback((id, on) => {
    const m = markers.current[id];
    const el = m && m.getElement && m.getElement();
    if (el) { el.classList.toggle('hover', on); if (on) el.style.zIndex = '1001'; }
  }, []);

  // ---- Map actions ----
  const resetView = useCallback(() => {
    setSelected(null); setAreaBounds(null); setMapMoved(false);
    const map = mapObj.current; if (!map) return;
    if (allBoundsRef.current) map.fitBounds(allBoundsRef.current, { padding: { top: 80, bottom: 80, left: 80, right: 440 }, maxZoom: 12, duration: 700 });
    else map.flyTo({ center: [78.6, 22.9], zoom: 4.4, pitch: styleKey === '3d' ? 55 : 0, bearing: styleKey === '3d' ? -14 : 0 });
  }, [styleKey]);

  const searchThisArea = useCallback(() => {
    const map = mapObj.current; if (!map) return;
    const b = map.getBounds();
    setAreaBounds({ n: b.getNorth(), s: b.getSouth(), e: b.getEast(), w: b.getWest() });
    setMapMoved(false);
  }, []);

  // =========================================================================
  // RENDER — full-bleed map, floating side drawer, floating top controls
  // =========================================================================
  return (
    <div className="pi-map-page">
      {/* Full-bleed 3D map */}
      <div ref={mapEl} className="pi-map-canvas" />

      {/* Top floating brand + filter bar */}
      <div className="pi-map-topbar">
        <h1 className="pi-map-title">🏙️ Property Map <span>· {filtered.length} homes</span></h1>
        <div className="pi-map-searchbox">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city, locality, project…" />
          {search && <button onClick={() => setSearch('')} title="Clear">✕</button>}
        </div>
        <select className="pi-map-typesel" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="luxury">Luxury ₹1Cr+</option>
          <option value="affordable">Under ₹50L</option>
          <option value="Apartment">Apartments</option>
          <option value="Villa">Villas</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      {/* Floating view-mode switcher (3D headline) */}
      <div className="pi-map-modes">
        <button className={styleKey === '3d' ? 'active' : ''} onClick={() => setStyleKey('3d')} title="Real 3D buildings">
          <span className="pi-mode-icon">🏙️</span> 3D
        </button>
        <button className={styleKey === 'map' ? 'active' : ''} onClick={() => setStyleKey('map')}>
          <span className="pi-mode-icon">🗺️</span> Map
        </button>
        <button className={styleKey === 'satellite' ? 'active' : ''} onClick={() => setStyleKey('satellite')}>
          <span className="pi-mode-icon">🛰️</span> Satellite
        </button>
      </div>

      {/* Reset + drawer-toggle floating cluster */}
      <div className="pi-map-actions">
        <button className="pi-action-btn" onClick={resetView} title="Reset view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
        </button>
        <button className="pi-action-btn" onClick={() => setDrawerOpen(v => !v)} title={drawerOpen ? 'Hide list' : 'Show list'}>
          {drawerOpen ? '›' : '‹'}
        </button>
      </div>

      {/* Search this area / clear area */}
      {mapMoved && !areaBounds && (
        <button className="pi-area-btn" onClick={searchThisArea}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          Search this area
        </button>
      )}
      {areaBounds && (
        <button className="pi-area-btn clear" onClick={() => { setAreaBounds(null); setMapMoved(false); }}>✕ Clear area</button>
      )}

      {/* Price legend (subtle, bottom-left) */}
      <div className="pi-legend">
        {PRICE_LEGEND.map(l => (
          <span key={l.tier} className="pi-legend-item"><i className={`pi-dot tier-${l.tier}`} />{l.label}</span>
        ))}
      </div>

      {/* SELECTED PROPERTY — floating card centered above bottom */}
      {selected && (
        <div className="pi-selected-card">
          <button className="pi-selected-close" onClick={() => setSelected(null)} title="Close">✕</button>
          <img className="pi-selected-img" src={selected.media?.[0] || selected.thumbnail || ''} alt={selected.title} />
          <div className="pi-selected-info">
            <div className="pi-selected-head">
              <h3>{selected.title}</h3>
              <button
                className={`pi-selected-save ${savedIds?.includes(selected.id) ? 'saved' : ''}`}
                onClick={() => toggleSave(selected.id)}
                title={savedIds?.includes(selected.id) ? 'Saved' : 'Save'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={savedIds?.includes(selected.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
              </button>
            </div>
            <p className="pi-selected-loc">📍 {selected.location}</p>
            <div className="pi-selected-meta">
              <span className="pi-selected-price">{formatPriceIndian(selected.price)}</span>
              {selected.bedrooms && <span className="pi-selected-chip">{selected.bedrooms} BHK</span>}
              {selected.area && <span className="pi-selected-chip">{selected.area} sq.ft</span>}
              {selected.bathrooms && <span className="pi-selected-chip">{selected.bathrooms} Bath</span>}
            </div>
            <button
              className="pi-selected-cta"
              onClick={() => openProperty(selected.id)}
            >
              View full details →
            </button>
          </div>
        </div>
      )}

      {/* Floating LISTING DRAWER on the right */}
      <aside className={`pi-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="pi-drawer-head">
          <strong>{filtered.length}{areaBounds ? ' in this area' : ''}</strong>
          <select className="pi-drawer-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="relevance">Featured</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="area_desc">Largest area</option>
          </select>
        </div>
        <div className="pi-drawer-list">
          {filtered.length === 0 && (
            <div className="pi-drawer-empty">
              <span>🔍</span>
              <p>No properties{search ? ` match “${search}”` : ' in this area'}</p>
            </div>
          )}
          {filtered.map(p => (
            <div
              key={p.id}
              className={`pi-drawer-item ${selected?.id === p.id ? 'active' : ''}`}
              onClick={() => select(p)}
              onMouseEnter={() => hoverMarker(p.id, true)}
              onMouseLeave={() => hoverMarker(p.id, false)}
            >
              <img src={p.media?.[0] || p.thumbnail || ''} alt={p.title} loading="lazy" />
              <div className="pi-drawer-info">
                <div className="pi-drawer-title">{p.title}</div>
                <div className="pi-drawer-loc">📍 {p.location}</div>
                <div className="pi-drawer-meta">
                  <span className="pi-drawer-price">{formatPriceIndian(p.price)}</span>
                  {p.bedrooms && <span>{p.bedrooms} BHK</span>}
                  {p.area && <span>{p.area} sq.ft</span>}
                </div>
              </div>
              <button
                className={`pi-drawer-save ${savedIds?.includes(p.id) ? 'saved' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleSave(p.id); }}
                title="Save"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={savedIds?.includes(p.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
