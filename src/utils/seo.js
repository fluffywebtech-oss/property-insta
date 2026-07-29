// =============================================================================
// Lightweight SEO head manager for the SPA — updates <title>, meta description,
// Open Graph / Twitter tags, canonical link, and JSON-LD structured data per
// view. Googlebot renders JS, so these are picked up for indexing; the static
// tags in index.html cover non-JS social scrapers.
// =============================================================================

const SITE = {
  name: 'PropertyInsta',
  defaultTitle: 'PropertyInsta — Verified Properties, 3D Tours & Real-Estate Insights',
  defaultDesc:
    'India’s most visual property platform. Explore RERA-verified listings, 3D virtual tours, reels, AI recommendations and expert real-estate guides.',
  defaultImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop',
  twitter: '@propertyinsta',
};

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

function ensureMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function setSeo({ title, description, image, canonical, type = 'website', keywords, noindex = false } = {}) {
  if (typeof document === 'undefined') return;
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.defaultTitle;
  document.title = fullTitle;
  const desc = description || SITE.defaultDesc;
  const img = image || SITE.defaultImage;
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');

  ensureMeta('name', 'description', desc);
  if (keywords) ensureMeta('name', 'keywords', keywords);
  // Reset on every view so the flag doesn't leak from a noindex page to others.
  ensureMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
  ensureLink('canonical', url);

  ensureMeta('property', 'og:title', fullTitle);
  ensureMeta('property', 'og:description', desc);
  ensureMeta('property', 'og:type', type);
  ensureMeta('property', 'og:url', url);
  ensureMeta('property', 'og:image', img);
  ensureMeta('property', 'og:site_name', SITE.name);

  ensureMeta('name', 'twitter:card', 'summary_large_image');
  ensureMeta('name', 'twitter:title', fullTitle);
  ensureMeta('name', 'twitter:description', desc);
  ensureMeta('name', 'twitter:image', img);
}

export function setJsonLd(id, data) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function removeJsonLd(id) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

export { SITE, origin };
