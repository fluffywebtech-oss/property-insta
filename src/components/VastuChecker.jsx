import { useState, useEffect, useMemo } from 'react';
import { setSeo, origin } from '../utils/seo';
import { useToast } from '../hooks/useToast';

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DIR_NAMES = {
  N: 'North', NE: 'North-East', E: 'East', SE: 'South-East',
  S: 'South', SW: 'South-West', W: 'West', NW: 'North-West',
};

// Classical vastu shastra placements, scored 0–100 per zone.
// Weights reflect how heavily each area counts in the overall score.
const AREAS = [
  {
    id: 'entrance', icon: '🚪', label: 'Main Entrance', weight: 20, dirs: true,
    question: 'Which direction does your main entrance face?',
    scores: { N: 85, NE: 100, E: 90, SE: 40, S: 30, SW: 10, W: 55, NW: 60 },
    remedy: 'Place a copper swastik or Vastu pyramid at the door, and keep the entrance bright, clutter-free and well-lit.',
  },
  {
    id: 'kitchen', icon: '🍳', label: 'Kitchen', weight: 15, dirs: true,
    question: 'Where is the kitchen located?',
    scores: { N: 35, NE: 10, E: 60, SE: 100, S: 55, SW: 25, W: 45, NW: 80 },
    remedy: 'If moving it isn’t possible, cook facing east, keep the stove and sink apart, and add red/orange accents in the south-east corner.',
  },
  {
    id: 'master', icon: '🛏️', label: 'Master Bedroom', weight: 14, dirs: true,
    question: 'Where is the master bedroom?',
    scores: { N: 45, NE: 15, E: 50, SE: 30, S: 80, SW: 100, W: 75, NW: 60 },
    remedy: 'Sleep with your head toward the south or west, avoid mirrors facing the bed, and prefer earthy tones.',
  },
  {
    id: 'pooja', icon: '🪔', label: 'Pooja Room', weight: 12, dirs: true,
    question: 'Where is the pooja room / altar?',
    scores: { N: 80, NE: 100, E: 90, SE: 30, S: 25, SW: 10, W: 45, NW: 50 },
    remedy: 'Shift the altar into the north-east zone of the room, keep it raised off the floor, and face east while praying.',
  },
  {
    id: 'toilet', icon: '🚽', label: 'Toilets', weight: 14, dirs: true,
    question: 'Where are the toilets / bathrooms?',
    scores: { N: 25, NE: 5, E: 30, SE: 50, S: 60, SW: 40, W: 80, NW: 100 },
    remedy: 'Keep toilet doors closed, run an exhaust fan, place a bowl of sea salt inside, and fix leaks quickly.',
  },
  {
    id: 'living', icon: '🛋️', label: 'Living Room', weight: 10, dirs: true,
    question: 'Where is the living room?',
    scores: { N: 90, NE: 100, E: 85, SE: 50, S: 45, SW: 35, W: 55, NW: 70 },
    remedy: 'Keep the north-east corner light and open, move heavy furniture to the south-west, and a mirror on the north wall helps.',
  },
  {
    id: 'shape', icon: '📐', label: 'Plot / Flat Shape', weight: 10,
    question: 'What is the shape of the plot or flat?',
    options: [
      { id: 'square', label: 'Square' },
      { id: 'rect', label: 'Rectangular' },
      { id: 'lshape', label: 'L-shaped' },
      { id: 'irregular', label: 'Irregular' },
    ],
    scores: { square: 100, rect: 85, lshape: 40, irregular: 25 },
    remedy: 'Square off missing corners with mirrors, lights or tall plants; a Vastu pyramid in the defect zone also helps.',
  },
  {
    id: 'doorview', icon: '👁️', label: 'Facing the Door', weight: 5,
    question: 'What directly faces your main door?',
    options: [
      { id: 'open', label: 'Open space / road along' },
      { id: 'wall', label: 'Wall or foyer inside' },
      { id: 'lift', label: 'Lift or staircase' },
      { id: 'tjunction', label: 'T-junction road' },
    ],
    scores: { open: 100, wall: 70, lift: 45, tjunction: 20 },
    remedy: 'Mount a convex mirror or an auspicious symbol above the door to deflect the negative axis of the obstruction.',
  },
];

const statusOf = (s) => (s >= 70 ? 'good' : s >= 40 ? 'ok' : 'poor');

// Interactive 8-direction compass for picking the entrance facing.
function Compass({ value, onChange }) {
  const cx = 110, cy = 110, rOut = 96, rIn = 36;
  const pt = (deg, rad) => [
    +(cx + rad * Math.sin((deg * Math.PI) / 180)).toFixed(2),
    +(cy - rad * Math.cos((deg * Math.PI) / 180)).toFixed(2),
  ];
  return (
    <svg viewBox="0 0 220 220" className="ig-vastu-compass" role="radiogroup" aria-label="Entrance direction">
      {DIRS.map((d, i) => {
        const a0 = i * 45 - 22.5, a1 = i * 45 + 22.5;
        const [x0, y0] = pt(a0, rOut), [x1, y1] = pt(a1, rOut);
        const [xi0, yi0] = pt(a0, rIn), [xi1, yi1] = pt(a1, rIn);
        const [lx, ly] = pt(i * 45, (rOut + rIn) / 2 + 6);
        return (
          <g
            key={d}
            className={`ig-vastu-wedge ${value === d ? 'sel' : ''}`}
            onClick={() => onChange(d)}
            role="radio"
            aria-checked={value === d}
            aria-label={DIR_NAMES[d]}
          >
            <path d={`M ${xi0} ${yi0} L ${x0} ${y0} A ${rOut} ${rOut} 0 0 1 ${x1} ${y1} L ${xi1} ${yi1} A ${rIn} ${rIn} 0 0 0 ${xi0} ${yi0} Z`}>
              <title>{DIR_NAMES[d]}</title>
            </path>
            <text x={lx} y={ly}>{d}</text>
          </g>
        );
      })}
      <text className="ig-vastu-compass-center" x={cx} y={cy}>🧭</text>
    </svg>
  );
}

function ScoreRing({ score, status }) {
  const R = 62, C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 160 160" className={`ig-vastu-ring ${status}`}>
      <circle className="track" cx="80" cy="80" r={R} />
      <circle
        className="fill" cx="80" cy="80" r={R}
        strokeDasharray={`${(C * score) / 100} ${C}`}
        transform="rotate(-90 80 80)"
      />
      <text className="num" x="80" y="84">{score}</text>
      <text className="lbl" x="80" y="106">/ 100</text>
    </svg>
  );
}

export default function VastuChecker() {
  const toast = useToast();
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    setSeo({
      title: 'Vastu Score Checker | PropertyInsta',
      description: 'Check how Vastu-friendly a home is in 2 minutes — entrance direction, kitchen, bedroom & more. Get a 0–100 Vastu score with simple remedies for weak zones.',
      canonical: origin() + '/vastu',
    });
  }, []);

  const pick = (areaId, optId) => setAnswers(prev => ({ ...prev, [areaId]: optId }));

  const { score, rows, answered } = useMemo(() => {
    let wSum = 0, total = 0;
    const rows = AREAS.map(a => {
      const sel = answers[a.id];
      const s = sel != null ? a.scores[sel] : null;
      if (s != null) { wSum += a.weight; total += s * a.weight; }
      return { ...a, sel, s };
    });
    return { score: wSum ? Math.round(total / wSum) : 0, rows, answered: rows.filter(r => r.s != null).length };
  }, [answers]);

  const verdict =
    score >= 85 ? { text: 'Excellent Vastu', emoji: '✨', status: 'good' } :
    score >= 70 ? { text: 'Good Vastu', emoji: '👍', status: 'good' } :
    score >= 50 ? { text: 'Average — a few fixes will help', emoji: '🛠️', status: 'ok' } :
    { text: 'Weak Vastu — remedies recommended', emoji: '⚠️', status: 'poor' };

  const weakRows = rows.filter(r => r.s != null && r.s < 70);

  const copyReport = () => {
    const lines = [
      `🧭 Vastu Score: ${score}/100 — ${verdict.text}`,
      '',
      ...rows.filter(r => r.s != null).map(r => {
        const val = r.dirs ? DIR_NAMES[r.sel] : r.options.find(o => o.id === r.sel)?.label;
        const mark = r.s >= 70 ? '✅' : r.s >= 40 ? '🟡' : '❌';
        return `${mark} ${r.label}: ${val}`;
      }),
      '',
      'Checked with the free Vastu Score Checker on PropertyInsta',
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => toast('Vastu report copied — share it anywhere!'))
      .catch(() => toast('Could not copy the report', 'error'));
  };

  return (
    <div className="ig-bwu ig-vastu">
      <div className="ig-bwu-hero">
        <span className="ig-bwu-eyebrow">🧭 Vastu Checker</span>
        <h1>How Vastu-friendly is your home?</h1>
        <p>Answer a few quick questions about the layout — entrance, kitchen, bedroom &amp; more — and get a 0–100 Vastu score with simple remedies for the weak zones.</p>
      </div>

      <div className="ig-vastu-grid">
        <div className="ig-vastu-inputs">
          <div className="ig-vastu-q ig-vastu-q-compass">
            <div className="ig-vastu-q-head">
              <span className="ig-vastu-q-icon">🚪</span>
              <div>
                <strong>Main Entrance</strong>
                <p>Which direction does your main entrance face? Tap the compass.</p>
              </div>
            </div>
            <Compass value={answers.entrance} onChange={d => pick('entrance', d)} />
            <div className="ig-vastu-compass-caption">
              {answers.entrance
                ? <>Entrance faces <strong>{DIR_NAMES[answers.entrance]}</strong></>
                : 'Stand inside the house looking out — that’s your facing direction.'}
            </div>
          </div>

          {AREAS.slice(1).map(a => (
            <div key={a.id} className="ig-vastu-q">
              <div className="ig-vastu-q-head">
                <span className="ig-vastu-q-icon">{a.icon}</span>
                <div>
                  <strong>{a.label}</strong>
                  <p>{a.question}</p>
                </div>
              </div>
              <div className="ig-vastu-chips">
                {(a.dirs ? DIRS.map(d => ({ id: d, label: DIR_NAMES[d] })) : a.options).map(o => (
                  <button
                    key={o.id}
                    className={`ig-vastu-chip ${answers[a.id] === o.id ? 'active' : ''}`}
                    onClick={() => pick(a.id, o.id)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ig-vastu-results">
          {answered === 0 ? (
            <div className="ig-vastu-empty">
              <span>🧭</span>
              <h3>Your score appears here</h3>
              <p>Start by tapping your entrance direction on the compass.</p>
            </div>
          ) : (
            <>
              <div className={`ig-vastu-verdict ${verdict.status}`}>
                <ScoreRing score={score} status={verdict.status} />
                <h2>{verdict.emoji} {verdict.text}</h2>
                <span className="ig-vastu-progress">
                  {answered < AREAS.length
                    ? `${answered}/${AREAS.length} answered — answer all for the full report`
                    : 'All zones checked'}
                </span>
              </div>

              <div className="ig-vastu-breakdown">
                {rows.map(r => (
                  <div key={r.id} className="ig-vastu-row">
                    <span className="ig-vastu-row-icon">{r.icon}</span>
                    <div className="ig-vastu-row-mid">
                      <div className="ig-vastu-row-top">
                        <span>{r.label}</span>
                        <em>{r.s == null ? '—' : (r.dirs ? DIR_NAMES[r.sel] : r.options.find(o => o.id === r.sel)?.label)}</em>
                      </div>
                      <div className="ig-vastu-row-bar">
                        {r.s != null && <span className={statusOf(r.s)} style={{ width: `${Math.max(6, r.s)}%` }} />}
                      </div>
                    </div>
                    <span className={`ig-vastu-dot ${r.s == null ? 'na' : statusOf(r.s)}`} />
                  </div>
                ))}
              </div>

              {weakRows.length > 0 && (
                <div className="ig-vastu-remedies">
                  <h4>🪄 Simple remedies</h4>
                  {weakRows.map(r => (
                    <div key={r.id} className="ig-vastu-remedy">
                      <span>{r.icon}</span>
                      <p><strong>{r.label}:</strong> {r.remedy}</p>
                    </div>
                  ))}
                </div>
              )}

              <button className="ig-vastu-share" onClick={copyReport}>
                📋 Copy my Vastu report
              </button>
            </>
          )}
          <p className="ig-loan-disclaimer">Based on classical Vastu Shastra conventions — shared for cultural &amp; informational interest, not a substitute for professional advice or a reason to reject a great home.</p>
        </div>
      </div>
    </div>
  );
}
