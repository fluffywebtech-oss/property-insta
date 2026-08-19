import { useState, useRef, useEffect, useMemo } from 'react';
import { useRole } from '../../context/RoleContext';
import { useApp, deriveCity } from '../../context/AppContext';
import { formatPriceIndian } from '../../data';

const ROLE_PROMPTS = {
  buyer: ['Best area to buy in Gurgaon under ₹1Cr?', 'Compare DLF vs Godrej projects', 'Is now a good time to buy or wait?', 'Expected appreciation on Sector 77?', 'What are the best villa projects?', 'How much home loan can I get on ₹15L salary?'],
  broker: ['How to generate more leads from 99acres?', 'Market trend in Golf Course Ext?', 'How to handle a price negotiation?', 'Which builder offers the best commission?', 'Top 5 trending properties to push?', 'How do I qualify a serious buyer?'],
  builder: ['How to improve my RERA compliance score?', 'What amenities sell fastest in 2026?', 'How to price my new tower in Sector 84?', 'Best channel partners in Delhi NCR?'],
};

// Question chips organized by category — shown as quick-tap buttons in chat.
// Picked to cover every intent so users always have a starting point.
const QUESTION_CATEGORIES = [
  {
    label: '📊 Market', questions: [
      'Best area to buy in Gurgaon?', 'Outlook on Sector 77?', 'Is now a good time to buy?',
      'Where are prices appreciating fastest?', 'What\'s trending in NCR?',
    ],
  },
  {
    label: '🏗️ Builders', questions: [
      'Compare DLF vs Godrej', 'Tell me about M3M India', 'How is Sobha quality?', 'Is Emaar worth the premium?',
    ],
  },
  {
    label: '💰 Budget & Loans', questions: [
      'Show villas under ₹3 Cr', 'Best homes under ₹1 Cr', 'Home loan on ₹15L salary?',
      'What\'s the current interest rate?', 'EMI on ₹2 Cr loan?',
    ],
  },
  {
    label: '🛡️ Legal & Tax', questions: [
      'How does RERA work?', 'What stamp duty will I pay?', 'GST on under-construction homes?',
      'Capital gains on selling property?',
    ],
  },
  {
    label: '🤝 Buying tips', questions: [
      'How do I negotiate the price?', 'Best amenities to look for?', 'Trending listings right now?',
    ],
  },
];

const ROLE_PERSONA = {
  buyer: 'PropBot for Buyers',
  broker: 'PropBot for Brokers',
  builder: 'PropBot for Builders',
};

// ============================================================================
// Knowledge base — many topics, with synonyms. Picked by best-match scoring.
// ============================================================================
const INTENTS = [
  {
    id: 'gurgaon',
    keys: ['gurgaon', 'gurugram', 'spr', 'golf course', 'dwarka exp', 'sohna', 'sector 77', 'sector 65'],
    answer: () => `**Gurgaon micro-markets by ROI (2026):**\n• Sector 77 SPR corridor — 14.2% YoY\n• Golf Course Extension — 11.8% YoY\n• Dwarka Expressway — 16.3% YoY (highest)\n\nThe Dwarka Expressway corridor leads, driven by the Q2 2026 metro completion and IMT Manesar industrial growth. SPR is the most balanced — strong appreciation + healthy rental yields (3.2–3.8%).`,
  },
  {
    id: 'compare-builders',
    keys: ['dlf', 'godrej', 'compare', 'vs', 'versus', 'm3m', 'sobha', 'emaar', 'omaxe', 'birla', 'better builder'],
    answer: (msg) => {
      const has = (k) => msg.includes(k);
      if (has('dlf') && has('godrej')) {
        return `**DLF vs Godrej:**\n• DLF: 8–12% brand premium, stronger resale liquidity, but 81% on-time delivery\n• Godrej: 94% on-time delivery, more transparent docs, slightly lower premium\n\n**Investment** → DLF. **End-use** → Godrej. Both RERA-rated 90+.`;
      }
      if (has('m3m')) return `**M3M India:** Strong design language, mid-luxury positioning. M3M Mansion, Antalya Hills are top-rated. Delivery record ~88%. Best value play in Sector 79 / Golf Course Ext.`;
      if (has('sobha')) return `**Sobha Limited:** Bengaluru-rooted, premium construction quality (their RCC standard is industry-leading). Sobha Strada, City are flagships. Slightly higher price/sqft but lower long-term maintenance.`;
      if (has('emaar')) return `**Emaar India:** Dubai DNA, ultra-luxury focus. Marbella, Urban Ascent on Dwarka Expressway are standout. Premium ~15–20% over market. Strong international buyer interest.`;
      return `Pick any two builders and I'll give you a side-by-side. Common comparisons: DLF vs Godrej, M3M vs Signature Global, Sobha vs Prestige.`;
    },
  },
  {
    id: 'roi',
    keys: ['roi', 'return', 'appreciat', 'yield', 'investment', 'rental', 'cap rate', 'capital'],
    answer: (msg, ctx) => {
      const cityHint = ctx.cities.find(c => msg.includes(c.toLowerCase())) || 'Gurgaon';
      return `**Expected appreciation (${cityHint}):**\n• Sector 77 / SPR: +22% by Q4 2027 (current ₹18,500–22,000/sqft)\n• Dwarka Expressway: +25–28% (metro corridor effect)\n• Golf Course Ext: +14–16% (steady, lower volatility)\n\n**Rental yields:** 2.8–3.8% across NCR. Highest in commercial — IT corridors hit 6–7%.`;
    },
  },
  {
    id: 'timing',
    keys: ['time', 'wait', 'now', 'when', 'buy now', 'right time', 'market crash', 'bubble'],
    answer: () => `**Current market read:**\n• Interest rates stable at 8.5–9%\n• Inventory absorption healthy at 78%\n• NCR in demand-supply equilibrium\n\nOur AI models suggest **Q2–Q3 2026 is the window** before prices jump on the next metro/expressway announcements. Short answer: if you have funding + a 5-year horizon, **buy now**. If purely speculating, wait for the next correction.`,
  },
  {
    id: 'budget',
    keys: ['budget', 'price', 'cost', 'afford', 'cheap', 'expensive', 'under 1cr', 'under 50l', '50 lakh', 'crore', 'how much'],
    answer: (msg, ctx) => {
      const m = msg.match(/(\d+)\s*(cr|crore|lakh|l\b)/i);
      const tier = m ? `${m[1]} ${m[2]}` : '₹1Cr';
      const matches = ctx.allProperties.filter(p => {
        if (!m) return p.price <= 10000000;
        const n = parseInt(m[1], 10);
        const factor = /cr/i.test(m[2]) ? 10000000 : 100000;
        return p.price <= n * factor * 1.1;
      }).slice(0, 3);
      const list = matches.map(p => `• ${p.title} — ${formatPriceIndian(p.price)} (${p.location})`).join('\n') || '• No matches in our live inventory at that budget.';
      return `**In your ${tier} budget, ${matches.length} live matches:**\n${list}\n\nTip: stretching ~15% above your budget often unlocks the best-located inventory.`;
    },
  },
  {
    id: 'loan',
    keys: ['loan', 'mortgage', 'emi', 'home loan', 'salary', 'eligibility', 'pre-approval', 'pre approval', 'interest rate', 'tenure'],
    answer: (msg) => {
      const m = msg.match(/(\d+)\s*(l|lakh|lac)/i);
      const salary = m ? parseInt(m[1], 10) : 15;
      const eligible = Math.round(salary * 60); // ~60x monthly salary at 8.75%, 20yr
      return `**Home loan estimate (₹${salary}L annual income):**\n• Eligible amount: ~₹${(eligible/100).toFixed(1)} Cr\n• EMI on ₹${(eligible/100).toFixed(1)} Cr @ 8.75% for 20yr: ~₹${Math.round(eligible*8770/100).toLocaleString('en-IN')}/mo\n• Tenure options: 10/15/20/30 years\n\n**Tip:** Joint loan with spouse can boost eligibility by 60–80%. SBI, HDFC, ICICI lead on NCR builder approvals.`;
    },
  },
  {
    id: 'rera',
    keys: ['rera', 'legal', 'registered', 'compliance', 'occupancy', 'oc', 'completion certificate'],
    answer: () => `**RERA verification matters because:**\n• Builder must escrow 70% of buyer funds in project-specific account\n• Carpet-area-based pricing (not super-area)\n• Penalty for delayed possession (RBI repo rate + 2%)\n\n**Check before you buy:** RERA number on hreraharyana.gov.in or maharera.mahaonline.gov.in. Look for "Registered" status + zero complaints. Our Trust Layer module auto-verifies this for every listing.`,
  },
  {
    id: 'villa',
    keys: ['villa', 'house', 'plot', 'land', 'independent', 'standalone', 'bungalow'],
    answer: (msg, ctx) => {
      const villas = ctx.allProperties.filter(p => /villa/i.test(p.type)).slice(0, 4);
      const list = villas.map(p => `• ${p.title} — ${formatPriceIndian(p.price)}`).join('\n');
      return `**Top villa projects in our inventory:**\n${list}\n\nGurgaon's ultra-luxury villa belt: DLF Camellias, Emaar Marbella, Godrej Aria. Entry price for a 4BHK villa: ~₹4 Cr in Sector 65–77.`;
    },
  },
  {
    id: 'leads',
    keys: ['lead', '99acres', 'magicbricks', 'housing', 'qualified', 'broker', 'commission', 'whatsapp'],
    answer: () => `**Best lead sources for brokers (2026):**\n1. WhatsApp Business broadcasts — 38% response rate (highest)\n2. Hyper-local Instagram reels — 28% reach, low-cost\n3. PropertyInsta CRM auto-nurture — replaces 99acres for under-₹2Cr inventory\n4. Channel Partner network — best for sub-3Cr Gurgaon/Noida\n\n**Qualifying a buyer (3 quick checks):** Loan pre-approval letter, current address (relocation buyers convert 3x), specific timeline.`,
  },
  {
    id: 'trending',
    keys: ['trending', 'popular', 'hot', 'fast moving', 'top selling', 'most viewed', 'hot listing'],
    answer: (msg, ctx) => {
      const t = ctx.allProperties.filter(p => p.trending || p.hot).slice(0, 5);
      const list = t.map(p => `• ${p.title} — ${formatPriceIndian(p.price)} (${p.location})`).join('\n') || '• Trending data warming up — try the Trending Now feed.';
      return `**Trending right now on PropertyInsta:**\n${list}\n\nFast-movers usually share two traits: ready-to-move + a school within 3km. Worth showing first.`;
    },
  },
  {
    id: 'negotiation',
    keys: ['negotiat', 'discount', 'bargain', 'haggle', 'offer below', 'reduce price'],
    answer: () => `**Negotiation playbook:**\n• Resale: 8–12% room on quoted price. Use comparable transactions, not listings.\n• Builder (under-construction): waivers > price cuts. Ask for free club membership, ₹2L floor preference, or 50% stamp duty waiver.\n• Ready inventory: 4–7% room in NCR, 2–4% in Bangalore/Mumbai.\n• **Best timing:** end of quarter (builders chase targets) — Mar, Jun, Sep, Dec.`,
  },
  {
    id: 'amenities',
    keys: ['amenit', 'gym', 'pool', 'clubhouse', 'features', 'facilities', 'security', 'parking', 'smart home'],
    answer: () => `**Amenities that actually drive resale (2026 buyer data):**\n1. EV charging (now 73% of buyers ask)\n2. Pet-friendly common areas (+8% premium)\n3. Co-working space in tower (post-WFH must-have)\n4. Air-purification at lobby/AHU level\n5. Smart-home wiring (Crestron/KNX) — premium adds 12–15%\n\nLess important than 5 years ago: gym, party hall, basic pool.`,
  },
  {
    id: 'tax',
    keys: ['tax', 'stamp duty', 'gst', 'registration', 'capital gain'],
    answer: () => `**Buying-side taxes:**\n• Stamp duty: 5–7% (state-dependent; Haryana 5%, Maharashtra 5%, Karnataka 5%)\n• Registration: 1%\n• GST: 5% on under-construction (no ITC); 0% on ready-to-move\n• TDS: 1% of consideration > ₹50L (deduct at source, pay seller's PAN)\n\n**Selling-side:** Long-term capital gains @ 20% with indexation (held > 24 months). Reinvest under Sec 54 to defer.`,
  },
];

// Conversational variants so back-to-back replies feel different
const PREFIXES = [
  '',
  'Great question — ',
  'Here\'s what the data shows: ',
  'Quick read on that: ',
  'Based on current market signals: ',
];

const FALLBACKS = [
  (ctx) => `I can dig into that. I cover **${ctx.cityCount} cities** and **${ctx.propertyCount} live listings**. Try asking about:\n• A specific city or sector ("Sector 77 outlook?")\n• A builder ("Compare DLF and Godrej")\n• Budget ("Best villas under ₹3 Cr")\n• Loans, RERA, taxes, negotiation, or trending listings.`,
  (ctx) => `I'm not sure I caught that — could you rephrase? I'm strongest on: pricing & ROI, builder comparisons, RERA/legal, home loans, neighborhood trends, and ${ctx.cityCount}-city market reads.`,
  () => `Hmm, I'd like more context. Are you asking about a specific city, builder, project, or stage of the buying journey?`,
];

export default function AICopilotView() {
  const { role } = useRole();
  const { allProperties } = useApp();

  // Build a live context the AI can quote from
  const ctx = useMemo(() => {
    const cities = [...new Set(allProperties.map(p => p.city || deriveCity(p.location || '')).filter(c => c && c !== 'Other'))];
    return {
      allProperties,
      cities,
      cityCount: cities.length,
      propertyCount: allProperties.length,
    };
  }, [allProperties]);

  const [messages, setMessages] = useState([
    {
      id: 1, type: 'ai',
      text: `Hi! I'm your ${ROLE_PERSONA[role]}. I'm wired into ${ctx.propertyCount} live listings across ${ctx.cityCount} cities, plus market analytics, RERA data, and loan tools. Ask me anything — pricing, comparisons, neighborhood outlooks, financing, legal, negotiation.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [activeCat, setActiveCat] = useState(QUESTION_CATEGORIES[0].label);
  const [showChips, setShowChips] = useState(true);
  const endRef = useRef(null);
  const replyIdx = useRef(0);  // rotates conversational prefixes
  const fallbackIdx = useRef(0);

  const currentChips = useMemo(
    () => QUESTION_CATEGORIES.find(c => c.label === activeCat)?.questions || [],
    [activeCat]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Score each intent by how many of its keys appear in the message.
  // Returns the best-scoring intent's answer, or a varied fallback.
  const getResponse = (msg) => {
    const lower = msg.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const intent of INTENTS) {
      let score = 0;
      for (const k of intent.keys) if (lower.includes(k)) score += k.length > 4 ? 2 : 1;
      if (score > bestScore) { best = intent; bestScore = score; }
    }
    if (best && bestScore > 0) {
      const prefix = PREFIXES[replyIdx.current % PREFIXES.length];
      replyIdx.current += 1;
      return prefix + best.answer(lower, ctx);
    }
    const fb = FALLBACKS[fallbackIdx.current % FALLBACKS.length];
    fallbackIdx.current += 1;
    return fb(ctx);
  };

  // Call the Vercel /api/chat serverless function (which holds the real
  // Anthropic key server-side). Falls back to the local rule-based intents
  // if the API isn't configured / fails — chat never breaks.
  const callApi = async (userMsg) => {
    const history = [...messages, { id: Date.now(), type: 'user', text: userMsg }];
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          context: {
            cityCount: ctx.cityCount,
            propertyCount: ctx.propertyCount,
            // Send a small sample so Claude can reference real listings
            sampleListings: ctx.allProperties.slice(0, 12).map(p => ({
              title: p.title, location: p.location, price: p.price,
              bedrooms: p.bedrooms, area: p.area, builder: p.builder,
            })),
          },
        }),
      });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const data = await resp.json();
      if (data?.reply) return data.reply;
      throw new Error('empty reply');
    } catch (err) {
      console.warn('[AI Copilot] API unavailable, using local fallback:', err.message);
      return getResponse(userMsg);
    }
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: msg }]);
    setThinking(true);
    const reply = await callApi(msg);
    setThinking(false);
    setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: reply }]);
  };

  return (
    <div className="os-module-page">
      <div className="os-module-header">
        <div className="os-module-icon-lg">🤖</div>
        <div>
          <h1>AI Real Estate Copilot</h1>
          <p>AI assistant powered by market data, RERA database & infrastructure intelligence</p>
        </div>
        <span className="os-module-badge beta">Beta</span>
      </div>

      <div className="ai-copilot-layout">
        <div className="ai-sidebar">
          <h4>Suggested Questions</h4>
          {(ROLE_PROMPTS[role] || ROLE_PROMPTS.buyer).map((p, i) => (
            <button key={i} className="ai-prompt-chip" onClick={() => send(p)}>{p}</button>
          ))}
          <div className="ai-capabilities">
            <h4>Capabilities</h4>
            <ul>
              <li>📊 Market trend analysis</li>
              <li>🔍 Property comparison</li>
              <li>📈 Appreciation forecasting</li>
              <li>🛡️ RERA database lookup</li>
              <li>🏦 Loan eligibility check</li>
              <li>🚇 Infrastructure impact</li>
              <li>💼 Investment advice</li>
            </ul>
          </div>
        </div>

        <div className="ai-chat-area">
          <div className="ai-messages">
            {messages.map(m => (
              <div key={m.id} className={`ai-msg ${m.type}`}>
                {m.type === 'ai' && (
                  <div className="ai-avatar-icon">🤖</div>
                )}
                <div className="ai-msg-bubble">
                  {m.text.split('\n').map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="ai-msg ai">
                <div className="ai-avatar-icon">🤖</div>
                <div className="ai-msg-bubble thinking">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Question chips — quick-tap options */}
          {showChips && !thinking && (
            <div className="ai-chips-block">
              <div className="ai-chips-head">
                <span className="ai-chips-title">💡 Try asking</span>
                <span className="ai-chips-caption">Pick a topic, then tap a question</span>
                <button className="ai-chips-hide" onClick={() => setShowChips(false)} title="Hide suggestions">✕</button>
              </div>
              <div className="ai-chips-tabs" role="tablist" aria-label="Question topics">
                {QUESTION_CATEGORIES.map(c => (
                  <button
                    key={c.label}
                    role="tab"
                    aria-selected={activeCat === c.label}
                    className={`ai-chips-tab ${activeCat === c.label ? 'active' : ''}`}
                    onClick={() => setActiveCat(c.label)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="ai-chips-row">
                {currentChips.map((q, i) => (
                  <button key={i} className="ai-chip-btn" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!showChips && (
            <button className="ai-chips-show" onClick={() => setShowChips(true)}>💡 Show question suggestions</button>
          )}

          <div className="ai-input-row">
            <input
              type="text"
              placeholder="Ask about any property, market, builder, loan or investment…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button className="os-btn-primary" onClick={() => send()} disabled={!input.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
