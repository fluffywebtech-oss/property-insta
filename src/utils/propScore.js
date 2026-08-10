// ════════════════════════════════════════════════════════════════════
//  PropScore™ — PropertyInsta's AI Investment Score
//  A single 0–99 number blending five weighted pillars so buyers can
//  compare any two listings at a glance. Deterministic & explainable:
//  every property gets the same score every time, and the breakdown
//  shows exactly how it was reached.
// ════════════════════════════════════════════════════════════════════

// Builder reputation tiers (track record, delivery, construction quality)
const BUILDER_TIER = {
  'DLF Limited': 96,
  'Godrej Properties': 94,
  'Sobha Limited': 93,
  'Birla Estates': 92,
  'Max Estates': 90,
  'Emaar India': 89,
  'Central Park': 88,
  'M3M India': 87,
  'Elan Group': 87,
  'Smartworld Developers': 86,
  'Hero Realty': 85,
  'Puri Constructions': 84,
  'Signature Global': 83,
  'Ashiana Housing': 80,
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round = (n) => Math.round(n);

// Identify the growth corridor from a free-text location and score its
// appreciation potential (infra pipeline, demand, established premium).
function corridorOf(location = '') {
  const l = location.toLowerCase();
  if (l.includes('dwarka')) return { name: 'Dwarka Expressway', score: 92 };
  if (l.includes('golf course')) return { name: 'Golf Course', score: 90 };
  if (l.includes('spr') || l.includes('southern peripheral')) return { name: 'SPR', score: 86 };
  if (l.includes('sohna')) return { name: 'Sohna Road', score: 80 };
  if (l.includes('new gurgaon')) return { name: 'New Gurgaon', score: 82 };
  if (l.includes('noida')) return { name: 'Noida', score: 84 };
  if (l.includes('delhi')) return { name: 'Delhi', score: 80 };
  if (l.includes('gurgaon') || l.includes('gurugram')) return { name: 'Gurgaon', score: 78 };
  return { name: location.split(',').pop()?.trim() || 'Emerging', score: 76 };
}

// Estimated gross rental yield. Compact units rent harder per sqft;
// trophy penthouses/villas yield less. Heuristic but realistic for NCR.
function estimateYield({ price, sqft, type }) {
  if (!price || !sqft) return { yield: 0, monthlyRent: 0 };
  const t = String(type || '').toLowerCase();
  const rentPerSqftMonth =
    sqft < 1000 ? 42 :
    t.includes('penthouse') ? 28 :
    t.includes('villa') ? 26 :
    34;
  const monthlyRent = sqft * rentPerSqftMonth;
  const annualRent = monthlyRent * 12;
  return { yield: (annualRent / price) * 100, monthlyRent };
}

function gradeFor(score) {
  if (score >= 90) return { grade: 'A+', tag: 'Exceptional', color: '#15a34a' };
  if (score >= 83) return { grade: 'A', tag: 'Strong Buy', color: '#16a34a' };
  if (score >= 75) return { grade: 'B+', tag: 'Solid Pick', color: '#2563eb' };
  if (score >= 68) return { grade: 'B', tag: 'Fair Value', color: '#d97706' };
  return { grade: 'C', tag: 'Watchlist', color: '#ea580c' };
}

/**
 * Compute a PropScore from a RAW property record (call before the data.js
 * enrichment mangles amenities/neighborhood into display strings).
 *
 * Expects: { price, sqft, builder, location, type, possessionStatus,
 *            hot, amenities: string[], neighborhood: {walkScore, crimeRate} }
 */
export function computePropScore(p) {
  const pricePerSqft = p.sqft ? Math.round(p.price / p.sqft) : 0;

  // 1) Value for money — lower ₹/sqft scores higher
  const valueScore = round(clamp(100 - (pricePerSqft - 8000) / 350, 50, 96));

  // 2) Builder trust
  const builderScore = BUILDER_TIER[p.builder] ?? 75;

  // 3) Locality growth
  const corridor = corridorOf(p.location);
  const growthScore = corridor.score;

  // 4) Rental yield
  const { yield: grossYield, monthlyRent } = estimateYield(p);
  const yieldScore = round(clamp(40 + grossYield * 13, 50, 95));

  // 5) Lifestyle & infrastructure
  const amenityCount = Array.isArray(p.amenities) ? p.amenities.length : 0;
  const amenityScaled = (Math.min(amenityCount, 6) / 6) * 100;
  const walk = p.neighborhood?.walkScore ?? 55;
  const crimeScore = { 'Very Low': 95, Low: 82, Medium: 65, High: 45 }[p.neighborhood?.crimeRate] ?? 75;
  const lifestyleScore = round(0.4 * amenityScaled + 0.35 * walk + 0.25 * crimeScore);

  // Weighted blend
  const weights = { value: 22, builder: 24, growth: 20, yield: 16, lifestyle: 18 };
  let raw =
    valueScore * (weights.value / 100) +
    builderScore * (weights.builder / 100) +
    growthScore * (weights.growth / 100) +
    yieldScore * (weights.yield / 100) +
    lifestyleScore * (weights.lifestyle / 100);

  // Momentum nudge — early entry & demand
  if (p.possessionStatus === 'New Launch') raw += 1;
  if (p.hot) raw += 1.5;

  const score = round(clamp(raw, 40, 99));
  const { grade, tag, color } = gradeFor(score);

  return {
    score,
    grade,
    tag,
    color,
    pricePerSqft,
    rentalYield: Math.round(grossYield * 10) / 10,
    monthlyRent,
    summary: `${tag} — ${corridor.name} location with ${p.builder || 'a trusted'} pedigree and an estimated ${(Math.round(grossYield * 10) / 10).toFixed(1)}% rental yield.`,
    factors: [
      { key: 'value', label: 'Value for Money', score: valueScore, weight: weights.value, hint: `₹${pricePerSqft.toLocaleString('en-IN')}/sq.ft` },
      { key: 'builder', label: 'Builder Trust', score: builderScore, weight: weights.builder, hint: p.builder || 'Independent' },
      { key: 'growth', label: 'Locality Growth', score: growthScore, weight: weights.growth, hint: corridor.name },
      { key: 'yield', label: 'Rental Yield', score: yieldScore, weight: weights.yield, hint: `~${(Math.round(grossYield * 10) / 10).toFixed(1)}% p.a.` },
      { key: 'lifestyle', label: 'Lifestyle & Infra', score: lifestyleScore, weight: weights.lifestyle, hint: `${amenityCount} amenities` },
    ],
  };
}
