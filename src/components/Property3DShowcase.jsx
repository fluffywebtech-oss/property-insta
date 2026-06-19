import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { formatPriceIndian } from '../data';

// =============================================================================
// Property3DShowcase — a real interactive 3D model of the property rendered
// with three.js (orbit / zoom / pan), plus an AI "3D Advisor" (Riya) that
// flies the camera to key features and explains them out loud via the free
// Web Speech API. Zero external 3D assets — the building is generated
// procedurally from the listing's own data (type, floors, facing, price).
// =============================================================================

const ADVISOR = { name: 'Riya', role: 'Your 3D property advisor', emoji: '👩‍💼' };

// ── Derive building geometry params from the listing ────────────────────────
function deriveBuild(property) {
  const type = (property.type || 'apartment').toLowerCase();
  const isVilla = /villa|independent|bungalow|plot|row/.test(type);
  const isCommercial = /commercial|office|retail|shop/.test(type);

  // total floors
  let total = property.totalFloors || property.floors;
  if (!total && property.floor) {
    const m = String(property.floor).match(/of\s*(\d+)/i) || String(property.floor).match(/(\d+)\s*floors?/i);
    if (m) total = parseInt(m[1], 10);
  }
  if (!total) total = isVilla ? 2 : isCommercial ? 18 : /penthouse/.test(type) ? 30 : 22;
  total = Math.max(isVilla ? 2 : 6, Math.min(total, 48));

  // your floor
  let yourFloor = 0;
  if (property.floor) {
    const m = String(property.floor).match(/(\d+)/);
    if (m) yourFloor = Math.min(parseInt(m[1], 10), total);
  }
  if (!yourFloor) yourFloor = Math.round(total * 0.6);

  const facing = (property.facing && property.facing !== 'Not Set') ? property.facing : 'East';

  return { type, isVilla, isCommercial, total, yourFloor, facing };
}

// ── Procedural window texture (lit / unlit grid) ────────────────────────────
function makeWindowTexture(cols, rows, tint = '#2a3550') {
  const c = document.createElement('canvas');
  c.width = cols * 32; c.height = rows * 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = Math.random() > 0.55;
      ctx.fillStyle = lit
        ? `rgba(255,${210 + Math.random() * 40 | 0},${150 + Math.random() * 60 | 0},0.95)`
        : 'rgba(120,150,190,0.5)';
      ctx.fillRect(x * 32 + 5, y * 32 + 6, 22, 20);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Facing → compass azimuth degrees (0 = North), used to place the sun.
const FACING_DEG = { N: 0, North: 0, NE: 45, E: 90, East: 90, SE: 135, S: 180, South: 180, SW: 225, W: 270, West: 270, NW: 315 };

export default function Property3DShowcase({ property, onClose, onSchedule, onSave, saved }) {
  const mountRef = useRef(null);
  const sceneApi = useRef(null);      // holds three.js objects between renders
  const hotspotEls = useRef({});      // id -> DOM node
  const flyTarget = useRef(null);     // { pos, look } camera tween target
  const autoRotateRef = useRef(true);

  const build = useMemo(() => deriveBuild(property), [property]);

  const [ready, setReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [hotspots, setHotspots] = useState([]); // [{id,label,x,y,visible}]
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const voiceRef = useRef(null);

  // ── Advisor topics (generated from data) ─────────────────────────────────
  const topics = useMemo(() => {
    const sunWord = /east/i.test(build.facing) ? 'gentle morning sunlight'
      : /west/i.test(build.facing) ? 'warm afternoon and evening light'
      : /north/i.test(build.facing) ? 'soft, even daylight with low heat'
      : 'bright, sunny exposure through the day';
    const floorWord = build.yourFloor >= build.total * 0.75 ? 'a commanding high-rise vantage'
      : build.yourFloor >= build.total * 0.4 ? 'a comfortable mid-rise height'
      : 'an easy, low-floor convenience';
    return [
      {
        id: 'overview', icon: '🏢', label: 'Overview',
        tip: `A ${build.total}-storey ${build.type} project.`,
        say: `Let's take a look at ${property.title}. It's ${build.isVilla ? 'a low-rise home' : `a ${build.total}-storey tower`}, priced at ${spoken(property.price)}. Drag to orbit the model — I'll walk you through it.`,
        cam: 'overview',
      },
      {
        id: 'orientation', icon: '🧭', label: 'Sunlight & Facing',
        tip: `${build.facing}-facing — ${sunWord}.`,
        say: `This home is ${build.facing}-facing. That means you get ${sunWord}. Watch how the sun falls on the building from this side.`,
        cam: 'sun',
      },
      {
        id: 'unit', icon: '📍', label: build.isVilla ? 'Your Home' : 'Your Floor',
        tip: build.isVilla ? 'Your independent home.' : `Floor ${build.yourFloor} of ${build.total}.`,
        say: build.isVilla
          ? `Here's your home, highlighted in gold. As an independent unit, you get privacy and your own outdoor space.`
          : `Your unit is on floor ${build.yourFloor}, highlighted in gold. That gives you ${floorWord}, well above the street.`,
        cam: 'unit',
      },
      {
        id: 'amenities', icon: '🏊', label: build.isVilla ? 'Outdoor Space' : 'Sky Deck',
        tip: property.amenities?.length ? `${property.amenities.length} amenities.` : 'Premium amenities.',
        say: property.amenities?.length
          ? `${build.isVilla ? 'Your garden and deck sit here' : 'Up on the rooftop deck you have'} amenities like ${property.amenities.slice(0, 3).join(', ')}.`
          : `${build.isVilla ? 'Enjoy your private outdoor space.' : 'The rooftop deck offers open sky and city views.'}`,
        cam: 'deck',
      },
      {
        id: 'surroundings', icon: '🌳', label: 'Surroundings',
        tip: `${property.location || 'Prime location'}.`,
        say: `Looking around, ${property.title} sits in ${property.location || 'a prime neighbourhood'}, surrounded by greenery and well-connected roads.`,
        cam: 'wide',
      },
    ];
  }, [build, property]);

  // ── Build the three.js scene once ────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth, H = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcdd9ec, 80, 320);

    // Sky gradient background
    scene.background = new THREE.Color(0xbcd2f0);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Lighting ──
    const hemi = new THREE.HemisphereLight(0xffffff, 0x6b7a90, 0.9);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.55);
    const az = (FACING_DEG[build.facing] ?? 90) * Math.PI / 180;
    sun.position.set(Math.sin(az) * 60, 70, Math.cos(az) * 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 260;
    sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
    sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
    scene.add(sun);

    // ── Ground ──
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(160, 64),
      new THREE.MeshStandardMaterial({ color: 0x7ba05b, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // plaza pad under building
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(26, 48),
      new THREE.MeshStandardMaterial({ color: 0xb9c0c9, roughness: 0.9 })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    plaza.receiveShadow = true;
    scene.add(plaza);

    // ── The building ──
    const group = new THREE.Group();
    scene.add(group);

    const fh = 1.5;                          // floor height
    const podiumH = build.isVilla ? 0 : 2.4;
    const bw = build.isVilla ? 16 : 11;      // width
    const bd = build.isVilla ? 12 : 11;      // depth
    const towerH = build.total * fh;
    const totalH = podiumH + towerH;

    // window texture
    const winTex = makeWindowTexture(Math.round(bw / 1.4), build.total, build.isCommercial ? '#1d2740' : '#28324c');
    winTex.wrapS = winTex.wrapT = THREE.ClampToEdgeWrapping;

    const concrete = new THREE.MeshStandardMaterial({ color: build.isCommercial ? 0x9fb3cc : 0xe9eef5, roughness: 0.75, metalness: 0.05 });
    const glass = new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.35, metalness: 0.25, color: 0xffffff });

    // podium
    if (podiumH > 0) {
      const podium = new THREE.Mesh(new THREE.BoxGeometry(bw + 5, podiumH, bd + 5), concrete);
      podium.position.y = podiumH / 2;
      podium.castShadow = podium.receiveShadow = true;
      group.add(podium);
    }

    // main mass — glass on the two broad faces, concrete on sides
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(bw, towerH, bd),
      [glass, glass, concrete, concrete, glass, glass]
    );
    tower.position.y = podiumH + towerH / 2;
    tower.castShadow = tower.receiveShadow = true;
    group.add(tower);

    // villa pitched roof
    if (build.isVilla) {
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(bw * 0.78, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0xb5532f, roughness: 0.85 })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = totalH + 2;
      roof.castShadow = true;
      group.add(roof);
    } else {
      // rooftop deck slab + railing + a couple of amenity blocks
      const deck = new THREE.Mesh(new THREE.BoxGeometry(bw + 1, 0.4, bd + 1),
        new THREE.MeshStandardMaterial({ color: 0x6f7d8c, roughness: 0.9 }));
      deck.position.y = totalH + 0.2;
      deck.castShadow = deck.receiveShadow = true;
      group.add(deck);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.5, 0.3, bd * 0.35),
        new THREE.MeshStandardMaterial({ color: 0x35a7d8, roughness: 0.2, metalness: 0.3 }));
      pool.position.set(0, totalH + 0.5, 0);
      group.add(pool);
    }

    // entrance canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 3),
      new THREE.MeshStandardMaterial({ color: 0x3a4658 }));
    canopy.position.set(0, podiumH > 0 ? 2.6 : 2.4, bd / 2 + 3.6);
    canopy.castShadow = true;
    group.add(canopy);

    // ── "Your unit / floor" gold highlight band ──
    const unitY = podiumH + (build.yourFloor - 0.5) * fh;
    const unitMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0xffae00, emissiveIntensity: 0.7, roughness: 0.4 });
    const unitBand = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.5, fh * 0.92, bd + 0.5), unitMat);
    unitBand.position.set(0, unitY, 0);
    group.add(unitBand);
    // glowing ring orbiting the unit
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(bw * 0.95, 0.18, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd45e })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, unitY, 0);
    group.add(ring);

    // ── Surrounding context: neighbour blocks + trees + roads ──
    const ctx = new THREE.Group();
    scene.add(ctx);
    const neighborMat = new THREE.MeshStandardMaterial({ color: 0xc7cfda, roughness: 0.9 });
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + 0.4;
      const r = 42 + Math.random() * 22;
      const h = 6 + Math.random() * 22;
      const nb = new THREE.Mesh(new THREE.BoxGeometry(7 + Math.random() * 5, h, 7 + Math.random() * 5), neighborMat);
      nb.position.set(Math.cos(ang) * r, h / 2, Math.sin(ang) * r);
      nb.castShadow = nb.receiveShadow = true;
      ctx.add(nb);
    }
    // trees
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8f4a, roughness: 1 });
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 22 + Math.random() * 30;
      const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6), trunkMat);
      trunk.position.set(x, 0.8, z);
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3, 8), leafMat);
      leaf.position.set(x, 2.8, z);
      leaf.castShadow = true;
      ctx.add(trunk); ctx.add(leaf);
    }
    // road ring
    const road = new THREE.Mesh(new THREE.RingGeometry(30, 35, 48),
      new THREE.MeshStandardMaterial({ color: 0x3b3f48, roughness: 1 }));
    road.rotation.x = -Math.PI / 2; road.position.y = 0.03;
    scene.add(road);

    // ── Hotspot anchor world positions ──
    const anchors = {
      overview: new THREE.Vector3(0, totalH * 0.55, 0),
      orientation: new THREE.Vector3(Math.sin(az) * bw, totalH * 0.6, Math.cos(az) * bd),
      unit: new THREE.Vector3(0, unitY, bd / 2 + 0.3),
      amenities: new THREE.Vector3(0, totalH + 1.2, 0),
      surroundings: new THREE.Vector3(0, 3, bd / 2 + 14),
    };

    // ── Camera presets {pos, look} ──
    const S = Math.max(bw, totalH);
    const presets = {
      overview: { pos: new THREE.Vector3(S * 1.5, totalH * 0.9, S * 1.7), look: new THREE.Vector3(0, totalH * 0.42, 0) },
      sun:      { pos: new THREE.Vector3(Math.sin(az) * S * 2.0, totalH * 1.0, Math.cos(az) * S * 2.0), look: new THREE.Vector3(0, totalH * 0.5, 0) },
      unit:     { pos: new THREE.Vector3(bw * 1.6, unitY + 2, bd / 2 + bw * 1.7), look: new THREE.Vector3(0, unitY, 0) },
      deck:     { pos: new THREE.Vector3(bw * 1.1, totalH + bw * 1.2, bd * 1.1), look: new THREE.Vector3(0, totalH, 0) },
      wide:     { pos: new THREE.Vector3(S * 2.6, totalH * 1.5, S * 2.8), look: new THREE.Vector3(0, totalH * 0.3, 0) },
    };

    camera.position.copy(presets.overview.pos);

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(presets.overview.look);
    controls.minDistance = bw;
    controls.maxDistance = S * 5;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // don't go under ground
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    // user interaction cancels the fly tween + auto-rotate
    controls.addEventListener('start', () => { flyTarget.current = null; });

    sceneApi.current = { scene, camera, renderer, controls, anchors, presets, ring, mount };

    // ── Render loop ──
    let raf;
    const tmpV = new THREE.Vector3();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.autoRotate = autoRotateRef.current && !flyTarget.current;

      // camera fly tween
      if (flyTarget.current) {
        camera.position.lerp(flyTarget.current.pos, 0.06);
        controls.target.lerp(flyTarget.current.look, 0.06);
        if (camera.position.distanceTo(flyTarget.current.pos) < 0.6) flyTarget.current = null;
      }

      ring.rotation.z += 0.01;
      controls.update();
      renderer.render(scene, camera);

      // project hotspots → screen
      const rect = mount.getBoundingClientRect();
      const next = [];
      for (const [id, pos] of Object.entries(anchors)) {
        tmpV.copy(pos).project(camera);
        const visible = tmpV.z < 1;
        next.push({
          id,
          x: (tmpV.x * 0.5 + 0.5) * rect.width,
          y: (-tmpV.y * 0.5 + 0.5) * rect.height,
          visible,
        });
      }
      setHotspots(next);
    };
    animate();
    setReady(true);

    // ── Resize ──
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose?.(); m.dispose(); });
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      sceneApi.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build]);

  // keep autoRotate ref in sync
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  // load a voice
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      voiceRef.current = vs.find(v => /en[-_]IN/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.cancel(); };
  }, [supported]);

  const speak = useCallback((text) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.lang = voiceRef.current?.lang || 'en-IN';
    u.rate = 0.97; u.pitch = 1.05;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setTimeout(() => window.speechSynthesis.speak(u), 80);
  }, [supported]);

  // fly camera + narrate for a topic
  const goTopic = useCallback((topic) => {
    const api = sceneApi.current;
    if (!api) return;
    setActiveTopic(topic.id);
    const preset = api.presets[topic.cam] || api.presets.overview;
    flyTarget.current = { pos: preset.pos.clone(), look: preset.look.clone() };
    setAutoRotate(false);
    speak(topic.say);
  }, [speak]);

  // auto-run the full advisor walkthrough
  const runFullRef = useRef(false);
  const playFull = useCallback(() => {
    runFullRef.current = true;
    let i = 0;
    const next = () => {
      if (!runFullRef.current || i >= topics.length) { runFullRef.current = false; return; }
      const t = topics[i++];
      goTopic(t);
      // advance when speech ends (or after fallback delay)
      const est = Math.max(4200, t.say.length * 60);
      const check = setInterval(() => {
        if (!runFullRef.current) { clearInterval(check); return; }
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          clearInterval(check); setTimeout(next, 400);
        }
      }, 300);
      // hard fallback
      setTimeout(() => { if (runFullRef.current && i <= topics.length) { /* let interval handle */ } }, est + 4000);
    };
    next();
  }, [topics, goTopic]);

  useEffect(() => () => { runFullRef.current = false; }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const labelFor = (id) => topics.find(t => t.id === id)?.label || id;

  return (
    <div className="pi-3d" role="dialog" aria-label="3D property showcase">
      {/* 3D canvas */}
      <div ref={mountRef} className="pi-3d-canvas" />

      {/* Hotspot markers */}
      {ready && hotspots.map(h => h.visible && (
        <button
          key={h.id}
          className={`pi-3d-hotspot ${activeTopic === h.id ? 'active' : ''}`}
          style={{ left: h.x, top: h.y }}
          onClick={() => { const t = topics.find(t => t.id === h.id); if (t) goTopic(t); }}
        >
          <span className="pi-3d-hotspot-dot" />
          <span className="pi-3d-hotspot-label">{labelFor(h.id)}</span>
        </button>
      ))}

      {/* Top bar */}
      <div className="pi-3d-topbar">
        <div className="pi-3d-title">
          <span className="pi-3d-badge">3D</span>
          <div>
            <strong>{property.title}</strong>
            <span>{property.location}</span>
          </div>
        </div>
        <button className="pi-3d-close" onClick={onClose} aria-label="Close 3D view">✕</button>
      </div>

      {/* Advisor panel */}
      <div className="pi-3d-advisor">
        <div className="pi-3d-advisor-head">
          <span className={`pi-3d-avatar ${speaking ? 'speaking' : ''}`}>{ADVISOR.emoji}</span>
          <div>
            <strong>{ADVISOR.name}</strong>
            <span>{speaking ? 'Speaking…' : ADVISOR.role}</span>
          </div>
        </div>

        <div className="pi-3d-topics">
          {topics.map(t => (
            <button
              key={t.id}
              className={`pi-3d-topic ${activeTopic === t.id ? 'active' : ''}`}
              onClick={() => { runFullRef.current = false; goTopic(t); }}
            >
              <span className="pi-3d-topic-icon">{t.icon}</span>
              <span className="pi-3d-topic-text">
                <strong>{t.label}</strong>
                <small>{t.tip}</small>
              </span>
            </button>
          ))}
        </div>

        <button className="pi-3d-play-full" onClick={playFull}>
          ▶ Play full 3D advisor tour
        </button>

        <div className="pi-3d-cta-row">
          <button className="primary" onClick={() => { onSchedule?.(); onClose(); }}>📅 Schedule Visit</button>
          <button className="ghost" onClick={() => onSave?.()}>{saved ? '♥ Saved' : '♡ Save'}</button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pi-3d-controls">
        <button className={autoRotate ? 'on' : ''} onClick={() => setAutoRotate(r => !r)}>
          {autoRotate ? '⏸ Stop spin' : '↻ Auto-rotate'}
        </button>
        <button onClick={() => { const t = topics[0]; goTopic(t); setActiveTopic(null); setAutoRotate(true); }}>⤢ Reset view</button>
        <span className="pi-3d-hint">🖱️ Drag to orbit · scroll to zoom</span>
      </div>

      {!ready && <div className="pi-3d-loading"><span className="pi-3d-spinner" />Building 3D model…</div>}
    </div>
  );
}

// spoken-friendly price
function spoken(price) {
  if (!price) return 'an attractive price';
  if (price >= 1e7) return `${(Math.round(price / 1e7 * 100) / 100).toString().replace(/\.0+$/, '')} crore rupees`;
  if (price >= 1e5) return `${(Math.round(price / 1e5 * 100) / 100).toString().replace(/\.0+$/, '')} lakh rupees`;
  return `${formatPriceIndian(price)}`;
}
