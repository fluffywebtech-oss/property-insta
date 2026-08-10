// =============================================================================
// PropertyInsta AI Copilot — Vercel serverless proxy to Anthropic Claude.
// The ANTHROPIC_API_KEY lives only in Vercel env vars and is NEVER shipped to
// the browser. Frontend POSTs { messages, context } here and gets a reply.
// =============================================================================

const SYSTEM_PROMPT = `You are PropertyInsta AI Copilot, a knowledgeable, friendly real-estate assistant for the Indian property market.

You help users with:
- Property discovery (apartments, villas, plots, commercial)
- Indian builder/developer comparisons (DLF, Godrej, M3M, Sobha, Emaar, Omaxe, etc.)
- City/locality market trends and price appreciation (Gurgaon, Delhi NCR, Mumbai, Bangalore, Hyderabad, Pune, Chennai, Kolkata, etc.)
- Home loan eligibility and EMI calculations (rates ~8.5-9% in India)
- RERA, stamp duty, GST, registration, capital gains tax
- Negotiation tactics, amenities to look for, timing the market
- Investment analysis (ROI, rental yields, fractional ownership)

Style guide:
- Be concise but specific. Use real numbers and concrete examples.
- Use markdown: **bold** for key terms, bullet lists for breakdowns.
- All currency in INR with Indian formatting (₹1.5 Cr, ₹85 L, ₹12,500/sqft).
- When the user asks about specific properties, use the inventory provided in the context.
- If asked something outside Indian real estate, politely redirect.
- Never make up specific properties or fake transactions — only reference what's in the provided context.`;

export default async function handler(req, res) {
  // CORS (same-origin in production, but allow preflight)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI service not configured',
      detail: 'ANTHROPIC_API_KEY is not set on the server.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { messages = [], context = {} } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Build a context block from live inventory the user might ask about
    let contextBlock = '';
    if (context.cityCount || context.propertyCount) {
      contextBlock += `\nLive platform context:\n- ${context.propertyCount || 0} properties across ${context.cityCount || 0} Indian cities\n`;
    }
    if (Array.isArray(context.sampleListings) && context.sampleListings.length) {
      contextBlock += `\nSample of current inventory:\n`;
      context.sampleListings.slice(0, 12).forEach(p => {
        contextBlock += `- ${p.title} | ${p.location} | ₹${p.price} | ${p.bedrooms || '-'} BHK | ${p.area || '-'} sqft | builder: ${p.builder || '-'}\n`;
      });
    }

    const system = SYSTEM_PROMPT + (contextBlock ? `\n\nCONTEXT (use this when relevant):${contextBlock}` : '');

    // Map our message format → Anthropic's
    const anthropicMessages = messages
      .filter(m => m.type === 'user' || m.type === 'ai')
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: String(m.text || '').slice(0, 8000),
      }));

    // Ensure last message is from the user
    if (anthropicMessages[anthropicMessages.length - 1]?.role !== 'user') {
      return res.status(400).json({ error: 'last message must be from user' });
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 800,
        system,
        messages: anthropicMessages,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Anthropic API error:', resp.status, errText);
      return res.status(resp.status).json({
        error: 'Upstream AI error',
        status: resp.status,
        detail: errText.slice(0, 500),
      });
    }

    const data = await resp.json();
    const reply = data?.content?.[0]?.text || '';

    return res.status(200).json({
      reply,
      usage: data?.usage || null,
    });
  } catch (e) {
    console.error('AI proxy exception:', e);
    return res.status(500).json({ error: 'AI proxy failed', detail: String(e?.message || e) });
  }
}
