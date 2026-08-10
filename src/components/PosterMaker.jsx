import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatPriceIndian } from '../data';
import { setSeo, origin } from '../utils/seo';
import { useToast } from '../hooks/useToast';

const FORMATS = [
  { id: 'post', label: 'Post 1:1', w: 1080, h: 1080, hint: 'WhatsApp / Instagram' },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920, hint: 'Status / Reels cover' },
  { id: 'wide', label: 'Wide 1.91:1', w: 1200, h: 630, hint: 'Facebook / link preview' },
];

const THEMES = [
  { id: 'blue', label: 'Classic Blue', accent: '#2e6fe0', overlay: '10, 22, 48' },
  { id: 'sunset', label: 'Sunset', accent: '#ea6a0c', overlay: '46, 20, 4' },
  { id: 'luxe', label: 'Dark Luxe', accent: '#d4af37', overlay: '8, 8, 10' },
];

// Bump the unsplash thumb params up so the exported PNG stays sharp.
const hiRes = (url) => url ? url.replace(/w=\d+&h=\d+/, 'w=1400&h=1050') : url;

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const coverImg = (ctx, img, W, H) => {
  const s = Math.max(W / img.width, H / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
};

const wrapText = (ctx, text, maxWidth, maxLines) => {
  const words = (text || '').split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (lines.length === maxLines) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, '') + '…';
  return lines;
};

export default function PosterMaker() {
  const { allProperties } = useApp();
  const toast = useToast();
  const canvasRef = useRef(null);

  const [query, setQuery] = useState('');
  const [propId, setPropId] = useState(null);
  const [format, setFormat] = useState('post');
  const [theme, setTheme] = useState('blue');
  const [agentName, setAgentName] = useState('');
  const [phone, setPhone] = useState('');
  const [badge, setBadge] = useState('');
  const [showPrice, setShowPrice] = useState(true);

  useEffect(() => {
    setSeo({
      title: 'Listing Poster Maker | PropertyInsta',
      description: 'Turn any listing into a branded, share-ready poster for WhatsApp, Instagram or Facebook — pick a property, a style, and download the image free.',
      canonical: origin() + '/poster-maker',
    });
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const src = allProperties || [];
    if (!q) return src.slice(0, 40);
    return src.filter(p =>
      `${p.title} ${p.location} ${p.builder || ''}`.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [allProperties, query]);

  const prop = useMemo(() => (allProperties || []).find(p => p.id === propId) || null, [allProperties, propId]);

  // Prefill contact + badge whenever a property is chosen
  useEffect(() => {
    if (!prop) return;
    setAgentName(prop.agent?.name || '');
    setPhone(prop.agent?.phone || '');
    setBadge(prop.possessionStatus === 'New Launch' ? 'NEW LAUNCH' : prop.hot ? 'HOT PROPERTY' : prop.possessionStatus === 'Ready to Move' ? 'READY TO MOVE' : '');
  }, [propId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = FORMATS.find(f => f.id === format);
  const th = THEMES.find(t => t.id === theme);

  // Redraw the poster whenever anything changes
  useEffect(() => {
    if (!prop || !canvasRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    const { w: W, h: H } = fmt;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const s = Math.min(W, H) / 1080;   // scale unit
    const pad = 60 * s;
    const font = (weight, size) => `${weight} ${Math.round(size)}px "Plus Jakarta Sans", "Inter", sans-serif`;

    const draw = (img) => {
      if (cancelled) return;
      // Photo (or fallback wash)
      ctx.fillStyle = `rgb(${th.overlay})`;
      ctx.fillRect(0, 0, W, H);
      if (img) coverImg(ctx, img, W, H);

      // Top + bottom gradients for legibility
      const top = ctx.createLinearGradient(0, 0, 0, H * 0.22);
      top.addColorStop(0, 'rgba(0,0,0,0.5)'); top.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = top; ctx.fillRect(0, 0, W, H * 0.22);
      const grad = ctx.createLinearGradient(0, H * (format === 'story' ? 0.45 : 0.3), 0, H);
      grad.addColorStop(0, `rgba(${th.overlay},0)`);
      grad.addColorStop(0.55, `rgba(${th.overlay},0.82)`);
      grad.addColorStop(1, `rgba(${th.overlay},0.97)`);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Brand pill — top left
      ctx.font = font(800, 34 * s);
      const brand = '🏠 PropertyInsta';
      const bw = ctx.measureText(brand).width + 44 * s;
      roundRect(ctx, pad, pad, bw, 62 * s, 31 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.fill();
      ctx.fillStyle = '#1b4db1';
      ctx.textBaseline = 'middle';
      ctx.fillText(brand, pad + 22 * s, pad + 33 * s);

      // Badge — top right
      if (badge.trim()) {
        ctx.font = font(800, 28 * s);
        const t = badge.trim().toUpperCase();
        const tw = ctx.measureText(t).width + 44 * s;
        roundRect(ctx, W - pad - tw, pad, tw, 58 * s, 29 * s);
        ctx.fillStyle = th.accent; ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(t, W - pad - tw + 22 * s, pad + 31 * s);
      }

      // ── Bottom stack (drawn top-down from a computed origin) ──
      ctx.textBaseline = 'alphabetic';
      const priceSize = 92 * s, titleSize = 44 * s, lineGap = 14 * s;
      ctx.font = font(700, titleSize);
      const titleLines = wrapText(ctx, prop.title, W - pad * 2, 2);
      const chipsH = 64 * s, contactH = 66 * s, footH = 30 * s;
      const blockH = priceSize + lineGap + titleLines.length * (titleSize * 1.25) + 40 * s
        + lineGap + chipsH + 18 * s + contactH + 24 * s + footH;
      let y = H - pad - blockH + priceSize;

      // Price
      ctx.fillStyle = '#fff';
      ctx.font = font(800, priceSize);
      const priceText = showPrice ? formatPriceIndian(prop.price) : 'Price on Request';
      ctx.fillText(priceText, pad, y);
      const pw = ctx.measureText(priceText).width;
      // accent tick after price
      ctx.fillStyle = th.accent;
      roundRect(ctx, pad + pw + 26 * s, y - priceSize * 0.62, 14 * s, priceSize * 0.62, 7 * s);
      ctx.fill();

      // Title
      y += lineGap + titleSize;
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.font = font(700, titleSize);
      for (const line of titleLines) { ctx.fillText(line, pad, y); y += titleSize * 1.25; }

      // Location
      ctx.font = font(600, 34 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(`📍 ${prop.location}`, pad, y + 6 * s);
      y += 40 * s + lineGap;

      // Spec chips — DB rows use bedrooms/bathrooms/area, static uses beds/baths/sqft
      const beds = prop.beds ?? prop.bedrooms, baths = prop.baths ?? prop.bathrooms, sqft = prop.sqft ?? prop.area;
      const chips = [
        beds ? `${beds} BHK` : null,
        baths ? `${baths} Bath` : null,
        sqft ? `${(+sqft).toLocaleString('en-IN')} sqft` : null,
        prop.furnishing || null,
      ].filter(Boolean);
      let cx = pad;
      ctx.font = font(700, 30 * s);
      for (const c of chips) {
        const cw = ctx.measureText(c).width + 40 * s;
        if (cx + cw > W - pad) break;
        roundRect(ctx, cx, y, cw, chipsH * 0.82, 14 * s);
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2 * s; ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(c, cx + 20 * s, y + chipsH * 0.41);
        ctx.textBaseline = 'alphabetic';
        cx += cw + 14 * s;
      }
      y += chipsH + 18 * s;

      // Contact strip
      if (agentName.trim() || phone.trim()) {
        roundRect(ctx, pad, y, W - pad * 2, contactH, 16 * s);
        ctx.fillStyle = th.accent; ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = font(800, 32 * s);
        ctx.textBaseline = 'middle';
        const contact = `📞 ${phone.trim()}${agentName.trim() ? `   ·   ${agentName.trim()}` : ''}`;
        ctx.fillText(contact, pad + 24 * s, y + contactH / 2 + 1 * s, W - pad * 2 - 48 * s);
        ctx.textBaseline = 'alphabetic';
      }
      y += contactH + 24 * s;

      // Footer
      ctx.font = font(600, 24 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('Look · Visit · Book — propertyinsta.com', pad, y + 4 * s);
      if (prop.reraId) {
        const rera = `RERA: ${prop.reraId}`;
        ctx.fillText(rera, W - pad - ctx.measureText(rera).width, y + 4 * s);
      }
    };

    document.fonts.ready.then(() => {
      if (cancelled) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = hiRes(prop.images?.[0]);
    });
    return () => { cancelled = true; };
  }, [prop, fmt, th, agentName, phone, badge, showPrice, format]);

  const download = () => {
    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) { toast('Could not export — image blocked the download', 'error'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `propertyinsta-poster-${prop.id}-${format}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Poster downloaded — ready to share!');
      }, 'image/png');
    } catch {
      toast('Could not export — image blocked the download', 'error');
    }
  };

  const copyCaption = () => {
    const lines = [
      `🏠 ${prop.title}`,
      `💰 ${showPrice ? formatPriceIndian(prop.price) : 'Price on request'}`,
      `📍 ${prop.location}`,
      `🛏 ${prop.beds ?? prop.bedrooms} BHK · 🛁 ${prop.baths ?? prop.bathrooms} Bath · 📐 ${(+(prop.sqft ?? prop.area) || 0).toLocaleString('en-IN')} sqft`,
      phone.trim() ? `📞 ${phone.trim()}${agentName.trim() ? ` (${agentName.trim()})` : ''}` : null,
      '',
      'Seen on PropertyInsta — Look · Visit · Book',
    ].filter(l => l !== null);
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => toast('Caption copied — paste it with your poster!'))
      .catch(() => toast('Could not copy the caption', 'error'));
  };

  return (
    <div className="ig-bwu ig-poster">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🎨 Poster Maker</span>
        <h1>Turn any listing into a share-ready poster.</h1>
        <p>Pick a property, choose a size &amp; style, add your contact — download a branded image for WhatsApp, Instagram or Facebook in seconds.</p>
      </div>

      <div className="ig-poster-grid">
        <div className="ig-poster-controls">
          <div className="ig-poster-block">
            <h3>1 · Choose a property</h3>
            <input className="ig-poster-search" placeholder="Search by name, locality or builder…" value={query} onChange={e => setQuery(e.target.value)} />
            <div className="ig-poster-list">
              {list.map(p => (
                <button key={p.id} className={`ig-poster-item ${p.id === propId ? 'active' : ''}`} onClick={() => setPropId(p.id)}>
                  <img src={p.images?.[0]} alt="" loading="lazy" />
                  <span className="ig-poster-item-info">
                    <strong>{p.title}</strong>
                    <em>{p.location}</em>
                  </span>
                  <b>{formatPriceIndian(p.price)}</b>
                </button>
              ))}
              {list.length === 0 && <p className="ig-poster-none">No matches — try a different search.</p>}
            </div>
          </div>

          <div className="ig-poster-block">
            <h3>2 · Size &amp; style</h3>
            <div className="ig-poster-formats">
              {FORMATS.map(f => (
                <button key={f.id} className={`ig-poster-format ${format === f.id ? 'active' : ''}`} onClick={() => setFormat(f.id)}>
                  <strong>{f.label}</strong><em>{f.hint}</em>
                </button>
              ))}
            </div>
            <div className="ig-poster-themes">
              {THEMES.map(t => (
                <button key={t.id} className={`ig-poster-theme ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
                  <span style={{ background: t.accent }} />{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ig-poster-block">
            <h3>3 · Your details</h3>
            <div className="ig-agr-row2">
              <label className="ig-agr-field"><span>Name on poster</span><input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Your name" /></label>
              <label className="ig-agr-field"><span>Phone</span><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91-…" /></label>
            </div>
            <div className="ig-agr-row2">
              <label className="ig-agr-field"><span>Corner badge (optional)</span><input value={badge} onChange={e => setBadge(e.target.value)} placeholder="e.g. NEW LAUNCH" maxLength={22} /></label>
              <label className="ig-agr-field ig-poster-check">
                <span>Price</span>
                <button className={`ig-poster-toggle ${showPrice ? 'on' : ''}`} onClick={() => setShowPrice(v => !v)} type="button">
                  {showPrice ? 'Shown on poster' : 'Price on Request'}
                </button>
              </label>
            </div>
          </div>
        </div>

        <div className="ig-poster-preview">
          {!prop ? (
            <div className="ig-poster-empty">
              <span>🖼️</span>
              <h3>Your poster appears here</h3>
              <p>Pick a property from the list to generate it.</p>
            </div>
          ) : (
            <>
              <div className={`ig-poster-canvas-wrap ${format}`}>
                <canvas ref={canvasRef} />
              </div>
              <div className="ig-poster-actions">
                <button className="ig-poster-dl" onClick={download}>⬇️ Download PNG</button>
                <button className="ig-poster-cap" onClick={copyCaption}>💬 Copy WhatsApp caption</button>
              </div>
              <p className="ig-loan-disclaimer">Tip: on WhatsApp, send the poster as a photo and paste the caption — it stays crisp and tappable.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
