import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { formatPriceIndian } from '../data';

// =============================================================================
// PropertyTour — an immersive, agent-narrated guided tour of a single property.
//
// • Visuals: auto-advancing, stories-style photo slideshow with Ken Burns zoom.
// • Sound:   an AI "agent" (Aarav) narrates each scene out loud using the
//            browser's built-in Web Speech API (speechSynthesis) — zero API
//            keys, zero cost, works offline. Prefers an Indian-English voice.
// • Subtitles render the narration on screen so the tour also works muted.
//
// Controls: play/pause, prev/next scene, mute (visual-only), close.
// =============================================================================

const AGENT = { name: 'Aarav', role: 'Your PropertyInsta guide', emoji: '🧑‍💼' };

// Spoken-friendly price (speechSynthesis reads "₹2.30 Cr" awkwardly).
function spokenPrice(price) {
  if (!price) return 'an attractive price';
  if (price >= 1e7) {
    const c = price / 1e7;
    return `${(Math.round(c * 100) / 100).toString().replace(/\.0+$/, '')} crore rupees`;
  }
  if (price >= 1e5) {
    const l = price / 1e5;
    return `${(Math.round(l * 100) / 100).toString().replace(/\.0+$/, '')} lakh rupees`;
  }
  return `${price.toLocaleString('en-IN')} rupees`;
}

// "Apartment" → "an apartment", "Villa" → "a villa".
function withArticle(word) {
  const w = (word || 'property').toLowerCase();
  return `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`;
}

const IMG_CAPTIONS = [
  'Step inside and take in the space.',
  'Notice the natural light flooding the interiors.',
  'Thoughtfully designed living areas.',
  'The bedrooms are spacious and restful.',
  'Premium finishes throughout the home.',
  'A view worth waking up to.',
];

// Build the ordered list of tour "scenes" from property data.
function buildScenes(property) {
  const media = property.media || property.images || [];
  const pics = media.length ? media : [property.thumbnail].filter(Boolean);
  const pic = (i) => (pics.length ? pics[i % pics.length] : null);

  const scenes = [];
  let imgIdx = 0;
  const nextPic = () => pic(imgIdx++);

  // 1 ─ Welcome
  scenes.push({
    kind: 'intro',
    image: nextPic(),
    caption: `Welcome to ${property.title}`,
    narration:
      `Hi! I'm ${AGENT.name}, your PropertyInsta guide. ` +
      `Welcome to ${property.title}, ` +
      `${withArticle(property.type)} located in ${property.location || 'a prime location'}. ` +
      `Let me give you a quick tour.`,
  });

  // 2 ─ Pricing
  scenes.push({
    kind: 'price',
    image: nextPic(),
    caption: formatPriceIndian(property.price),
    narration:
      `This property is priced at ${spokenPrice(property.price)}. ` +
      (property.pricePerSqft ? `That works out to about ${property.pricePerSqft.toLocaleString('en-IN')} rupees per square foot. ` : '') +
      (property.emiEstimate > 0 ? `You could own it with an E.M.I. starting around ${property.emiEstimate.toLocaleString('en-IN')} rupees a month.` : ''),
  });

  // 3 ─ Configuration
  if (property.bedrooms || property.area) {
    scenes.push({
      kind: 'config',
      image: nextPic(),
      caption: [
        property.bedrooms && `${property.bedrooms} BHK`,
        property.bathrooms && `${property.bathrooms} Bath`,
        property.area && `${property.area} sq.ft`,
      ].filter(Boolean).join('  ·  '),
      narration:
        (property.bedrooms ? `It offers a ${property.bedrooms} B.H.K. configuration ` : 'It offers a comfortable layout ') +
        (property.bathrooms ? `with ${property.bathrooms} bathrooms, ` : '') +
        (property.area ? `spread across ${property.area} square feet. ` : '. ') +
        (property.facing && property.facing !== 'Not Set' ? `The home is ${property.facing}-facing, so you get plenty of natural light.` : ''),
    });
  }

  // 4 ─ Walkthrough scenes for extra images
  const remaining = Math.max(0, pics.length - imgIdx);
  for (let k = 0; k < Math.min(remaining, 4); k++) {
    scenes.push({
      kind: 'walk',
      image: nextPic(),
      caption: IMG_CAPTIONS[k % IMG_CAPTIONS.length],
      narration: IMG_CAPTIONS[k % IMG_CAPTIONS.length],
    });
  }

  // 5 ─ Amenities
  if (property.amenities?.length) {
    const top = property.amenities.slice(0, 5);
    scenes.push({
      kind: 'amenities',
      image: nextPic(),
      caption: `✨ ${property.amenities.length} amenities`,
      narration:
        `Residents enjoy premium amenities, including ${top.slice(0, -1).join(', ')}${top.length > 1 ? ' and ' : ''}${top[top.length - 1]}.` +
        (property.amenities.length > 5 ? ` And there's plenty more.` : ''),
      chips: top,
    });
  }

  // 6 ─ Neighborhood
  if (Array.isArray(property.neighborhood) && property.neighborhood.length) {
    scenes.push({
      kind: 'neighborhood',
      image: nextPic(),
      caption: '🏘️ The neighborhood',
      narration:
        `The location is well-connected. Nearby you'll find ${property.neighborhood.slice(0, 3).join(', ')}.`,
      chips: property.neighborhood.slice(0, 4),
    });
  }

  // 7 ─ Builder trust
  if (property.builder) {
    scenes.push({
      kind: 'builder',
      image: nextPic(),
      caption: `Built by ${property.builder}`,
      narration:
        `This project is developed by ${property.builder}, a trusted name in Indian real estate` +
        (property.reraId ? `. It's RERA registered under ${property.reraId}, so you can buy with confidence.` : '.'),
    });
  }

  // 8 ─ Closing
  scenes.push({
    kind: 'closing',
    image: pic(0),
    caption: 'Ready to make it yours?',
    narration:
      `That's the tour of ${property.title}! ` +
      `If you love what you see, you can save it, schedule a site visit, or get a home-loan quote right here. ` +
      `Thanks for touring with PropertyInsta!`,
  });

  return scenes;
}

// Pick the best available voice — prefer Indian English, then any English.
function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;
  return (
    voices.find(v => /en[-_]IN/i.test(v.lang)) ||
    voices.find(v => /en[-_]IN/i.test(v.name)) ||
    voices.find(v => /en[-_]GB/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
    voices[0]
  );
}

export default function PropertyTour({ property, onClose, onSchedule, onSave, saved }) {
  const scenes = useMemo(() => buildScenes(property), [property]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

  const voiceRef = useRef(null);
  const advanceTimer = useRef(null);
  const idxRef = useRef(0);
  const playingRef = useRef(true);
  const mutedRef = useRef(false);
  idxRef.current = idx;
  playingRef.current = playing;
  mutedRef.current = muted;

  const scene = scenes[idx];
  const isLast = idx === scenes.length - 1;

  // Load voices (async in most browsers).
  useEffect(() => {
    if (!supported) return;
    const load = () => { voiceRef.current = pickVoice(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  const clearTimers = useCallback(() => {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
  }, []);

  const goTo = useCallback((next) => {
    clearTimers();
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
    if (next < 0) next = 0;
    if (next >= scenes.length) { setPlaying(false); return; }
    setPlaying(true);
    idxRef.current = next; // update immediately so rapid synchronous steps compound
    setIdx(next);
  }, [clearTimers, scenes.length, supported]);

  // Step relative to the *current* index (ref-based — robust to rapid clicks).
  const step = useCallback((delta) => goTo(idxRef.current + delta), [goTo]);

  // Speak (or, if muted/unsupported, just time-advance) the current scene.
  useEffect(() => {
    if (!scene) return;
    clearTimers();

    // Estimated read time as a fallback / muted-mode pacing (~14 chars/sec).
    const estMs = Math.max(3200, Math.min(11000, scene.narration.length * 65));

    const scheduleAdvance = (ms) => {
      advanceTimer.current = setTimeout(() => {
        if (!playingRef.current) return;
        if (idxRef.current < scenes.length - 1) setIdx(i => i + 1);
        else setPlaying(false);
      }, ms);
    };

    if (!playing) return;

    if (muted || !supported) {
      if (supported) window.speechSynthesis.cancel();
      setSpeaking(false);
      scheduleAdvance(estMs);
      return;
    }

    // Speak via Web Speech API.
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(scene.narration);
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.lang = voiceRef.current?.lang || 'en-IN';
    utter.rate = 0.97;
    utter.pitch = 1.02;
    utter.volume = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => {
      setSpeaking(false);
      if (!playingRef.current) return;
      // brief beat between scenes
      advanceTimer.current = setTimeout(() => {
        if (!playingRef.current) return;
        if (idxRef.current < scenes.length - 1) setIdx(i => i + 1);
        else setPlaying(false);
      }, 650);
    };
    utter.onerror = () => { setSpeaking(false); scheduleAdvance(estMs); };

    // Tiny delay lets cancel() settle on some browsers.
    const t = setTimeout(() => window.speechSynthesis.speak(utter), 90);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, playing, muted, supported]);

  // Pause/resume speech synthesis when toggling play.
  useEffect(() => {
    if (!supported) return;
    if (playing) window.speechSynthesis.resume();
    else { window.speechSynthesis.pause(); clearTimers(); }
  }, [playing, supported, clearTimers]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimers();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [clearTimers]);

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goTo(idxRef.current + 1);
      else if (e.key === 'ArrowLeft') goTo(idxRef.current - 1);
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, onClose]);

  if (!scene) return null;

  return (
    <div className="pi-tour" role="dialog" aria-label="Guided property tour">
      {/* Background image with Ken Burns zoom */}
      <div className="pi-tour-stage">
        {scenes.map((s, i) => (
          <div
            key={i}
            className={`pi-tour-slide ${i === idx ? 'active' : ''} ${i === idx && playing ? 'kenburns' : ''}`}
            style={s.image ? { backgroundImage: `url("${s.image}")` } : undefined}
            aria-hidden={i !== idx}
          />
        ))}
        <div className="pi-tour-scrim" />
      </div>

      {/* Stories-style segment progress */}
      <div className="pi-tour-segments">
        {scenes.map((_, i) => (
          <button
            key={i}
            className={`pi-tour-seg ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to scene ${i + 1}`}
          >
            <span className="pi-tour-seg-fill" />
          </button>
        ))}
      </div>

      {/* Top bar */}
      <div className="pi-tour-topbar">
        <div className="pi-tour-agent">
          <span className={`pi-tour-avatar ${speaking ? 'speaking' : ''}`}>{AGENT.emoji}</span>
          <div className="pi-tour-agent-info">
            <strong>{AGENT.name}</strong>
            <span>{speaking ? 'Speaking…' : AGENT.role}</span>
          </div>
        </div>
        <button className="pi-tour-close" onClick={onClose} aria-label="Close tour">✕</button>
      </div>

      {/* Tap zones for prev/next */}
      <button className="pi-tour-tap left" onClick={() => step(-1)} aria-label="Previous" />
      <button className="pi-tour-tap right" onClick={() => step(1)} aria-label="Next" />

      {/* Caption / subtitles */}
      <div className="pi-tour-caption-wrap">
        <div className={`pi-tour-kind pi-tour-kind-${scene.kind}`}>{scene.caption}</div>
        <p className="pi-tour-subtitle">{scene.narration}</p>
        {scene.chips?.length > 0 && (
          <div className="pi-tour-chips">
            {scene.chips.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        )}

        {isLast && (
          <div className="pi-tour-end-actions">
            <button className="primary" onClick={() => { onSchedule?.(); onClose(); }}>📅 Schedule Visit</button>
            <button className="ghost" onClick={() => { onSave?.(); }}>{saved ? '♥ Saved' : '♡ Save'}</button>
          </div>
        )}
      </div>

      {/* Bottom control bar */}
      <div className="pi-tour-controls">
        <button onClick={() => step(-1)} disabled={idx === 0} aria-label="Previous scene">⏮</button>
        <button className="play" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button onClick={() => step(1)} disabled={isLast} aria-label="Next scene">⏭</button>
        <span className="pi-tour-counter">{idx + 1} / {scenes.length}</span>
        <button
          className={`pi-tour-mute ${muted ? 'on' : ''}`}
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? 'Unmute narration' : 'Mute narration'}
          title={muted ? 'Unmute narration' : 'Mute narration'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {!supported && (
        <div className="pi-tour-novoice">🔇 Voice narration isn’t supported in this browser — showing subtitles instead.</div>
      )}
    </div>
  );
}
