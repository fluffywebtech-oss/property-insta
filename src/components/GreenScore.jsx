import { useState, useMemo, useEffect } from 'react';
import { setSeo, origin } from '../utils/seo';

const TARIFF = 8;          // ₹/kWh (indicative urban slab)
const GRID_CO2 = 0.71;     // kg CO₂ per kWh — Indian grid average
const TREE_CO2 = 20;       // kg CO₂ absorbed per tree per year

// Cooling-driven energy intensity by city climate.
const CITIES = [
  { id: 'gur', name: 'Gurgaon / Delhi NCR', f: 1.15 },
  { id: 'mum', name: 'Mumbai', f: 1.10 },
  { id: 'blr', name: 'Bengaluru', f: 0.85 },
  { id: 'hyd', name: 'Hyderabad', f: 1.05 },
  { id: 'che', name: 'Chennai', f: 1.15 },
  { id: 'kol', name: 'Kolkata', f: 1.10 },
  { id: 'pun', name: 'Pune', f: 0.95 },
  { id: 'ahm', name: 'Ahmedabad', f: 1.20 },
  { id: 'oth', name: 'Other', f: 1.00 },
];

const inr = (n) => {
  n = Math.round(Math.abs(n || 0));
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

function ScoreRing({ score, grade, tone }) {
  const R = 62, C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 160 160" className={`ig-green-ring ${tone}`}>
      <circle className="track" cx="80" cy="80" r={R} />
      <circle className="fill" cx="80" cy="80" r={R} strokeDasharray={`${(C * score) / 100} ${C}`} transform="rotate(-90 80 80)" />
      <text className="num" x="80" y="74">{score}</text>
      <text className="grade" x="80" y="102">{grade}</text>
    </svg>
  );
}

function Bar({ label, value, tone }) {
  return (
    <div className="ig-green-cat">
      <div className="ig-green-cat-top"><span>{label}</span><strong>{Math.round(value)}</strong></div>
      <div className="ig-green-cat-bar"><span className={tone} style={{ width: `${Math.max(4, value)}%` }} /></div>
    </div>
  );
}
const toneOf = (v) => (v >= 70 ? 'good' : v >= 45 ? 'ok' : 'poor');

export default function GreenScore() {
  const [area, setArea] = useState(1500);
  const [cityId, setCityId] = useState('gur');
  const [appliances, setAppliances] = useState('mixed');   // star5 | mixed | old
  const [solar, setSolar] = useState('none');              // full | partial | none
  const [vent, setVent] = useState('average');             // excellent | average | poor
  const [glazing, setGlazing] = useState('single');        // double | single
  const [rainwater, setRainwater] = useState('no');
  const [ev, setEv] = useState('no');
  const [greenCover, setGreenCover] = useState('some');    // lush | some | none
  const [waste, setWaste] = useState('no');

  useEffect(() => {
    setSeo({
      title: 'Green & Carbon Home Score | PropertyInsta',
      description: 'Rate any home’s sustainability — get a 0–100 green score, estimated annual energy cost and carbon footprint, and eco-upgrades that pay off. A first for Indian real estate.',
      canonical: origin() + '/green-score',
    });
  }, []);

  const city = CITIES.find(c => c.id === cityId) || CITIES[0];

  const r = useMemo(() => {
    // ── Category sub-scores (0–100) ──
    const applPts = appliances === 'star5' ? 92 : appliances === 'mixed' ? 60 : 28;
    const solarPts = solar === 'full' ? 100 : solar === 'partial' ? 62 : 20;
    const ventPts = vent === 'excellent' ? 90 : vent === 'average' ? 60 : 30;
    const glazPts = glazing === 'double' ? 85 : 45;
    const energyScore = applPts * 0.4 + solarPts * 0.3 + ventPts * 0.18 + glazPts * 0.12;
    const waterScore = rainwater === 'yes' ? 95 : 35;
    const mobilityScore = ev === 'yes' ? 95 : 40;
    const coverScore = greenCover === 'lush' ? 95 : greenCover === 'some' ? 60 : 25;
    const wasteScore = waste === 'yes' ? 95 : 35;

    const overall = Math.round(
      energyScore * 0.40 + waterScore * 0.15 + coverScore * 0.20 + mobilityScore * 0.10 + wasteScore * 0.15
    );

    const grade = overall >= 85 ? 'A+' : overall >= 70 ? 'A' : overall >= 55 ? 'B' : overall >= 40 ? 'C' : 'D';
    const tone = overall >= 70 ? 'good' : overall >= 45 ? 'ok' : 'poor';
    const label = overall >= 85 ? 'Net-zero ready' : overall >= 70 ? 'Green certified' : overall >= 55 ? 'Energy efficient' : overall >= 40 ? 'Average' : 'Needs upgrades';

    // ── Energy, cost & carbon ──
    const baseKwh = area * 3.2 * city.f;
    const applMult = appliances === 'star5' ? 0.75 : appliances === 'mixed' ? 1.0 : 1.3;
    const ventMult = vent === 'excellent' ? 0.85 : vent === 'average' ? 0.95 : 1.0;
    const glazMult = glazing === 'double' ? 0.9 : 1.0;
    const grossKwh = baseKwh * applMult * ventMult * glazMult;
    const solarOffset = solar === 'full' ? 0.45 : solar === 'partial' ? 0.22 : 0;
    const netKwh = grossKwh * (1 - solarOffset);

    const annualCost = netKwh * TARIFF;
    const carbonKg = netKwh * GRID_CO2;
    const carbonT = carbonKg / 1000;

    // Average (green-free) home of the same size, for comparison.
    const avgKwh = area * 3.2 * city.f * 1.3;
    const avgCost = avgKwh * TARIFF;
    const avgCarbonKg = avgKwh * GRID_CO2;
    const costSaved = Math.max(0, avgCost - annualCost);
    const carbonSavedKg = Math.max(0, avgCarbonKg - carbonKg);
    const vsAvgPct = avgCost > 0 ? Math.round((1 - annualCost / avgCost) * 100) : 0;
    const treesEquiv = Math.round(carbonSavedKg / TREE_CO2);

    // ── Recommendations for weak areas ──
    const recs = [];
    if (solar !== 'full') recs.push({ icon: '☀️', title: 'Add rooftop solar', desc: `Cut grid use ~${solar === 'partial' ? 20 : 40}% — save roughly ${inr(annualCost * (solar === 'partial' ? 0.2 : 0.35))}/yr.` });
    if (appliances !== 'star5') recs.push({ icon: '⭐', title: 'Switch to 5-star appliances', desc: `BEE 5-star ACs, fridge & fans can trim ${appliances === 'old' ? 25 : 15}% off your bill.` });
    if (rainwater !== 'yes') recs.push({ icon: '💧', title: 'Rainwater harvesting + low-flow fittings', desc: 'Cut mains-water use and recharge groundwater.' });
    if (glazing !== 'double') recs.push({ icon: '🪟', title: 'Double-glazed windows', desc: 'Less heat gain means lower cooling load year-round.' });
    if (ev !== 'yes') recs.push({ icon: '🔌', title: 'Add an EV charging point', desc: 'Future-proof the home and enable cleaner mobility.' });
    if (waste !== 'yes') recs.push({ icon: '♻️', title: 'Segregate waste & compost', desc: 'Divert wet waste from landfill and make free compost.' });

    return { overall, grade, tone, label, energyScore, waterScore, coverScore, mobilityScore, wasteScore, annualCost, carbonT, vsAvgPct, treesEquiv, costSaved, recs: recs.slice(0, 4) };
  }, [area, city, appliances, solar, vent, glazing, rainwater, ev, greenCover, waste]);

  return (
    <div className="ig-bwu ig-loan ig-green">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🌿 Green Score</span>
        <h1>How green is this home?</h1>
        <p>Rate any home’s sustainability, see its real energy cost &amp; carbon footprint, and find upgrades that pay for themselves — a first for Indian real estate.</p>
      </div>

      <div className="ig-loan-calc">
        <div className="ig-loan-inputs">
          <div className="ig-loan-field">
            <div className="ig-loan-field-top"><label>Built-up area</label><strong>{area.toLocaleString('en-IN')} sq.ft</strong></div>
            <input type="range" min={400} max={6000} step={50} value={area} onChange={e => setArea(+e.target.value)} />
            <div className="ig-loan-scale"><span>400</span><span>6,000</span></div>
          </div>
          <div className="ig-green-selects">
            <div className="ig-loan-input"><label>City</label>
              <select value={cityId} onChange={e => setCityId(e.target.value)}>{CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="ig-loan-input"><label>Appliances</label>
              <select value={appliances} onChange={e => setAppliances(e.target.value)}>
                <option value="star5">Mostly 5-star (BEE)</option><option value="mixed">Mixed</option><option value="old">Old / inefficient</option>
              </select>
            </div>
            <div className="ig-loan-input"><label>Rooftop solar</label>
              <select value={solar} onChange={e => setSolar(e.target.value)}>
                <option value="full">Full</option><option value="partial">Partial</option><option value="none">None</option>
              </select>
            </div>
            <div className="ig-loan-input"><label>Light &amp; ventilation</label>
              <select value={vent} onChange={e => setVent(e.target.value)}>
                <option value="excellent">Excellent</option><option value="average">Average</option><option value="poor">Poor</option>
              </select>
            </div>
            <div className="ig-loan-input"><label>Windows</label>
              <select value={glazing} onChange={e => setGlazing(e.target.value)}>
                <option value="double">Double-glazed</option><option value="single">Single-glazed</option>
              </select>
            </div>
            <div className="ig-loan-input"><label>Green cover nearby</label>
              <select value={greenCover} onChange={e => setGreenCover(e.target.value)}>
                <option value="lush">Lush</option><option value="some">Some</option><option value="none">None</option>
              </select>
            </div>
            <div className="ig-loan-input"><label>Rainwater harvesting</label>
              <select value={rainwater} onChange={e => setRainwater(e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select>
            </div>
            <div className="ig-loan-input"><label>EV charging ready</label>
              <select value={ev} onChange={e => setEv(e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select>
            </div>
            <div className="ig-loan-input"><label>Waste segregation</label>
              <select value={waste} onChange={e => setWaste(e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select>
            </div>
          </div>
        </div>

        <div className="ig-loan-results">
          <div className={`ig-green-verdict ${r.tone}`}>
            <ScoreRing score={r.overall} grade={r.grade} tone={r.tone} />
            <div className="ig-green-verdict-txt">
              <span className="ig-green-grade-lbl">Green Score</span>
              <h2>{r.label}</h2>
              <p>Grade <strong>{r.grade}</strong> · {r.vsAvgPct > 0 ? `${r.vsAvgPct}% lower running cost than an average home` : 'similar to an average home'}</p>
            </div>
          </div>

          <div className="ig-green-eco">
            <div><span>Annual energy cost</span><strong>{inr(r.annualCost)}</strong></div>
            <div><span>Carbon footprint</span><strong>{r.carbonT.toFixed(1)} t CO₂/yr</strong></div>
            <div><span>You save yearly</span><strong>{inr(r.costSaved)}</strong></div>
            <div><span>≈ Trees’ worth of CO₂</span><strong>🌳 {r.treesEquiv}</strong></div>
          </div>

          <div className="ig-green-cats">
            <Bar label="Energy efficiency" value={r.energyScore} tone={toneOf(r.energyScore)} />
            <Bar label="Water" value={r.waterScore} tone={toneOf(r.waterScore)} />
            <Bar label="Green surroundings" value={r.coverScore} tone={toneOf(r.coverScore)} />
            <Bar label="Clean mobility" value={r.mobilityScore} tone={toneOf(r.mobilityScore)} />
            <Bar label="Waste" value={r.wasteScore} tone={toneOf(r.wasteScore)} />
          </div>

          <p className="ig-loan-disclaimer">Indicative estimate from typical Indian usage, an {GRID_CO2} kg CO₂/kWh grid factor and ₹{TARIFF}/kWh tariff. Actual bills vary with usage, tariff slab and appliances. Not a certified energy audit.</p>
        </div>
      </div>

      {r.recs.length > 0 && (
        <section className="ig-green-recs-wrap">
          <h2>Upgrades that pay off</h2>
          <div className="ig-green-recs">
            {r.recs.map(rec => (
              <div key={rec.title} className="ig-green-rec">
                <span className="ig-green-rec-ico">{rec.icon}</span>
                <div><strong>{rec.title}</strong><p>{rec.desc}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
